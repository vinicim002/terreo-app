// Entregas e códigos, encomendas sem código, correspondência e retirada (spec 004, Histórias 1 e 2).
// Uma entidade com estados para tudo (research R1). Avisos só no app e no privado, nunca no grupo (CS-004).
import { dayKeyBrasilia } from "@/i18n/datetime"
import { getIn, listIn, notFound, nowIso, save, type ServiceDeps } from "./base"
import {
  ServiceError,
  type CodeInput,
  type DeliveryService,
  type DeliveryView,
  type ServiceContext,
} from "./contracts"
import { runDue } from "./due"
import {
  activePeopleOf,
  daysBetween,
  deliveryRecipients,
  personName,
  storeLabel,
} from "./front-desk-shared"
import { notify } from "./notify"
import { authorize, loadActor, type Action } from "./permissions"
import type { Delivery } from "./schemas"

const invalid = (field: string, reason: string, message = "Dado inválido.") =>
  new ServiceError("validation", message, { [field]: reason })

const SIZE_LABEL = {
  envelope: "Envelope",
  small: "Caixa pequena",
  medium: "Caixa média",
  large: "Caixa grande",
}
const ARRIVAL_TEXT = {
  elevator: "o porteiro vai mandar pelo elevador",
  "front-desk": "está guardada na portaria",
  call: "o porteiro vai ligar para você",
}

/** Apartamento do morador conectado, conferindo a ação na matriz. */
export async function ownApartment(deps: ServiceDeps, ctx: ServiceContext, action: Action) {
  const info = await loadActor(deps, ctx)
  return authorize(deps, ctx, action, { apartmentId: info?.apartmentId })
}

export async function apartmentByNumber(deps: ServiceDeps, condominiumId: string, number: string) {
  const apt = (await listIn(deps, "apartments", condominiumId)).find((a) => a.number === number)
  if (!apt) throw notFound("Apartamento")
  return apt
}

export async function deliveryView(deps: ServiceDeps, d: Delivery): Promise<DeliveryView> {
  const apt = await deps.repo.get("apartments", d.apartmentId)
  return {
    id: d.id,
    apartment: apt?.number ?? "",
    origin: d.origin,
    store: d.store,
    storeName: d.storeName,
    code: d.code,
    note: d.note,
    onArrival: d.onArrival,
    size: d.size,
    photo: d.photo,
    status: d.status,
    createdAt: d.createdAt,
    createdBy: (await personName(deps, d.createdById)) ?? "",
    arrivedAt: d.arrivedAt,
    receivedBy: await personName(deps, d.receivedById),
    pickedUpAt: d.pickedUpAt,
    pickedUpBy: await personName(deps, d.pickedUpById),
    daysAtDesk: d.status === "at-desk" ? daysBetween(d.arrivedAt ?? d.createdAt, deps.now()) : null,
  }
}

/** Cria um código aguardando (pelo app ou pela mensagem no WhatsApp). */
export async function createCode(
  deps: ServiceDeps,
  condominiumId: string,
  apartmentId: string,
  personId: string,
  origin: "app" | "whatsapp",
  input: CodeInput,
) {
  return save(deps, "deliveries", {
    id: deps.uuid(),
    condominiumId,
    apartmentId,
    origin,
    store: input.store,
    storeName: input.store === "other" ? (input.storeName?.trim() ?? null) : null,
    code: input.code.trim(),
    note: input.note?.trim() || null,
    onArrival: input.onArrival,
    size: null,
    photo: null,
    status: "awaiting",
    notifyResident: true,
    createdById: personId,
    createdAt: nowIso(deps),
    arrivedAt: null,
    receivedById: null,
    pickedUpAt: null,
    pickedUpById: null,
    pickupRegisteredById: null,
    lastReminderDay: null,
    deletedAt: null,
  })
}

const byDateDesc = (a: Delivery, b: Delivery) =>
  (b.pickedUpAt ?? b.arrivedAt ?? b.createdAt).localeCompare(
    a.pickedUpAt ?? a.arrivedAt ?? a.createdAt,
  )

