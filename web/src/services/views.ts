// Montagem das visões devolvidas às telas, compartilhada entre os serviços.
import type { PersonView, ResidentView, SessionView } from "./contracts"
import { notFound, validate, type ServiceDeps } from "./base"
import type { Person, Residency, Role, Session } from "./schemas"

export function personView(person: Person): PersonView {
  return { id: person.id, name: person.name, phone: person.phone, photo: person.photo }
}

export function residentView(person: Person, residency: Residency): ResidentView {
  return {
    residencyId: residency.id,
    personId: person.id,
    apartmentId: residency.apartmentId,
    name: person.name,
    phone: person.phone,
    photo: person.photo,
    kind: residency.kind,
    isResponsible: residency.isResponsible,
    canRegisterDeliveries: residency.isResponsible || residency.canRegisterDeliveries,
    canVotePolls: residency.isResponsible || residency.canVotePolls,
    status: person.firstAccessAt ? "active" : "pending",
    lastInviteAt: residency.lastInviteAt,
  }
}

export async function loadPerson(deps: ServiceDeps, personId: string): Promise<Person> {
  const person = await deps.repo.get("people", personId)
  if (!person || person.removedAt) throw notFound("Pessoa")
  return validate("people", person)
}

/** Papéis atuais de uma pessoa: morador(es), porteiro e síndico. */
export async function rolesOf(deps: ServiceDeps, person: Person): Promise<Role[]> {
  const [residencies, staff, managers] = await Promise.all([
    deps.repo.byIndex("residencies", "byPerson", person.id),
    deps.repo.byIndex("staff", "byPerson", person.id),
    deps.repo.byIndex("managers", "byPerson", person.id),
  ])
  return [
    ...residencies.map((r): Role => ({
      kind: "resident",
      condominiumId: r.condominiumId,
      residencyId: r.id,
      apartmentId: r.apartmentId,
    })),
    ...staff
      .filter((s) => s.role === "doorman")
      .map((s): Role => ({ kind: "front-desk", condominiumId: s.condominiumId, staffId: s.id })),
    ...managers.map((m): Role => ({ kind: "manager", condominiumId: m.condominiumId })),
  ]
}

export function sameRole(a: Role, b: Role) {
  if (a.kind !== b.kind || a.condominiumId !== b.condominiumId) return false
  if (a.kind === "resident" && b.kind === "resident") return a.residencyId === b.residencyId
  if (a.kind === "front-desk" && b.kind === "front-desk") return a.staffId === b.staffId
  return true
}

export async function sessionView(
  deps: ServiceDeps,
  session: Session,
  person: Person,
): Promise<SessionView> {
  const roles = await rolesOf(deps, person)
  let activeRole =
    session.activeRole && roles.some((r) => sameRole(r, session.activeRole!))
      ? session.activeRole
      : null
  if (!activeRole && roles.length === 1) activeRole = roles[0]
  const isResident = activeRole?.kind === "resident"
  const apartmentNumbers: Record<string, string> = {}
  for (const role of roles) {
    if (role.kind !== "resident") continue
    const apt = await deps.repo.get("apartments", role.apartmentId)
    if (apt) apartmentNumbers[apt.id] = apt.number
  }
  return {
    apartmentNumbers,
    person: personView(person),
    roles,
    activeRole,
    needsWelcome: isResident && !person.welcomeSeenAt,
    needsRulesAcceptance: isResident && !person.rulesAcceptedAt,
  }
}

/** Encerra todas as sessões abertas de uma pessoa. */
export async function endSessions(
  deps: ServiceDeps,
  personId: string,
  reason: NonNullable<Session["endReason"]>,
) {
  const now = deps.now().toISOString()
  for (const s of await deps.repo.byIndex("sessions", "byPerson", personId)) {
    if (!s.endedAt) await deps.repo.put("sessions", { ...s, endedAt: now, endReason: reason })
  }
}

/** Celular já usado por outra pessoa ativa (ou pendente) do condomínio? */
export async function phoneInUse(
  deps: ServiceDeps,
  condominiumId: string,
  phone: string,
  exceptPersonId?: string,
) {
  const people = await deps.repo.byIndex("people", "byPhone", phone)
  return people.some(
    (p) => p.condominiumId === condominiumId && !p.removedAt && p.id !== exceptPersonId,
  )
}
