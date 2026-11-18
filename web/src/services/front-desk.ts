// Portaria (spec 004): painel e números do dia, visitantes, modo viagem, recados, achados e perdidos e mensagens
// recebidas no WhatsApp (simuladas agora; na Etapa 3, o webhook chama `receive` no servidor).
import { dayKeyBrasilia, timeBrasilia } from "@/i18n/datetime"
import { getIn, listIn, notFound, nowIso, save, type ServiceDeps } from "./base"
import {
  ServiceError,
  type DeskApartment,
  type FrontDeskService,
  type InboxResult,
  type LostFoundService,
  type LostItemView,
  type MemoService,
  type MemoView,
  type ServiceContext,
  type TravelService,
  type VisitorService,
  type VisitorView,
  type WhatsappInboxService,
} from "./contracts"
import { apartmentByNumber, createCode, deliveryView, ownApartment } from "./deliveries"
import { runDue } from "./due"
import {
  activePeopleOf,
  isTravelActive,
  personName,
  storeLabel,
  todayKey,
  visitorRecipients,
} from "./front-desk-shared"
import { notify } from "./notify"
import { parseDeliveryMessage } from "./parse-delivery"
import { authorize, type ActorInfo } from "./permissions"
import type { LostItem, Visitor } from "./schemas"

const invalid = (field: string, reason: string, message = "Dado inválido.") =>
  new ServiceError("validation", message, { [field]: reason })

const addDays = (key: string, days: number) =>
  dayKeyBrasilia(new Date(Date.parse(`${key}T15:00:00Z`) + days * 86_400_000))

async function doormen(deps: ServiceDeps, condominiumId: string) {
  return (await listIn(deps, "staff", condominiumId))
    .filter((s) => s.role === "doorman" && s.personId)
    .map((s) => s.personId!)
}

// ---------- Painel da portaria ----------

export function frontDeskService(deps: ServiceDeps): FrontDeskService {
  async function travelUntil(apartmentId: string) {
    const today = todayKey(deps)
    const t = (await deps.repo.byIndex("travelModes", "byApartment", apartmentId)).find((x) =>
      isTravelActive(x, today),
    )
    return t?.to ?? null
  }
  return {
    async overview(ctx) {
      await authorize(deps, ctx, "desk.operate")
      await runDue(deps, ctx.condominiumId)
      const today = todayKey(deps)
      const [apartments, deliveries, visitors, travels] = await Promise.all([
        listIn(deps, "apartments", ctx.condominiumId),
        deps.repo.byIndex("deliveries", "byCondominium", ctx.condominiumId),
        deps.repo.byIndex("visitors", "byCondominium", ctx.condominiumId),
        deps.repo.byIndex("travelModes", "byCondominium", ctx.condominiumId),
      ])
      const live = deliveries.filter((d) => !d.deletedAt)
      const count = (aptId: string, status: string) =>
        live.filter((d) => d.apartmentId === aptId && d.status === status).length
      const list: DeskApartment[] = apartments
        .sort(
          (a, b) =>
            a.floor - b.floor || a.number.localeCompare(b.number, "pt-BR", { numeric: true }),
        )
        .map((a) => ({
          number: a.number,
          floor: a.floor,
          awaiting: count(a.id, "awaiting"),
          atDesk: count(a.id, "at-desk"),
          travelUntil:
            travels.find((t) => t.apartmentId === a.id && isTravelActive(t, today))?.to ?? null,
        }))
      return {
        awaiting: live.filter((d) => d.status === "awaiting").length,
        atDesk: live.filter((d) => d.status === "at-desk").length,
        expectedVisitors: visitors.filter((v) => v.status === "expected" && v.day === today).length,
        apartments: list,
      }
    },

    async apartment(ctx, number) {
      await authorize(deps, ctx, "desk.operate")
      await runDue(deps, ctx.condominiumId)
      const apt = await apartmentByNumber(deps, ctx.condominiumId, number)
      const residencies = await deps.repo.byIndex("residencies", "byApartment", apt.id)
      const people = []
      // Só o necessário para a portaria (spec 002, RF-029a): nome, foto e tipo.
      for (const r of residencies) {
        const p = await deps.repo.get("people", r.personId)
        if (p && !p.removedAt && p.firstAccessAt)
          people.push({ personId: p.id, name: p.name, photo: p.photo, kind: r.kind })
      }
      const deliveries = (await deps.repo.byIndex("deliveries", "byApartment", apt.id))
        .filter((d) => !d.deletedAt && (d.status === "awaiting" || d.status === "at-desk"))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      return {
        number: apt.number,
        people,
        deliveries: await Promise.all(deliveries.map((d) => deliveryView(deps, d))),
        travelUntil: await travelUntil(apt.id),
      }
    },
  }
}

