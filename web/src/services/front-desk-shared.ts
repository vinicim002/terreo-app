// Regras compartilhadas da portaria (spec 004): quem é avisado de cada entrega e visitante (esclarecimentos 1 e 3,
// RF-013a), modo viagem ativo e nomes. Usadas pelos serviços e pelo runDue.
import { dayKeyBrasilia } from "@/i18n/datetime"
import type { ServiceDeps } from "./base"
import type { Delivery, TravelMode, Visitor } from "./schemas"

/** Pessoas ativas (convite aceito, não removidas) de um apartamento. */
export async function activePeopleOf(deps: ServiceDeps, apartmentId: string) {
  const residencies = await deps.repo.byIndex("residencies", "byApartment", apartmentId)
  const out: { personId: string; name: string; isResponsible: boolean }[] = []
  for (const r of residencies) {
    const p = await deps.repo.get("people", r.personId)
    if (p && !p.removedAt && p.firstAccessAt)
      out.push({ personId: p.id, name: p.name, isResponsible: r.isResponsible })
  }
  return out
}

/** Quem cadastrou + responsável; ou todos do apartamento (sem código, correspondência, sem cadastro). */
async function recipients(deps: ServiceDeps, apartmentId: string, createdById: string | null) {
  const people = await activePeopleOf(deps, apartmentId)
  if (!createdById) return people.map((p) => p.personId)
  const ids = new Set(
    people.filter((p) => p.isResponsible || p.personId === createdById).map((p) => p.personId),
  )
  return [...ids]
}

export function deliveryRecipients(deps: ServiceDeps, d: Delivery) {
  const byCode = d.origin === "app" || d.origin === "whatsapp"
  return recipients(deps, d.apartmentId, byCode ? d.createdById : null)
}

export function visitorRecipients(deps: ServiceDeps, v: Visitor) {
  return recipients(deps, v.apartmentId, v.walkIn ? null : v.createdById)
}

export function isTravelActive(t: TravelMode, today: string) {
  return !t.endedAt && t.from <= today && today <= t.to
}

export async function activeTravel(deps: ServiceDeps, apartmentId: string, today: string) {
  const list = await deps.repo.byIndex("travelModes", "byApartment", apartmentId)
  return list.find((t) => isTravelActive(t, today)) ?? null
}

export const todayKey = (deps: ServiceDeps) => dayKeyBrasilia(deps.now())

/** Dias de Brasília entre dois instantes (b − a). */
export function daysBetween(a: string | Date, b: string | Date) {
  const da = Date.parse(`${dayKeyBrasilia(a)}T12:00:00Z`)
  const db = Date.parse(`${dayKeyBrasilia(b)}T12:00:00Z`)
  return Math.round((db - da) / 86_400_000)
}

export async function personName(deps: ServiceDeps, personId: string | null) {
  if (!personId) return null
  return (await deps.repo.get("people", personId))?.name ?? null
}

export const STORE_LABEL: Record<string, string> = {
  ifood: "iFood",
  "mercado-livre": "Mercado Livre",
  shopee: "Shopee",
  amazon: "Amazon",
  correios: "Correios",
}

export function storeLabel(d: Pick<Delivery, "store" | "storeName">) {
  if (!d.store) return null
  return d.store === "other" ? d.storeName : STORE_LABEL[d.store]
}
