// Matriz de permissões da spec 002 (contracts/permissoes.md), conferida nos serviços (RF-030).
// `can` é pura e testada célula a célula; `authorize` carrega o estado atual do ator e lança ServiceError.
import { ServiceError, type Actor, type ServiceContext } from "./contracts"
import { notFound, type ServiceDeps } from "./base"

export type Action =
  | "condominium.view" // ler dados gerais (condomínio, apartamentos, escala, plantão)
  | "rules.view"
  | "profile.editOwn"
  | "apartment.view" // pessoas, carros, animais e contato de um apartamento
  | "household.invite"
  | "household.edit" // nome, tipo, permissões e celular de outra pessoa
  | "household.remove"
  | "household.resend"
  | "apartmentData.edit" // carros, animais, contato de emergência
  | "admin.manage" // lista de todos os apartamentos, cadastrar e trocar responsável
  | "directory.view" // consulta restrita da portaria
  // Spec 003 (contracts/permissoes.md)
  | "notice.read" // listar, abrir, marcar lido
  | "notice.confirm"
  | "notice.manage" // criar, editar, agendar, apagar, resolver, estatísticas e agendados
  | "poll.view"
  | "poll.vote" // alvo.official: oficial só o responsável; comum, quem tem canVotePolls
  | "poll.suggest" // só em oficiais: quem tem canVotePolls e não é o responsável
  | "poll.manage"
  | "agenda.read" // agenda, reuniões e resumos
  | "agenda.manage"
  | "notification.own"
  // Spec 004 (contracts/permissoes.md)
  | "delivery.viewOwn"
  | "delivery.register" // código, cancelar código
  | "delivery.pickUp"
  | "desk.operate" // a portaria em todos os apartamentos
  | "visitor.viewOwn"
  | "visitor.register"
  | "visitor.cancel" // alvo.createdById
  | "travel.viewOwn"
  | "travel.set"
  | "lostfound.view"
  | "lostfound.claim"
  | "lostfound.reportLost"
  | "lostfound.manage"
  | "memo.send"
  | "memo.manage"
  | "staff.board"
  // Spec 005 (contracts/permissoes.md)
  | "emergency.raise"
  | "emergency.viewOwn"
  | "emergency.cancel" // alvo.createdById: outro morador só cancela o que pediu
  | "emergency.viewAll"
  | "emergency.respond" // "Estou indo", "Resolvido"
  | "generalAlert.view"
  | "generalAlert.send"
  | "generalAlert.close" // alvo.createdById: a portaria só encerra o que enviou
  | "contacts.view"
  | "contacts.manage"
  | "contacts.showOwnPhone"

/** Estado atual do ator, carregado do repositório (não confiar no que estava na sessão). */
export interface ActorInfo {
  kind: Actor["role"]["kind"]
  personId: string
  apartmentId?: string
  isResponsible?: boolean
  canVotePolls?: boolean
  canRegisterDeliveries?: boolean
  /** Porteiro-chefe (Staff.isHead). */
  isHeadDoorman?: boolean
}

export interface Target {
  apartmentId?: string
  /** Pessoa alvo (para "não remover a si mesmo"). */
  personId?: string
  /** Enquete oficial (um voto por apartamento). */
  official?: boolean
  /** Quem criou o registro (cancelar visitante). */
  createdById?: string
}

export type Decision = "ok" | "forbidden" | "not_found"