// ---------- Visitantes ----------

export function visitorService(deps: ServiceDeps): VisitorService {
  async function view(v: Visitor, actor?: ActorInfo): Promise<VisitorView> {
    const apt = await deps.repo.get("apartments", v.apartmentId)
    return {
      id: v.id,
      apartment: apt?.number ?? "",
      kind: v.kind,
      name: v.name,
      day: v.day,
      fromTime: v.fromTime,
      toTime: v.toTime,
      people: v.people,
      status: v.status,
      walkIn: v.walkIn,
      createdBy: (await personName(deps, v.createdById)) ?? "",
      arrivedAt: v.arrivedAt,
      releasedBy: await personName(deps, v.releasedById),
      canCancel:
        v.status === "expected" &&
        !!actor &&
        actor.kind === "resident" &&
        (!!actor.isResponsible || v.createdById === actor.personId),
    }
  }
  const order = (a: Visitor, b: Visitor) =>
    a.day.localeCompare(b.day) || a.fromTime.localeCompare(b.fromTime)

  async function announce(v: Visitor) {
    await notify(deps, v.condominiumId, {
      type: "visitor",
      audience: { personIds: await visitorRecipients(deps, v) },
      title: v.name,
      body: `${v.walkIn ? "Visitante sem cadastro" : v.kind === "provider" ? "Prestador" : "Visita"} chegou à portaria às ${timeBrasilia(v.arrivedAt!)}.`,
      target: { kind: "visitor", id: v.id },
    })
  }

  return {
    async mine(ctx) {
      const actor = await ownApartment(deps, ctx, "visitor.viewOwn")
      await runDue(deps, ctx.condominiumId)
      const all = await deps.repo.byIndex("visitors", "byApartment", actor.apartmentId!)
      const expected = all.filter((v) => v.status === "expected").sort(order)
      const history = all
        .filter((v) => v.status !== "expected")
        .sort((a, b) => (b.arrivedAt ?? b.day).localeCompare(a.arrivedAt ?? a.day))
        .slice(0, 30)
      return {
        expected: await Promise.all(expected.map((v) => view(v, actor))),
        history: await Promise.all(history.map((v) => view(v, actor))),
      }
    },

    async register(ctx, input) {
      const actor = await ownApartment(deps, ctx, "visitor.register")
      const today = todayKey(deps)
      if (input.day < today || input.day > addDays(today, 30)) throw invalid("day", "out_of_range")
      const v = await save(deps, "visitors", {
        id: deps.uuid(),
        condominiumId: ctx.condominiumId,
        apartmentId: actor.apartmentId!,
        kind: input.kind,
        name: input.name.trim(),
        day: input.day,
        fromTime: input.fromTime,
        toTime: input.toTime,
        people: input.kind === "provider" ? 1 : input.people,
        status: "expected",
        walkIn: false,
        createdById: actor.personId,
        createdAt: nowIso(deps),
        arrivedAt: null,
        releasedById: null,
      })
      return view(v, actor)
    },

    async cancel(ctx, id) {
      const v = await getIn(deps, "visitors", ctx.condominiumId, id, "Visitante")
      await authorize(deps, ctx, "visitor.cancel", {
        apartmentId: v.apartmentId,
        createdById: v.createdById,
      })
      if (v.status !== "expected") throw invalid("status", "not_expected")
      await save(deps, "visitors", { ...v, status: "cancelled" })
    },

    async today(ctx) {
      await authorize(deps, ctx, "desk.operate")
      await runDue(deps, ctx.condominiumId)
      const today = todayKey(deps)
      const all = await deps.repo.byIndex("visitors", "byCondominium", ctx.condominiumId)
      const expected = all.filter((v) => v.status === "expected" && v.day === today).sort(order)
      const arrived = all
        .filter(
          (v) => v.status === "arrived" && v.arrivedAt && dayKeyBrasilia(v.arrivedAt) === today,
        )
        .sort((a, b) => b.arrivedAt!.localeCompare(a.arrivedAt!))
      return {
        expected: await Promise.all(expected.map((v) => view(v))),
        arrived: await Promise.all(arrived.map((v) => view(v))),
      }
    },

    async checkIn(ctx, id) {
      const actor = await authorize(deps, ctx, "desk.operate")
      const v = await getIn(deps, "visitors", ctx.condominiumId, id, "Visitante")
      if (v.status !== "expected") throw invalid("status", "not_expected")
      const updated = await save(deps, "visitors", {
        ...v,
        status: "arrived",
        arrivedAt: nowIso(deps),
        releasedById: actor.personId,
      })
      await announce(updated)
      return view(updated)
    },

    async walkIn(ctx, input) {
      const actor = await authorize(deps, ctx, "desk.operate")
      const apt = await apartmentByNumber(deps, ctx.condominiumId, input.apartmentNumber)
      const now = nowIso(deps)
      const v = await save(deps, "visitors", {
        id: deps.uuid(),
        condominiumId: ctx.condominiumId,
        apartmentId: apt.id,
        kind: "visit",
        name: input.name.trim(),
        day: todayKey(deps),
        fromTime: "00:00",
        toTime: "23:59",
        people: 1,
        status: "arrived",
        walkIn: true,
        createdById: actor.personId,
        createdAt: now,
        arrivedAt: now,
        releasedById: actor.personId,
      })
      await announce(v)
      return view(v)
    },
  }
}

