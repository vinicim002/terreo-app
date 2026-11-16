// Pessoas do apartamento, dados do apartamento e visão do síndico (spec 002, histórias 3, 4 e 5).
// Toda operação passa por `authorize` com a matriz de contracts/permissoes.md (RF-030).
import { isAcceptedPhone } from "@/phone/phone"
import { formatPlate, isValidPlate, normalizePlate } from "@/domain/plate"
import { fold, getIn, listIn, notFound, nowIso, save, type ServiceDeps } from "./base"
import {
  ServiceError,
  type ApartmentAdminService,
  type ApartmentDataService,
  type ApartmentOverview,
  type FrontDeskDirectoryService,
  type OnboardingService,
  type OutboxService,
  type PeopleService,
  type ResidencyService,
  type ResidentView,
  type RulesService,
  type ServiceContext,
} from "./contracts"
import { authorize } from "./permissions"
import { RuleTopicSchema, type Person, type Residency, type ResidentKind } from "./schemas"
import { endSessions, loadPerson, personView, phoneInUse, residentView, rolesOf } from "./views"

const inUse = () =>
  new ServiceError("validation", "Celular já cadastrado no condomínio.", { phone: "in_use" })
const invalidPhone = () => new ServiceError("validation", "Número inválido.", { phone: "invalid" })

function checkPhone(deps: ServiceDeps, phone: string) {
  if (!isAcceptedPhone(phone, deps.mode)) throw invalidPhone()
}

async function inviteMessage(deps: ServiceDeps, person: Person, apartmentNumber: string) {
  await save(deps, "outbox", {
    id: deps.uuid(),
    condominiumId: person.condominiumId,
    toPhone: person.phone,
    kind: "invite",
    body: `Térreo: ${person.name.split(" ")[0]}, você foi convidado para o apartamento ${apartmentNumber} do Edifício Taquaretinga. Abra o app e entre com este celular para receber o código.`,
    createdAt: nowIso(deps),
  })
}

async function createInvitee(
  deps: ServiceDeps,
  ctx: ServiceContext,
  apartmentId: string,
  input: {
    name: string
    phone: string
    kind: ResidentKind
    isResponsible: boolean
    canRegisterDeliveries: boolean
    canVotePolls: boolean
  },
) {
  checkPhone(deps, input.phone)
  if (await phoneInUse(deps, ctx.condominiumId, input.phone)) throw inUse()
  const now = nowIso(deps)
  const person = await save(deps, "people", {
    id: deps.uuid(),
    condominiumId: ctx.condominiumId,
    name: input.name.trim(),
    phone: input.phone,
    photo: null,
    firstAccessAt: null,
    welcomeSeenAt: null,
    rulesAcceptedAt: null,
    removedAt: null,
  })
  const residency = await save(deps, "residencies", {
    id: deps.uuid(),
    condominiumId: ctx.condominiumId,
    personId: person.id,
    apartmentId,
    kind: input.kind,
    isResponsible: input.isResponsible,
    canRegisterDeliveries: input.isResponsible || input.canRegisterDeliveries,
    canVotePolls: input.isResponsible || input.canVotePolls,
    invitedById: ctx.actor?.personId ?? null,
    invitedAt: now,
    lastInviteAt: now,
  })
  const apartment = await getIn(deps, "apartments", ctx.condominiumId, apartmentId, "Apartamento")
  await inviteMessage(deps, person, apartment.number)
  return { person, residency, apartment }
}

async function viewsOf(deps: ServiceDeps, residencies: Residency[]): Promise<ResidentView[]> {
  const views: ResidentView[] = []
  for (const r of residencies) {
    const person = await deps.repo.get("people", r.personId)
    if (person && !person.removedAt) views.push(residentView(person, r))
  }
  return views.sort(
    (a, b) =>
      Number(b.isResponsible) - Number(a.isResponsible) || a.name.localeCompare(b.name, "pt-BR"),
  )
}