export function can(actor: ActorInfo | null, action: Action, target: Target = {}): Decision {
  if (!actor) return "forbidden"
  const sameApartment = !!target.apartmentId && target.apartmentId === actor.apartmentId
  switch (action) {
    case "condominium.view":
    case "rules.view":
    case "profile.editOwn":
      return "ok"
    case "apartment.view":
      if (actor.kind === "manager") return "ok"
      if (actor.kind === "resident") return sameApartment ? "ok" : "not_found"
      return "forbidden" // a portaria usa directory.view
    case "household.invite":
      if (actor.kind !== "resident") return "forbidden"
      if (!sameApartment) return "not_found"
      return actor.isResponsible ? "ok" : "forbidden"
    case "household.edit":
    case "household.resend":
      if (actor.kind === "manager") return "ok"
      if (actor.kind !== "resident") return "forbidden"
      if (!sameApartment) return "not_found"
      if (!actor.isResponsible) return "forbidden"
      // O responsável não edita a si mesmo por aqui: o próprio perfil e o síndico cuidam disso.
      return target.personId === actor.personId ? "forbidden" : "ok"
    case "household.remove":
      if (actor.kind === "manager") return "ok"
      if (actor.kind !== "resident") return "forbidden"
      if (!sameApartment) return "not_found"
      if (!actor.isResponsible) return "forbidden"
      return target.personId === actor.personId ? "forbidden" : "ok"
    case "apartmentData.edit":
      if (actor.kind !== "resident") return "forbidden"
      if (!sameApartment) return "not_found"
      return actor.isResponsible ? "ok" : "forbidden"
    case "admin.manage":
      return actor.kind === "manager" ? "ok" : "forbidden"
    case "directory.view":
      return actor.kind === "front-desk" ? "ok" : "forbidden"
    case "notice.read":
    case "agenda.read":
    case "notification.own":
      return "ok"
    case "notice.confirm":
    case "poll.view":
      return actor.kind === "front-desk" ? "forbidden" : "ok"
    case "notice.manage":
    case "poll.manage":
    case "agenda.manage":
      return actor.kind === "manager" ? "ok" : "forbidden"
    case "poll.vote":
      if (actor.kind !== "resident") return "forbidden"
      if (target.official) return actor.isResponsible ? "ok" : "forbidden"
      return actor.canVotePolls || actor.isResponsible ? "ok" : "forbidden"
    case "poll.suggest":
      if (actor.kind !== "resident" || !target.official) return "forbidden"
      return !actor.isResponsible && actor.canVotePolls ? "ok" : "forbidden"
    case "delivery.viewOwn":
    case "delivery.pickUp":
    case "visitor.viewOwn":
    case "visitor.register":
    case "travel.viewOwn":
      if (actor.kind !== "resident") return "forbidden"
      return sameApartment ? "ok" : "not_found"
    case "delivery.register":
    case "travel.set":
      if (actor.kind !== "resident") return "forbidden"
      if (!sameApartment) return "not_found"
      return actor.isResponsible || actor.canRegisterDeliveries ? "ok" : "forbidden"
    case "visitor.cancel":
      if (actor.kind !== "resident") return "forbidden"
      if (!sameApartment) return "not_found"
      return actor.isResponsible || target.createdById === actor.personId ? "ok" : "forbidden"
    case "desk.operate":
    case "lostfound.manage":
    case "memo.send":
      return actor.kind === "front-desk" ? "ok" : "forbidden"
    case "memo.manage":
      return actor.kind === "manager" ? "ok" : "forbidden"
    case "lostfound.claim":
    case "lostfound.reportLost":
      return actor.kind === "resident" ? "ok" : "forbidden"
    case "lostfound.view":
    case "staff.board":
    case "generalAlert.view":
    case "contacts.view":
      return "ok"
    case "emergency.raise":
    case "emergency.viewOwn":
      if (actor.kind !== "resident") return "forbidden"
      return sameApartment ? "ok" : "not_found"
    case "emergency.cancel":
      if (actor.kind !== "resident") return "forbidden"
      if (!sameApartment) return "not_found"
      return actor.isResponsible || target.createdById === actor.personId ? "ok" : "forbidden"
    case "emergency.viewAll":
      return actor.kind === "resident" ? "forbidden" : "ok"
    case "emergency.respond":
      return actor.kind === "front-desk" ? "ok" : "forbidden"
    case "generalAlert.send":
      return actor.kind === "resident" ? "forbidden" : "ok"
    case "generalAlert.close":
      if (actor.kind === "manager") return "ok"
      if (actor.kind !== "front-desk") return "forbidden"
      return target.createdById === actor.personId ? "ok" : "forbidden"
    case "contacts.manage":
      return actor.kind === "manager" ? "ok" : "forbidden"
    case "contacts.showOwnPhone":
      if (actor.kind === "manager") return "ok"
      return actor.kind === "front-desk" && actor.isHeadDoorman ? "ok" : "forbidden"
  }
}

/** Carrega o estado atual do ator; null se não há ator ou ele não vale mais. */
export async function loadActor(deps: ServiceDeps, ctx: ServiceContext): Promise<ActorInfo | null> {
  const actor = ctx.actor
  if (!actor || actor.role.condominiumId !== ctx.condominiumId) return null
  const person = await deps.repo.get("people", actor.personId)
  if (!person || person.removedAt || person.condominiumId !== ctx.condominiumId) return null
  const role = actor.role
  if (role.kind === "resident") {
    const residency = await deps.repo.get("residencies", role.residencyId)
    if (!residency || residency.personId !== person.id) return null
    return {
      kind: "resident",
      personId: person.id,
      apartmentId: residency.apartmentId,
      isResponsible: residency.isResponsible,
      canVotePolls: residency.canVotePolls,
      canRegisterDeliveries: residency.canRegisterDeliveries,
    }
  }
  if (role.kind === "front-desk") {
    const staff = await deps.repo.get("staff", role.staffId)
    if (!staff || staff.personId !== person.id || staff.role !== "doorman") return null
    return { kind: "front-desk", personId: person.id, isHeadDoorman: staff.isHead }
  }
  const managers = await deps.repo.byIndex("managers", "byPerson", person.id)
  if (!managers.some((m) => m.condominiumId === ctx.condominiumId)) return null
  return { kind: "manager", personId: person.id }
}

export async function authorize(
  deps: ServiceDeps,
  ctx: ServiceContext,
  action: Action,
  target: Target = {},
) {
  const actor = await loadActor(deps, ctx)
  const decision = can(actor, action, target)
  if (decision === "forbidden") throw new ServiceError("forbidden", "Sem permissão para esta ação.")
  if (decision === "not_found") throw notFound("Registro")
  return actor!
}