// ---------- Modo viagem ----------

export function travelService(deps: ServiceDeps): TravelService {
  async function current(apartmentId: string) {
    const today = todayKey(deps)
    return (await deps.repo.byIndex("travelModes", "byApartment", apartmentId)).find(
      (t) => !t.endedAt && t.to >= today,
    )
  }
  return {
    async mine(ctx) {
      const actor = await ownApartment(deps, ctx, "travel.viewOwn")
      const t = await current(actor.apartmentId!)
      if (!t) return null
      return { from: t.from, to: t.to, createdBy: (await personName(deps, t.createdById)) ?? "" }
    },
    async start(ctx, input) {
      const actor = await ownApartment(deps, ctx, "travel.set")
      if (input.from < todayKey(deps)) throw invalid("from", "past")
      const existing = await current(actor.apartmentId!)
      if (existing) await save(deps, "travelModes", { ...existing, endedAt: nowIso(deps) })
      const t = await save(deps, "travelModes", {
        id: deps.uuid(),
        condominiumId: ctx.condominiumId,
        apartmentId: actor.apartmentId!,
        from: input.from,
        to: input.to,
        createdById: actor.personId,
        createdAt: nowIso(deps),
        endedAt: null,
      })
      return { from: t.from, to: t.to, createdBy: (await personName(deps, t.createdById)) ?? "" }
    },
    async end(ctx) {
      const actor = await ownApartment(deps, ctx, "travel.set")
      const t = await current(actor.apartmentId!)
      if (t) await save(deps, "travelModes", { ...t, endedAt: nowIso(deps) })
    },
    async active(ctx) {
      await authorize(deps, ctx, "desk.operate")
      const today = todayKey(deps)
      const list = (
        await deps.repo.byIndex("travelModes", "byCondominium", ctx.condominiumId)
      ).filter((t) => isTravelActive(t, today))
      const out = []
      for (const t of list) {
        const apt = await deps.repo.get("apartments", t.apartmentId)
        out.push({ apartment: apt?.number ?? "", from: t.from, to: t.to })
      }
      return out.sort((a, b) => a.to.localeCompare(b.to))
    },
  }
}

// ---------- Recados da portaria ----------

export function memoService(deps: ServiceDeps): MemoService {
  async function view(id: string): Promise<MemoView> {
    const m = await deps.repo.get("memos", id)
    if (!m) throw notFound("Recado")
    return {
      id: m.id,
      text: m.text,
      author: (await personName(deps, m.authorId)) ?? "",
      createdAt: m.createdAt,
      seen: !!m.seenAt,
      noticeId: m.noticeId,
    }
  }
  async function load(ctx: ServiceContext, id: string) {
    await authorize(deps, ctx, "memo.manage")
    return getIn(deps, "memos", ctx.condominiumId, id, "Recado")
  }
  return {
    async send(ctx, text) {
      const actor = await authorize(deps, ctx, "memo.send")
      const m = await save(deps, "memos", {
        id: deps.uuid(),
        condominiumId: ctx.condominiumId,
        authorId: actor.personId,
        text: text.trim(),
        createdAt: nowIso(deps),
        seenAt: null,
        noticeId: null,
      })
      const managers = (await listIn(deps, "managers", ctx.condominiumId)).map((x) => x.personId)
      await notify(deps, ctx.condominiumId, {
        type: "memo",
        audience: { personIds: managers },
        title: "Recado da portaria",
        body: m.text,
        target: { kind: "memo", id: m.id },
      })
      return view(m.id)
    },
    async list(ctx) {
      await authorize(deps, ctx, "memo.manage")
      const all = (await listIn(deps, "memos", ctx.condominiumId)).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      )
      return Promise.all(all.map((m) => view(m.id)))
    },
    async get(ctx, id) {
      const m = await load(ctx, id)
      return view(m.id)
    },
    async markSeen(ctx, id) {
      const m = await load(ctx, id)
      if (!m.seenAt) await save(deps, "memos", { ...m, seenAt: nowIso(deps) })
    },
    async linkNotice(ctx, id, noticeId) {
      const m = await load(ctx, id)
      await save(deps, "memos", { ...m, noticeId, seenAt: m.seenAt ?? nowIso(deps) })
    },
  }
}