export function residencyService(deps: ServiceDeps): ResidencyService {
  const load = (ctx: ServiceContext, id: string) =>
    getIn(deps, "residencies", ctx.condominiumId, id, "Morador")

  return {
    async listByApartment(ctx, apartmentId) {
      await authorize(deps, ctx, "apartment.view", { apartmentId })
      return viewsOf(deps, await deps.repo.byIndex("residencies", "byApartment", apartmentId))
    },
    async get(ctx, residencyId) {
      const residency = await load(ctx, residencyId)
      await authorize(deps, ctx, "apartment.view", { apartmentId: residency.apartmentId })
      return residentView(await loadPerson(deps, residency.personId), residency)
    },
    async invite(ctx, input) {
      const apartmentId =
        ctx.actor?.role.kind === "resident" ? ctx.actor.role.apartmentId : undefined
      await authorize(deps, ctx, "household.invite", { apartmentId })
      const { person, residency } = await createInvitee(deps, ctx, apartmentId!, {
        ...input,
        isResponsible: false,
      })
      return residentView(person, residency)
    },
    async update(ctx, residencyId, patch) {
      const residency = await load(ctx, residencyId)
      await authorize(deps, ctx, "household.edit", {
        apartmentId: residency.apartmentId,
        personId: residency.personId,
      })
      let person = await loadPerson(deps, residency.personId)
      if (patch.phone !== undefined && patch.phone !== person.phone) {
        checkPhone(deps, patch.phone)
        if (await phoneInUse(deps, ctx.condominiumId, patch.phone, person.id)) throw inUse()
        person = { ...person, phone: patch.phone }
        // O celular é o que dá acesso: o número antigo perde a sessão (RF-021).
        await endSessions(deps, person.id, "phone-changed")
      }
      if (patch.name !== undefined) person = { ...person, name: patch.name.trim() }
      await save(deps, "people", person)
      const updated = await save(deps, "residencies", {
        ...residency,
        kind: patch.kind ?? residency.kind,
        // O responsável sempre tem as duas permissões (RF-015a).
        canRegisterDeliveries:
          residency.isResponsible ||
          (patch.canRegisterDeliveries ?? residency.canRegisterDeliveries),
        canVotePolls: residency.isResponsible || (patch.canVotePolls ?? residency.canVotePolls),
      })
      return residentView(person, updated)
    },
    async remove(ctx, residencyId) {
      const residency = await load(ctx, residencyId)
      await authorize(deps, ctx, "household.remove", {
        apartmentId: residency.apartmentId,
        personId: residency.personId,
      })
      await deps.repo.remove("residencies", residency.id)
      if (residency.isResponsible) {
        const apartment = await getIn(
          deps,
          "apartments",
          ctx.condominiumId,
          residency.apartmentId,
          "Apartamento",
        )
        await save(deps, "apartments", { ...apartment, responsibleResidentId: null })
      }
      const person = await deps.repo.get("people", residency.personId)
      if (person) {
        // Sem outro papel, a pessoa deixa de existir para o app.
        if ((await rolesOf(deps, person)).length === 0)
          await save(deps, "people", { ...person, removedAt: nowIso(deps) })
        await endSessions(deps, person.id, "removed")
      }
    },
    async resendInvite(ctx, residencyId) {
      const residency = await load(ctx, residencyId)
      await authorize(deps, ctx, "household.resend", {
        apartmentId: residency.apartmentId,
        personId: residency.personId,
      })
      const person = await loadPerson(deps, residency.personId)
      if (person.firstAccessAt)
        throw new ServiceError("validation", "Esta pessoa já entrou no app.", { status: "active" })
      const updated = await save(deps, "residencies", { ...residency, lastInviteAt: nowIso(deps) })
      const apartment = await getIn(
        deps,
        "apartments",
        ctx.condominiumId,
        residency.apartmentId,
        "Apartamento",
      )
      await inviteMessage(deps, person, apartment.number)
      return residentView(person, updated)
    },
  }
}

export function peopleService(deps: ServiceDeps): PeopleService {
  return {
    async updateOwnProfile(ctx, patch) {
      const actor = await authorize(deps, ctx, "profile.editOwn")
      if ("phone" in patch) {
        throw new ServiceError(
          "validation",
          "O celular só muda pelo responsável ou pelo síndico.",
          { phone: "readonly" },
        )
      }
      const person = await loadPerson(deps, actor.personId)
      const updated = await save(deps, "people", {
        ...person,
        name: patch.name !== undefined ? patch.name.trim() : person.name,
        photo: patch.photo !== undefined ? patch.photo : person.photo,
      })
      return personView(updated)
    },
  }
}

export function onboardingService(deps: ServiceDeps): OnboardingService {
  async function mark(ctx: ServiceContext, field: "welcomeSeenAt" | "rulesAcceptedAt") {
    const actor = await authorize(deps, ctx, "condominium.view")
    const person = await loadPerson(deps, actor.personId)
    await save(deps, "people", { ...person, [field]: person[field] ?? nowIso(deps) })
  }
  return {
    markWelcomeSeen: (ctx) => mark(ctx, "welcomeSeenAt"),
    acceptRules: (ctx) => mark(ctx, "rulesAcceptedAt"),
  }
}

export function rulesService(deps: ServiceDeps): RulesService {
  return {
    async list(ctx, search) {
      await authorize(deps, ctx, "rules.view")
      const term = search ? fold(search.trim()) : ""
      const rules = (await listIn(deps, "rules", ctx.condominiumId))
        .filter((r) => !term || fold(`${r.title} ${r.body}`).includes(term))
        .sort((a, b) => a.order - b.order)
      return RuleTopicSchema.options
        .map((topic) => ({ topic, rules: rules.filter((r) => r.topic === topic) }))
        .filter((g) => g.rules.length > 0)
    },
  }
}

