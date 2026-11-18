// Botão de emergência (spec 005, História 1 e 4): pedir ajuda, "Estou indo", resolver, cancelar e histórico.
// Quem recebe cada aviso está em research R4; a tela cheia na portaria vem de `fullScreenForMe` (RF-003).
import { getIn, listIn, nowIso, save, type ServiceDeps } from "./base"
import {
  ServiceError,
  type EmergencyService,
  type EmergencyView,
  type ServiceContext,
} from "./contracts"
import { ownApartment } from "./deliveries"
import { runDue } from "./due"
import { personName } from "./front-desk-shared"
import { notify } from "./notify"
import { authorize, type ActorInfo } from "./permissions"
import type { EmergencyAlert, EmergencyKind } from "./schemas"
import {
  KIND_LABEL,
  doormen,
  fullScreenDoormen,
  householdOf,
  managerIds,
  messageEmergencyContact,
} from "./security-shared"
import { timeBrasilia } from "@/i18n/datetime"

const DAY = 86_400_000
const HISTORY_DAYS = 90
const isActive = (a: EmergencyAlert) => a.status === "open" || a.status === "acknowledged"

async function view(
  deps: ServiceDeps,
  alert: EmergencyAlert,
  actor: ActorInfo | null,
): Promise<EmergencyView> {
  const [apt, createdBy, acknowledgedBy, cancelledBy, duty] = await Promise.all([
    deps.repo.get("apartments", alert.apartmentId),
    personName(deps, alert.createdById),
    personName(deps, alert.acknowledgedById),
    personName(deps, alert.cancelledById),
    fullScreenDoormen(deps, alert.condominiumId),
  ])
  let emergencyContact: EmergencyView["emergencyContact"] = null
  if (actor && actor.kind !== "resident") {
    const [c] = await deps.repo.byIndex("emergencyContacts", "byApartment", alert.apartmentId)
    if (c) emergencyContact = { name: c.name, relationship: c.relationship, phone: c.phone }
  }
  const me = actor?.personId
  return {
    id: alert.id,
    apartmentId: alert.apartmentId,
    apartment: apt?.number ?? "",
    floor: apt?.floor ?? 0,
    kind: alert.kind,
    origin: alert.origin,
    createdBy: createdBy ?? "",
    createdAt: alert.createdAt,
    status: alert.status,
    acknowledgedBy,
    acknowledgedAt: alert.acknowledgedAt,
    resolvedAt: alert.resolvedAt,
    resolutionNote: alert.resolutionNote,
    cancelledAt: alert.cancelledAt,
    cancelledBy,
    repeated: !!alert.repeatedAt,
    emergencyContact,
    noDoormanOnDuty: duty.noneOnDuty,
    fullScreenForMe:
      actor?.kind === "front-desk" && isActive(alert) && !!me && duty.ids.includes(me),
    canCancel:
      actor?.kind === "resident" &&
      isActive(alert) &&
      actor.apartmentId === alert.apartmentId &&
      (!!actor.isResponsible || alert.createdById === me),
  }
}

const recent = (deps: ServiceDeps, a: EmergencyAlert) =>
  deps.now().getTime() - new Date(a.createdAt).getTime() <= HISTORY_DAYS * DAY
const newestFirst = (a: EmergencyAlert, b: EmergencyAlert) => b.createdAt.localeCompare(a.createdAt)

/** Cria o alerta (pelo app ou pelo "SOS" no WhatsApp) e avisa todos os envolvidos (RF-003, RF-003a). */
export async function raiseEmergency(
  deps: ServiceDeps,
  condominiumId: string,
  apartmentId: string,
  personId: string,
  kind: EmergencyKind,
  origin: "app" | "whatsapp",
): Promise<{ alert: EmergencyAlert; created: boolean }> {
  const existing = (await deps.repo.byIndex("emergencyAlerts", "byApartment", apartmentId)).find(
    isActive,
  )
  if (existing) return { alert: existing, created: false } // um em aberto por apartamento (RF-008)
  const alert = await save(deps, "emergencyAlerts", {
    id: deps.uuid(),
    condominiumId,
    apartmentId,
    kind,
    origin,
    createdById: personId,
    createdAt: nowIso(deps),
    status: "open",
    acknowledgedAt: null,
    acknowledgedById: null,
    resolvedAt: null,
    resolvedById: null,
    resolutionNote: null,
    cancelledAt: null,
    cancelledById: null,
    repeatedAt: null,
  })
  const [apt, who, staff, managers, household] = await Promise.all([
    deps.repo.get("apartments", apartmentId),
    personName(deps, personId),
    doormen(deps, condominiumId),
    managerIds(deps, condominiumId),
    householdOf(deps, alert),
  ])
  await notify(deps, condominiumId, {
    type: "emergency",
    audience: { personIds: [...staff.map((d) => d.personId), ...managers, ...household] },
    title: `🚨 Emergência · apto ${apt?.number}`,
    body: `${KIND_LABEL[kind]} · ${who ?? "Morador"} pediu ajuda às ${timeBrasilia(alert.createdAt)}.`,
    target: { kind: "emergency", id: alert.id },
  })
  await messageEmergencyContact(deps, alert, "raised")
  return { alert, created: true }
}