export function deliveryService(deps: ServiceDeps): DeliveryService {
  async function load(ctx: ServiceContext, id: string) {
    const d = await getIn(deps, "deliveries", ctx.condominiumId, id, "Entrega")
    if (d.deletedAt) throw notFound("Entrega")
    return d
  }

  async function announce(d: Delivery, title: string, body: string, type: "delivery" | "mail") {
    if (!d.notifyResident) return
    await notify(deps, d.condominiumId, {
      type,
      audience: { personIds: await deliveryRecipients(deps, d) },
      title,
      body,
      target: { kind: "delivery", id: d.id },
    })
  }

  async function aptOfActor(ctx: ServiceContext, action: Action, apartmentId: string) {
    return authorize(deps, ctx, action, { apartmentId })
  }

  return {
    async mine(ctx) {
      const actor = await ownApartment(deps, ctx, "delivery.viewOwn")
      await runDue(deps, ctx.condominiumId)
      const all = (await deps.repo.byIndex("deliveries", "byApartment", actor.apartmentId!))
        .filter((d) => !d.deletedAt)
        .sort(byDateDesc)
      const views = async (list: Delivery[]) => Promise.all(list.map((d) => deliveryView(deps, d)))
      const thirtyDays = deps.now().getTime() - 30 * 86_400_000
      return {
        awaiting: await views(all.filter((d) => d.status === "awaiting")),
        atDesk: await views(all.filter((d) => d.status === "at-desk")),
        done: await views(
          all.filter(
            (d) =>
              ["delivered", "picked-up", "not-arrived"].includes(d.status) &&
              new Date(d.pickedUpAt ?? d.arrivedAt ?? d.createdAt).getTime() >= thirtyDays,
          ),
        ),
      }
    },

    async registerCode(ctx, input) {
      const actor = await ownApartment(deps, ctx, "delivery.register")
      if (!/^[A-Za-z0-9-]{1,30}$/.test(input.code.trim())) throw invalid("code", "invalid")
      if (input.store === "other" && !input.storeName?.trim())
        throw invalid("storeName", "required")
      if (!input.confirmDuplicate) {
        const today = dayKeyBrasilia(deps.now())
        const existing = await deps.repo.byIndex("deliveries", "byApartment", actor.apartmentId!)
        const dup = existing.some(
          (d) =>
            !d.deletedAt &&
            d.status === "awaiting" &&
            d.store === input.store &&
            (input.store !== "other" || d.storeName === input.storeName?.trim()) &&
            dayKeyBrasilia(d.createdAt) === today,
        )
        if (dup) throw invalid("code", "duplicate", "Já existe um código desta loja hoje.")
      }
      const d = await createCode(
        deps,
        ctx.condominiumId,
        actor.apartmentId!,
        actor.personId,
        "app",
        input,
      )
      return deliveryView(deps, d)
    },

    async cancelCode(ctx, id) {
      const d = await load(ctx, id)
      await aptOfActor(ctx, "delivery.register", d.apartmentId)
      if (d.status !== "awaiting") throw invalid("status", "not_awaiting")
      await save(deps, "deliveries", { ...d, deletedAt: nowIso(deps) })
    },

    async pickUp(ctx, id) {
      const d = await load(ctx, id)
      const actor = await aptOfActor(ctx, "delivery.pickUp", d.apartmentId)
      if (d.status !== "at-desk") throw invalid("status", "not_at_desk")
      const now = nowIso(deps)
      const updated = await save(deps, "deliveries", {
        ...d,
        status: "picked-up",
        pickedUpAt: now,
        pickedUpById: actor.personId,
        pickupRegisteredById: actor.personId,
      })
      return deliveryView(deps, updated)
    },

    async byApartment(ctx, number) {
      await authorize(deps, ctx, "desk.operate")
      await runDue(deps, ctx.condominiumId)
      const apt = await apartmentByNumber(deps, ctx.condominiumId, number)
      const list = (await deps.repo.byIndex("deliveries", "byApartment", apt.id))
        .filter((d) => !d.deletedAt && (d.status === "awaiting" || d.status === "at-desk"))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      return Promise.all(list.map((d) => deliveryView(deps, d)))
    },

    async markArrived(ctx, id) {
      const actor = await authorize(deps, ctx, "desk.operate")
      const d = await load(ctx, id)
      if (d.status !== "awaiting") throw invalid("status", "not_awaiting")
      const now = nowIso(deps)
      const updated = await save(deps, "deliveries", {
        ...d,
        status: d.onArrival === "front-desk" ? "at-desk" : "delivered",
        arrivedAt: now,
        receivedById: actor.personId,
      })
      const store = storeLabel(d) ?? "Entrega"
      await announce(
        updated,
        `${store} chegou`,
        `Sua entrega ${store} (${d.code}) chegou: ${ARRIVAL_TEXT[d.onArrival ?? "front-desk"]}.`,
        "delivery",
      )
      return deliveryView(deps, updated)
    },

    async receive(ctx, input) {
      const actor = await authorize(deps, ctx, "desk.operate")
      const apt = await apartmentByNumber(deps, ctx.condominiumId, input.apartmentNumber)
      if (input.store === "other" && !input.storeName?.trim())
        throw invalid("storeName", "required")
      const now = nowIso(deps)
      const d = await save(deps, "deliveries", {
        id: deps.uuid(),
        condominiumId: ctx.condominiumId,
        apartmentId: apt.id,
        origin: "front-desk",
        store: input.store,
        storeName: input.store === "other" ? (input.storeName?.trim() ?? null) : null,
        code: null,
        note: null,
        onArrival: null,
        size: input.size,
        photo: input.photo,
        status: "at-desk",
        notifyResident: input.notifyResident,
        createdById: actor.personId,
        createdAt: now,
        arrivedAt: now,
        receivedById: actor.personId,
        pickedUpAt: null,
        pickedUpById: null,
        pickupRegisteredById: null,
        lastReminderDay: null,
        deletedAt: null,
      })
      const what = `${SIZE_LABEL[input.size]} · ${storeLabel(d)}`
      await announce(
        d,
        "Encomenda na portaria",
        `${what}${d.photo ? " (foto anexada)" : ""}. Passe na portaria para buscar.`,
        "delivery",
      )
      return deliveryView(deps, d)
    },

    async mail(ctx, number) {
      const actor = await authorize(deps, ctx, "desk.operate")
      const apt = await apartmentByNumber(deps, ctx.condominiumId, number)
      const now = nowIso(deps)
      const d = await save(deps, "deliveries", {
        id: deps.uuid(),
        condominiumId: ctx.condominiumId,
        apartmentId: apt.id,
        origin: "mail",
        store: null,
        storeName: null,
        code: null,
        note: null,
        onArrival: null,
        size: null,
        photo: null,
        status: "at-desk",
        notifyResident: true,
        createdById: actor.personId,
        createdAt: now,
        arrivedAt: now,
        receivedById: actor.personId,
        pickedUpAt: null,
        pickedUpById: null,
        pickupRegisteredById: null,
        lastReminderDay: null,
        deletedAt: null,
      })
      await announce(d, "Correspondência", "Chegou correspondência para você na portaria.", "mail")
      return deliveryView(deps, d)
    },

    async registerPickup(ctx, id, personId) {
      const actor = await authorize(deps, ctx, "desk.operate")
      const d = await load(ctx, id)
      if (d.status !== "at-desk") throw invalid("status", "not_at_desk")
      const people = await activePeopleOf(deps, d.apartmentId)
      if (!people.some((p) => p.personId === personId))
        throw invalid("personId", "not_in_apartment")
      const updated = await save(deps, "deliveries", {
        ...d,
        status: "picked-up",
        pickedUpAt: nowIso(deps),
        pickedUpById: personId,
        pickupRegisteredById: actor.personId,
      })
      return deliveryView(deps, updated)
    },
  }
}