export function apartmentDataService(deps: ServiceDeps): ApartmentDataService {
  const view = (ctx: ServiceContext, apartmentId: string) =>
    authorize(deps, ctx, "apartment.view", { apartmentId })
  const edit = (ctx: ServiceContext, apartmentId: string) =>
    authorize(deps, ctx, "apartmentData.edit", { apartmentId })

  return {
    async listVehicles(ctx, apartmentId) {
      await view(ctx, apartmentId)
      return (await deps.repo.byIndex("vehicles", "byApartment", apartmentId)).map((v) => ({
        ...v,
      }))
    },
    async saveVehicle(ctx, input) {
      await edit(ctx, input.apartmentId)
      if (input.id) {
        const current = await getIn(deps, "vehicles", ctx.condominiumId, input.id, "Carro")
        if (current.apartmentId !== input.apartmentId) throw notFound("Carro")
      }
      const plate = normalizePlate(input.plate)
      if (!isValidPlate(plate))
        throw new ServiceError("validation", "Placa inválida.", { plate: "invalid" })
      const taken = (await listIn(deps, "vehicles", ctx.condominiumId)).some(
        (v) => v.plate === plate && v.id !== input.id,
      )
      if (taken)
        throw new ServiceError("validation", `A placa ${formatPlate(plate)} já está cadastrada.`, {
          plate: "in_use",
        })
      return save(deps, "vehicles", {
        id: input.id ?? deps.uuid(),
        condominiumId: ctx.condominiumId,
        apartmentId: input.apartmentId,
        plate,
        model: input.model.trim(),
        color: input.color.trim(),
      })
    },
    async removeVehicle(ctx, id) {
      const vehicle = await getIn(deps, "vehicles", ctx.condominiumId, id, "Carro")
      await edit(ctx, vehicle.apartmentId)
      await deps.repo.remove("vehicles", id)
    },
    async listPets(ctx, apartmentId) {
      await view(ctx, apartmentId)
      return deps.repo.byIndex("pets", "byApartment", apartmentId)
    },
    async savePet(ctx, input) {
      await edit(ctx, input.apartmentId)
      if (input.id) {
        const current = await getIn(deps, "pets", ctx.condominiumId, input.id, "Animal")
        if (current.apartmentId !== input.apartmentId) throw notFound("Animal")
      }
      return save(deps, "pets", {
        id: input.id ?? deps.uuid(),
        condominiumId: ctx.condominiumId,
        apartmentId: input.apartmentId,
        name: input.name.trim(),
        kind: input.kind,
      })
    },
    async removePet(ctx, id) {
      const pet = await getIn(deps, "pets", ctx.condominiumId, id, "Animal")
      await edit(ctx, pet.apartmentId)
      await deps.repo.remove("pets", id)
    },
    async getEmergencyContact(ctx, apartmentId) {
      await view(ctx, apartmentId)
      const [contact] = await deps.repo.byIndex("emergencyContacts", "byApartment", apartmentId)
      return contact ?? null
    },
    async saveEmergencyContact(ctx, input) {
      await edit(ctx, input.apartmentId)
      checkPhone(deps, input.phone)
      const [current] = await deps.repo.byIndex(
        "emergencyContacts",
        "byApartment",
        input.apartmentId,
      )
      return save(deps, "emergencyContacts", {
        id: current?.id ?? deps.uuid(),
        condominiumId: ctx.condominiumId,
        apartmentId: input.apartmentId,
        name: input.name.trim(),
        relationship: input.relationship.trim(),
        phone: input.phone,
      })
    },
    async removeEmergencyContact(ctx, apartmentId) {
      await edit(ctx, apartmentId)
      for (const c of await deps.repo.byIndex("emergencyContacts", "byApartment", apartmentId)) {
        await deps.repo.remove("emergencyContacts", c.id)
      }
    },
  }
}