export function emergencyService(deps: ServiceDeps): EmergencyService {
  async function load(ctx: ServiceContext, id: string) {
    return getIn(deps, "emergencyAlerts", ctx.condominiumId, id, "Alerta")
  }
  async function update(alert: EmergencyAlert, audience: string[], title: string, body: string) {
    const ids = [...new Set(audience)]
    if (ids.length)
      await notify(deps, alert.condominiumId, {
        type: "emergency-update",
        audience: { personIds: ids },
        title,
        body,
        target: { kind: "emergency", id: alert.id },
      })
  }

  return {
    async raise(ctx, kind) {
      const actor = await ownApartment(deps, ctx, "emergency.raise")
      const { alert } = await raiseEmergency(
        deps,
        ctx.condominiumId,
        actor.apartmentId!,
        actor.personId,
        kind,
        "app",
      )
      return view(deps, alert, actor)
    },

    async mine(ctx) {
      const actor = await ownApartment(deps, ctx, "emergency.viewOwn")
      await runDue(deps, ctx.condominiumId)
      const list = (await deps.repo.byIndex("emergencyAlerts", "byApartment", actor.apartmentId!))
        .filter((a) => a.condominiumId === ctx.condominiumId)
        .sort(newestFirst)
      const current = list.find(isActive) ?? null
      const history = list.filter((a) => a !== current && recent(deps, a))
      return {
        current: current ? await view(deps, current, actor) : null,
        history: await Promise.all(history.map((a) => view(deps, a, actor))),
      }
    },

    async cancel(ctx, id) {
      const alert = await load(ctx, id)
      const actor = await authorize(deps, ctx, "emergency.cancel", {
        apartmentId: alert.apartmentId,
        createdById: alert.createdById,
      })
      if (!isActive(alert)) throw new ServiceError("conflict", "Este alerta já foi encerrado.")
      const saved = await save(deps, "emergencyAlerts", {
        ...alert,
        status: "cancelled",
        cancelledAt: nowIso(deps),
        cancelledById: actor.personId,
      })
      const [apt, staff, managers, household] = await Promise.all([
        deps.repo.get("apartments", alert.apartmentId),
        doormen(deps, alert.condominiumId),
        managerIds(deps, alert.condominiumId),
        householdOf(deps, alert),
      ])
      await update(
        saved,
        [...staff.map((d) => d.personId), ...managers, ...household, alert.createdById].filter(
          (p) => p !== actor.personId,
        ),
        `Alerta cancelado · apto ${apt?.number}`,
        "Cancelado pelo morador.",
      )
      await messageEmergencyContact(deps, saved, "cancelled")
      return view(deps, saved, actor)
    },

    async open(ctx) {
      const actor = await authorize(deps, ctx, "emergency.viewAll")
      await runDue(deps, ctx.condominiumId)
      const list = (await listIn(deps, "emergencyAlerts", ctx.condominiumId))
        .filter(isActive)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      return Promise.all(list.map((a) => view(deps, a, actor)))
    },

    async acknowledge(ctx, id) {
      const actor = await authorize(deps, ctx, "emergency.respond")
      const alert = await load(ctx, id)
      // O primeiro "Estou indo" vale; os outros só veem quem foi.
      if (alert.status !== "open") return view(deps, alert, actor)
      const saved = await save(deps, "emergencyAlerts", {
        ...alert,
        status: "acknowledged",
        acknowledgedAt: nowIso(deps),
        acknowledgedById: actor.personId,
      })
      const [apt, who, household] = await Promise.all([
        deps.repo.get("apartments", alert.apartmentId),
        personName(deps, actor.personId),
        householdOf(deps, alert),
      ])
      await update(
        saved,
        [alert.createdById, ...household],
        `${who ?? "A portaria"} está a caminho`,
        `A portaria viu o alerta do apartamento ${apt?.number}.`,
      )
      return view(deps, saved, actor)
    },

    async resolve(ctx, id, note) {
      const actor = await authorize(deps, ctx, "emergency.respond")
      const alert = await load(ctx, id)
      if (!isActive(alert)) throw new ServiceError("conflict", "Este alerta já foi encerrado.")
      const text = note?.trim() || null
      if (text && text.length > 300)
        throw new ServiceError("validation", "Nota longa demais.", { note: "too_long" })
      const now = nowIso(deps)
      const saved = await save(deps, "emergencyAlerts", {
        ...alert,
        status: "resolved",
        acknowledgedAt: alert.acknowledgedAt ?? now,
        acknowledgedById: alert.acknowledgedById ?? actor.personId,
        resolvedAt: now,
        resolvedById: actor.personId,
        resolutionNote: text,
      })
      const [apt, household, managers] = await Promise.all([
        deps.repo.get("apartments", alert.apartmentId),
        householdOf(deps, alert),
        managerIds(deps, alert.condominiumId),
      ])
      await update(
        saved,
        [alert.createdById, ...household, ...managers],
        `Alerta resolvido · apto ${apt?.number}`,
        text ?? "A portaria marcou o alerta como resolvido.",
      )
      await messageEmergencyContact(deps, saved, "resolved")
      return view(deps, saved, actor)
    },

    async history(ctx) {
      const actor = await authorize(deps, ctx, "emergency.viewAll")
      await runDue(deps, ctx.condominiumId)
      const list = (await listIn(deps, "emergencyAlerts", ctx.condominiumId))
        .filter((a) => recent(deps, a))
        .sort(newestFirst)
      return Promise.all(list.map((a) => view(deps, a, actor)))
    },
  }
}