// ---------- Achados e perdidos ----------

export function lostFoundService(deps: ServiceDeps): LostFoundService {
  async function view(item: LostItem, actor: ActorInfo): Promise<LostItemView> {
    const apt = item.apartmentId ? await deps.repo.get("apartments", item.apartmentId) : undefined
    return {
      id: item.id,
      kind: item.kind,
      description: item.description,
      place: item.place,
      photo: item.photo,
      status: item.status,
      apartment: apt?.number ?? null,
      createdAt: item.createdAt,
      mine: !!actor.apartmentId && item.apartmentId === actor.apartmentId,
    }
  }
  async function load(ctx: ServiceContext, id: string) {
    return getIn(deps, "lostItems", ctx.condominiumId, id, "Objeto")
  }
  const describe = (item: LostItem) =>
    item.place ? `${item.description} (${item.place})` : item.description

  return {
    async list(ctx) {
      const actor = await authorize(deps, ctx, "lostfound.view")
      const limit = deps.now().getTime() - 60 * 86_400_000
      const all = (await listIn(deps, "lostItems", ctx.condominiumId)).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      )
      const visible = (i: LostItem) =>
        actor.kind === "front-desk" ||
        new Date(i.createdAt).getTime() >= limit ||
        i.status === "claimed"
      const views = (list: LostItem[]) => Promise.all(list.map((i) => view(i, actor)))
      return {
        found: await views(
          all.filter((i) => i.kind === "found" && i.status !== "returned" && visible(i)),
        ),
        lost: await views(all.filter((i) => i.kind === "lost" && i.status === "open")),
        returned: await views(
          all.filter((i) => i.status === "returned" || i.status === "found").slice(0, 30),
        ),
      }
    },

    async registerFound(ctx, input) {
      const actor = await authorize(deps, ctx, "lostfound.manage")
      const item = await save(deps, "lostItems", {
        id: deps.uuid(),
        condominiumId: ctx.condominiumId,
        kind: "found",
        description: input.description.trim(),
        place: input.place?.trim() || null,
        photo: input.photo,
        status: "open",
        apartmentId: null,
        createdById: actor.personId,
        createdAt: nowIso(deps),
        claimedAt: null,
        closedAt: null,
      })
      return view(item, actor)
    },

    async claim(ctx, id) {
      const actor = await authorize(deps, ctx, "lostfound.claim")
      const item = await load(ctx, id)
      if (item.kind !== "found" || item.status !== "open") throw invalid("status", "not_open")
      const updated = await save(deps, "lostItems", {
        ...item,
        status: "claimed",
        apartmentId: actor.apartmentId!,
        claimedAt: nowIso(deps),
      })
      const apt = await deps.repo.get("apartments", actor.apartmentId!)
      await notify(deps, ctx.condominiumId, {
        type: "lost-found",
        audience: { personIds: await doormen(deps, ctx.condominiumId) },
        title: item.description,
        body: `O apartamento ${apt?.number} diz que é dele. Entregue quando vierem buscar.`,
        target: { kind: "lost-item", id: item.id },
      })
      return view(updated, actor)
    },

    async markReturned(ctx, id, number) {
      const actor = await authorize(deps, ctx, "lostfound.manage")
      const item = await load(ctx, id)
      if (item.kind !== "found" || item.status === "returned") throw invalid("status", "not_open")
      const apt = await apartmentByNumber(deps, ctx.condominiumId, number)
      const updated = await save(deps, "lostItems", {
        ...item,
        status: "returned",
        apartmentId: apt.id,
        closedAt: nowIso(deps),
      })
      return view(updated, actor)
    },

    async reportLost(ctx, input) {
      const actor = await authorize(deps, ctx, "lostfound.reportLost")
      const item = await save(deps, "lostItems", {
        id: deps.uuid(),
        condominiumId: ctx.condominiumId,
        kind: "lost",
        description: input.description.trim(),
        place: input.place?.trim() || null,
        photo: null,
        status: "open",
        apartmentId: actor.apartmentId!,
        createdById: actor.personId,
        createdAt: nowIso(deps),
        claimedAt: null,
        closedAt: null,
      })
      const apt = await deps.repo.get("apartments", actor.apartmentId!)
      await notify(deps, ctx.condominiumId, {
        type: "lost-found",
        audience: { personIds: await doormen(deps, ctx.condominiumId) },
        title: item.description,
        body: `Objeto perdido avisado pelo apartamento ${apt?.number}.`,
        target: { kind: "lost-item", id: item.id },
      })
      return view(item, actor)
    },

    async markFound(ctx, id) {
      const actor = await authorize(deps, ctx, "lostfound.manage")
      const item = await load(ctx, id)
      if (item.kind !== "lost" || item.status !== "open") throw invalid("status", "not_open")
      const updated = await save(deps, "lostItems", {
        ...item,
        status: "found",
        closedAt: nowIso(deps),
      })
      const people = (await activePeopleOf(deps, item.apartmentId!)).map((p) => p.personId)
      await notify(deps, ctx.condominiumId, {
        type: "lost-found",
        audience: { personIds: people },
        title: item.description,
        body: `Encontraram seu objeto: ${describe(item)}. Busque na portaria.`,
        target: { kind: "lost-item", id: item.id },
      })
      return view(updated, actor)
    },
  }
}

