// Regras compartilhadas da segurança (spec 005, research R4): quem está de plantão, quem recebe cada aviso e a
// mensagem direta ao contato de emergência. Usadas pelos serviços e pelo runDue.
import { timeBrasilia } from "@/i18n/datetime"
import { nowIso, save, type ServiceDeps } from "./base"
import { activePeopleOf } from "./front-desk-shared"
import { brasiliaClock, shiftCovers } from "./legacy"
import type { EmergencyAlert, EmergencyKind } from "./schemas"

/** Porteiros que entram no app (ativos), com a indicação de quem está de plantão agora. */
export async function doormen(deps: ServiceDeps, condominiumId: string) {
  const [staff, shifts] = await Promise.all([
    deps.repo.byIndex("staff", "byCondominium", condominiumId),
    deps.repo.byIndex("shifts", "byCondominium", condominiumId),
  ])
  const { weekday, minutes } = brasiliaClock(deps.now())
  const onDuty = new Set(
    shifts.filter((s) => shiftCovers(s, weekday, minutes)).map((s) => s.staffId),
  )
  const out: { personId: string; onDuty: boolean }[] = []
  for (const s of staff) {
    if (s.role !== "doorman" || !s.personId) continue
    const person = await deps.repo.get("people", s.personId)
    if (person && !person.removedAt) out.push({ personId: s.personId, onDuty: onDuty.has(s.id) })
  }
  return out
}

export async function managerIds(deps: ServiceDeps, condominiumId: string) {
  const managers = await deps.repo.byIndex("managers", "byCondominium", condominiumId)
  return managers.map((m) => m.personId)
}

/** Porteiros de plantão; se ninguém está na escala agora, todos os porteiros (RF-003). */
export async function fullScreenDoormen(deps: ServiceDeps, condominiumId: string) {
  const list = await doormen(deps, condominiumId)
  const onDuty = list.filter((d) => d.onDuty)
  return { ids: (onDuty.length ? onDuty : list).map((d) => d.personId), noneOnDuty: !onDuty.length }
}

export const KIND_LABEL: Record<EmergencyKind, string> = {
  health: "Saúde",
  fire: "Incêndio",
  intrusion: "Invasão",
  leak: "Vazamento",
  other: "Outro",
  unknown: "Não informado",
}

/** Outras pessoas ativas do apartamento (sem quem pediu ajuda). */
export async function householdOf(deps: ServiceDeps, alert: EmergencyAlert) {
  return (await activePeopleOf(deps, alert.apartmentId))
    .map((p) => p.personId)
    .filter((id) => id !== alert.createdById)
}

/** Mensagem direta ao contato de emergência do apartamento (fora do notify: não tem cadastro). */
export async function messageEmergencyContact(
  deps: ServiceDeps,
  alert: EmergencyAlert,
  event: "raised" | "cancelled" | "resolved",
) {
  const [contact] = await deps.repo.byIndex("emergencyContacts", "byApartment", alert.apartmentId)
  if (!contact) return
  const [person, apt, condo] = await Promise.all([
    deps.repo.get("people", alert.createdById),
    deps.repo.get("apartments", alert.apartmentId),
    deps.repo.get("condominiums", alert.condominiumId),
  ])
  const who = person?.name ?? "Um morador"
  const where = `apartamento ${apt?.number} do ${condo?.name ?? "condomínio"}`
  const body = {
    raised: `Térreo: ${who} pediu ajuda no ${where} às ${timeBrasilia(alert.createdAt)}. A portaria foi avisada.`,
    cancelled: `Térreo: ${who} cancelou o pedido de ajuda do ${where}.`,
    resolved: `Térreo: a portaria atendeu o pedido de ajuda de ${who} no ${where}.`,
  }[event]
  await save(deps, "outbox", {
    id: deps.uuid(),
    condominiumId: alert.condominiumId,
    toPhone: contact.phone,
    kind: "private",
    body,
    createdAt: nowIso(deps),
  })
}
