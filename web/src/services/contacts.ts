// Contatos importantes (spec 005, História 3; research R7). Os cadastrados à mão pelo síndico (portaria, emergência
// e serviços) ficam na loja `contacts`; síndico e porteiro-chefe vêm do cadastro na leitura, com o celular só se a
// própria pessoa autorizou (esclarecimento 2).
import { fold, getIn, listIn, save, type ServiceDeps } from "./base"
import { ServiceError, type ContactInput, type ContactService, type ContactView } from "./contracts"
import { displayPhone, isBrazilianMobile, normalizeDialable } from "./dialable"
import { authorize } from "./permissions"
import type { Contact, ContactGroup, Person } from "./schemas"

const invalid = (field: string, reason: string) =>
  new ServiceError("validation", "Dado inválido.", { [field]: reason })

function manualView(c: Contact): ContactView {
  return {
    id: c.id,
    group: c.group,
    name: c.name,
    description: c.description,
    phone: c.phone,
    display: displayPhone(c.phone),
    isMobile: c.isMobile,
    frontDesk: c.frontDesk,
    fromRegistry: false,
    role: null,
  }
}

function registryView(person: Person, role: "manager" | "head-doorman"): ContactView {
  const show = !!person.showPhoneInContacts
  return {
    id: null,
    group: "building",
    name: person.name,
    description: null,
    phone: show ? person.phone : null,
    display: show ? displayPhone(person.phone) : null,
    isMobile: show && isBrazilianMobile(person.phone),
    frontDesk: false,
    fromRegistry: true,
    role,
  }
}

const byOrder = (a: Contact, b: Contact) => a.order - b.order || a.name.localeCompare(b.name)

export function contactService(deps: ServiceDeps): ContactService {
  async function registry(condominiumId: string) {
    const [managers, staff] = await Promise.all([
      deps.repo.byIndex("managers", "byCondominium", condominiumId),
      deps.repo.byIndex("staff", "byCondominium", condominiumId),
    ])
    const out: ContactView[] = []
    for (const m of managers) {
      const p = await deps.repo.get("people", m.personId)
      if (p && !p.removedAt) out.push(registryView(p, "manager"))
    }
    for (const s of staff.filter((x) => x.role === "doorman" && x.isHead && x.personId)) {
      const p = await deps.repo.get("people", s.personId!)
      if (p && !p.removedAt) out.push(registryView(p, "head-doorman"))
    }
    return out
  }

  return {
    async list(ctx, search) {
      await authorize(deps, ctx, "contacts.view")
      const manual = (await listIn(deps, "contacts", ctx.condominiumId)).sort(byOrder)
      const front = manual.filter((c) => c.group === "building" && c.frontDesk).map(manualView)
      const otherBuilding = manual
        .filter((c) => c.group === "building" && !c.frontDesk)
        .map(manualView)
      const building = [...front, ...(await registry(ctx.condominiumId)), ...otherBuilding]
      const emergency = manual.filter((c) => c.group === "emergency").map(manualView)
      const q = fold(search?.trim() ?? "")
      const match = (c: ContactView) =>
        !q ||
        fold(`${c.name} ${c.description ?? ""} ${c.display ?? ""} ${c.phone ?? ""}`).includes(q)
      return { building: building.filter(match), emergency: emergency.filter(match) }
    },

    async manual(ctx) {
      await authorize(deps, ctx, "contacts.manage")
      const all = (await listIn(deps, "contacts", ctx.condominiumId)).sort(byOrder)
      return all.map(manualView)
    },

    async save(ctx, input: ContactInput) {
      await authorize(deps, ctx, "contacts.manage")
      const name = input.name.trim()
      if (name.length < 2) throw invalid("name", "too_short")
      if (name.length > 60) throw invalid("name", "too_long")
      const description = input.description?.trim() || null
      if (description && description.length > 60) throw invalid("description", "too_long")
      const all = await listIn(deps, "contacts", ctx.condominiumId)
      const existing = input.id
        ? await getIn(deps, "contacts", ctx.condominiumId, input.id, "Contato")
        : null
      // Número que não mudou (ex.: o fictício dos dados de exemplo) fica como está.
      const digits = input.phone.replace(/\D/g, "")
      const stored = existing?.phone.replace(/\D/g, "")
      const unchanged = !!existing && (digits === stored || `55${digits}` === stored)
      const number = unchanged
        ? { tel: existing!.phone, isMobile: existing!.isMobile }
        : normalizeDialable(input.phone)
      if (!number) throw invalid("phone", "invalid")
      const group = input.group
      const frontDesk = group === "building" && !!input.frontDesk
      const order =
        existing && existing.group === group
          ? existing.order
          : Math.max(-1, ...all.filter((c) => c.group === group).map((c) => c.order)) + 1
      const saved = await save(deps, "contacts", {
        id: existing?.id ?? deps.uuid(),
        condominiumId: ctx.condominiumId,
        group,
        name,
        description,
        phone: number.tel,
        isMobile: number.isMobile,
        frontDesk,
        order,
      })
      // Só um número da portaria.
      if (frontDesk)
        for (const c of all)
          if (c.frontDesk && c.id !== saved.id)
            await save(deps, "contacts", { ...c, frontDesk: false })
      return manualView(saved)
    },

    async remove(ctx, id) {
      await authorize(deps, ctx, "contacts.manage")
      await getIn(deps, "contacts", ctx.condominiumId, id, "Contato")
      await deps.repo.remove("contacts", id)
    },

    async reorder(ctx, group: ContactGroup, ids) {
      await authorize(deps, ctx, "contacts.manage")
      const all = (await listIn(deps, "contacts", ctx.condominiumId)).filter(
        (c) => c.group === group,
      )
      const byId = new Map(all.map((c) => [c.id, c]))
      if (ids.length !== all.length || ids.some((id) => !byId.has(id)))
        throw invalid("ids", "mismatch")
      for (const [i, id] of ids.entries())
        await save(deps, "contacts", { ...byId.get(id)!, order: i })
    },

    async showMyPhone(ctx) {
      const actor = await authorize(deps, ctx, "contacts.showOwnPhone")
      return !!(await deps.repo.get("people", actor.personId))?.showPhoneInContacts
    },

    async setShowMyPhone(ctx, show) {
      const actor = await authorize(deps, ctx, "contacts.showOwnPhone")
      const person = await getIn(deps, "people", ctx.condominiumId, actor.personId, "Pessoa")
      await save(deps, "people", { ...person, showPhoneInContacts: show })
    },
  }
}