export function apartmentAdminService(deps: ServiceDeps): ApartmentAdminService {
  return {
    async overview(ctx, input = {}) {
      await authorize(deps, ctx, "admin.manage")
      const [condos, apartments, residencies, people] = await Promise.all([
        listIn(deps, "condominiums", ctx.condominiumId),
        listIn(deps, "apartments", ctx.condominiumId),
        listIn(deps, "residencies", ctx.condominiumId),
        listIn(deps, "people", ctx.condominiumId),
      ])
      const personById = new Map(people.filter((p) => !p.removedAt).map((p) => [p.id, p]))
      const all: (ApartmentOverview & { names: string[] })[] = apartments
        .sort(
          (a, b) =>
            a.floor - b.floor || a.number.localeCompare(b.number, "pt-BR", { numeric: true }),
        )
        .map((apt) => {
          const rs = residencies.filter(
            (r) => r.apartmentId === apt.id && personById.has(r.personId),
          )
          const resp = rs.find((r) => r.id === apt.responsibleResidentId)
          const respPerson = resp ? personById.get(resp.personId)! : null
          return {
            apartmentId: apt.id,
            number: apt.number,
            floor: apt.floor,
            responsible: resp && respPerson ? { name: respPerson.name, kind: resp.kind } : null,
            people: rs.length,
            status: !resp ? "none" : respPerson?.firstAccessAt ? "active" : "pending",
            lastInviteAt: resp?.lastInviteAt ?? null,
            names: rs.map((r) => personById.get(r.personId)!.name),
          }
        })
      const term = input.search ? fold(input.search.trim()) : ""
      const matches = all.filter(
        (a) => !term || a.number.includes(term) || a.names.some((n) => fold(n).includes(term)),
      )
      const filtered = matches.filter((a) =>
        input.filter === "none"
          ? a.status === "none"
          : input.filter === "tenants"
            ? a.responsible?.kind === "tenant"
            : true,
      )
      return {
        totals: {
          apartments: apartments.length,
          floors: condos[0]?.floors ?? 0,
          all: matches.length,
          none: matches.filter((a) => a.status === "none").length,
          tenants: matches.filter((a) => a.responsible?.kind === "tenant").length,
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- "names" só serve à busca
        items: filtered.map(({ names, ...rest }) => rest),
      }
    },
    async registerResponsible(ctx, apartmentId, input) {
      await authorize(deps, ctx, "admin.manage")
      const apartment = await getIn(
        deps,
        "apartments",
        ctx.condominiumId,
        apartmentId,
        "Apartamento",
      )
      if (apartment.responsibleResidentId) {
        throw new ServiceError("validation", "Este apartamento já tem responsável.", {
          apartment: "has_responsible",
        })
      }
      const { person, residency } = await createInvitee(deps, ctx, apartmentId, {
        ...input,
        isResponsible: true,
        canRegisterDeliveries: true,
        canVotePolls: true,
      })
      await save(deps, "apartments", { ...apartment, responsibleResidentId: residency.id })
      return residentView(person, residency)
    },
    async setResponsible(ctx, apartmentId, residencyId) {
      await authorize(deps, ctx, "admin.manage")
      const apartment = await getIn(
        deps,
        "apartments",
        ctx.condominiumId,
        apartmentId,
        "Apartamento",
      )
      const next = await getIn(deps, "residencies", ctx.condominiumId, residencyId, "Morador")
      if (next.apartmentId !== apartment.id) throw notFound("Morador")
      if (apartment.responsibleResidentId && apartment.responsibleResidentId !== next.id) {
        const previous = await deps.repo.get("residencies", apartment.responsibleResidentId)
        if (previous) await save(deps, "residencies", { ...previous, isResponsible: false })
      }
      await save(deps, "residencies", {
        ...next,
        isResponsible: true,
        canRegisterDeliveries: true,
        canVotePolls: true,
      })
      await save(deps, "apartments", { ...apartment, responsibleResidentId: next.id })
    },
  }
}

export function directoryService(deps: ServiceDeps): FrontDeskDirectoryService {
  return {
    async apartment(ctx, number) {
      await authorize(deps, ctx, "directory.view")
      const apartment = (await listIn(deps, "apartments", ctx.condominiumId)).find(
        (a) => a.number === number,
      )
      if (!apartment) throw notFound("Apartamento")
      const residencies = await deps.repo.byIndex("residencies", "byApartment", apartment.id)
      const people: { name: string; photo: string | null; kind: ResidentKind }[] = []
      for (const r of residencies) {
        const p = await deps.repo.get("people", r.personId)
        // Só pessoas ativas; nada de celular, animais, contato, permissões ou convites (RF-029a).
        if (p && !p.removedAt && p.firstAccessAt)
          people.push({ name: p.name, photo: p.photo, kind: r.kind })
      }
      const vehicles = (await deps.repo.byIndex("vehicles", "byApartment", apartment.id)).map(
        (v) => ({
          plate: v.plate,
          model: v.model,
          color: v.color,
        }),
      )
      return { number: apartment.number, people, vehicles }
    },
  }
}

export function outboxService(deps: ServiceDeps): OutboxService {
  const sorted = <T extends { createdAt: string }>(list: T[]) =>
    [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return {
    async latestTo(phone) {
      return sorted(await deps.repo.byIndex("outbox", "byPhone", phone))[0] ?? null
    },
    async list() {
      return sorted(await deps.repo.all("outbox"))
    },
  }
}