// ---------- Mensagens recebidas no WhatsApp ----------

const REPLY: Record<Exclude<InboxResult, "registered">, string> = {
  "unknown-phone": "Térreo: este número não está cadastrado no condomínio. Fale com o síndico.",
  "no-permission":
    "Térreo: você não pode cadastrar entregas. Peça ao responsável do apartamento para liberar.",
  "not-understood":
    "Térreo: não entendi. Mande a loja e o código da entrega, por exemplo: iFood 4821 ou Mercado Livre MLB-73.",
}

export function whatsappInboxService(deps: ServiceDeps): WhatsappInboxService {
  async function reply(condominiumId: string | null, phone: string, body: string) {
    await save(deps, "outbox", {
      id: deps.uuid(),
      condominiumId,
      toPhone: phone,
      kind: "private",
      body,
      createdAt: nowIso(deps),
    })
  }
  return {
    async receive(fromPhone, text) {
      const record = async (
        result: InboxResult,
        condominiumId: string | null,
        deliveryId: string | null = null,
      ) =>
        save(deps, "inboundMessages", {
          id: deps.uuid(),
          condominiumId,
          fromPhone,
          text: text.slice(0, 500),
          receivedAt: nowIso(deps),
          result,
          deliveryId,
        })
      const [person] = (await deps.repo.byIndex("people", "byPhone", fromPhone)).filter(
        (p) => !p.removedAt && p.firstAccessAt,
      )
      if (!person) {
        await record("unknown-phone", null)
        await reply(null, fromPhone, REPLY["unknown-phone"])
        return { result: "unknown-phone", reply: REPLY["unknown-phone"] }
      }
      const residency = (await deps.repo.byIndex("residencies", "byPerson", person.id)).find(
        (r) => r.isResponsible || r.canRegisterDeliveries,
      )
      if (!residency) {
        await record("no-permission", person.condominiumId)
        await reply(person.condominiumId, fromPhone, REPLY["no-permission"])
        return { result: "no-permission", reply: REPLY["no-permission"] }
      }
      const parsed = parseDeliveryMessage(text)
      if (!parsed) {
        await record("not-understood", person.condominiumId)
        await reply(person.condominiumId, fromPhone, REPLY["not-understood"])
        return { result: "not-understood", reply: REPLY["not-understood"] }
      }
      // Pela mensagem não dá para escolher o que fazer na chegada: fica na portaria (o mais seguro).
      const d = await createCode(
        deps,
        person.condominiumId,
        residency.apartmentId,
        person.id,
        "whatsapp",
        {
          ...parsed,
          onArrival: "front-desk",
        },
      )
      await record("registered", person.condominiumId, d.id)
      const apt = await deps.repo.get("apartments", residency.apartmentId)
      const body = `Térreo: código ${d.code} (${storeLabel(d)}) cadastrado para o apartamento ${apt?.number}. A portaria vai encontrar quando o entregador chegar.`
      await reply(person.condominiumId, fromPhone, body)
      return { result: "registered", reply: body }
    },
    async list() {
      return (await deps.repo.all("inboundMessages")).sort((a, b) =>
        b.receivedAt.localeCompare(a.receivedAt),
      )
    },
  }
}
