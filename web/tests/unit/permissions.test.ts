import { IDBFactory } from "fake-indexeddb"
import { beforeEach, describe, expect, it } from "vitest"
import { can, type Action, type ActorInfo } from "@/services/permissions"
import { createLocalServices } from "@/services/local"
import { TAQUARETINGA_ID } from "@/services/local/seed"
import type { Services } from "@/services/contracts"

// contracts/permissoes.md — uma asserção por célula (CS-007, CS-007a).
const A = "apto-804"
const B = "apto-805"
const responsavel: ActorInfo = {
  kind: "resident",
  personId: "resp",
  apartmentId: A,
  isResponsible: true,
}
const familiar: ActorInfo = {
  kind: "resident",
  personId: "fam",
  apartmentId: A,
  isResponsible: false,
}
const portaria: ActorInfo = { kind: "front-desk", personId: "porteiro" }
const sindico: ActorInfo = { kind: "manager", personId: "sindico" }

const proprio = { apartmentId: A, personId: "outra-pessoa" }
const outroApto = { apartmentId: B, personId: "vizinho" }
const siMesmo = { apartmentId: A, personId: "resp" }

type Linha = [Action, object, string, string, string, string]
//              ação                     alvo        responsável  familiar     portaria     síndico
const MATRIZ: Linha[] = [
  ["apartment.view", proprio, "ok", "ok", "forbidden", "ok"],
  ["apartment.view", outroApto, "not_found", "not_found", "forbidden", "ok"],
  ["household.invite", { apartmentId: A }, "ok", "forbidden", "forbidden", "forbidden"],
  ["household.invite", { apartmentId: B }, "not_found", "not_found", "forbidden", "forbidden"],
  ["household.edit", proprio, "ok", "forbidden", "forbidden", "ok"],
  ["household.edit", outroApto, "not_found", "not_found", "forbidden", "ok"],
  ["household.remove", proprio, "ok", "forbidden", "forbidden", "ok"],
  ["household.remove", siMesmo, "forbidden", "forbidden", "forbidden", "ok"],
  ["household.remove", outroApto, "not_found", "not_found", "forbidden", "ok"],
  ["household.resend", proprio, "ok", "forbidden", "forbidden", "ok"],
  ["profile.editOwn", {}, "ok", "ok", "ok", "ok"],
  ["apartmentData.edit", { apartmentId: A }, "ok", "forbidden", "forbidden", "forbidden"],
  ["apartmentData.edit", { apartmentId: B }, "not_found", "not_found", "forbidden", "forbidden"],
  ["admin.manage", {}, "forbidden", "forbidden", "forbidden", "ok"],
  ["directory.view", {}, "forbidden", "forbidden", "ok", "forbidden"],
  ["rules.view", {}, "ok", "ok", "ok", "ok"],
  ["condominium.view", {}, "ok", "ok", "ok", "ok"],
]

describe("matriz de permissões", () => {
  it.each(MATRIZ)("%s %j", (acao, alvo, r, f, p, s) => {
    expect(can(responsavel, acao, alvo), "responsável").toBe(r)
    expect(can(familiar, acao, alvo), "familiar").toBe(f)
    expect(can(portaria, acao, alvo), "portaria").toBe(p)
    expect(can(sindico, acao, alvo), "síndico").toBe(s)
  })

  it.each(MATRIZ)("sem ninguém conectado: %s → forbidden", (acao, alvo) => {
    expect(can(null, acao, alvo)).toBe("forbidden")
  })
})

describe("serviços sem ninguém conectado (RF-030)", () => {
  let services: Services
  const semAtor = { condominiumId: TAQUARETINGA_ID }
  const qualquer = "00000000-0000-4000-8001-000000000001"

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory()
    services = createLocalServices()
  })

  const chamadas: [string, () => Promise<unknown>][] = [
    ["condominium.getCurrent", () => services.condominium.getCurrent(semAtor)],
    ["apartments.list", () => services.apartments.list(semAtor)],
    ["apartments.getByNumber", () => services.apartments.getByNumber(semAtor, "804")],
    ["apartments.get", () => services.apartments.get(semAtor, qualquer)],
    ["staff.list", () => services.staff.list(semAtor)],
    ["staff.onDutyAt", () => services.staff.onDutyAt(semAtor, new Date())],
    ["schedule.listWeek", () => services.schedule.listWeek(semAtor)],
    ["residents.listByApartment", () => services.residents.listByApartment(semAtor, qualquer)],
    [
      "residents.invite",
      () =>
        services.residents.invite(semAtor, {
          name: "Fulano",
          phone: "+5500900005555",
          kind: "family",
          canRegisterDeliveries: true,
          canVotePolls: false,
        }),
    ],
    ["people.updateOwnProfile", () => services.people.updateOwnProfile(semAtor, { name: "X" })],
    ["onboarding.acceptRules", () => services.onboarding.acceptRules(semAtor)],
    ["rules.list", () => services.rules.list(semAtor)],
    ["admin.overview", () => services.admin.overview(semAtor)],
    [
      "admin.registerResponsible",
      () =>
        services.admin.registerResponsible(semAtor, qualquer, {
          name: "Fulano",
          phone: "+5500900005555",
          kind: "owner",
        }),
    ],
    ["apartmentData.listVehicles", () => services.apartmentData.listVehicles(semAtor, qualquer)],
    [
      "apartmentData.saveVehicle",
      () =>
        services.apartmentData.saveVehicle(semAtor, {
          apartmentId: qualquer,
          plate: "ABC1234",
          model: "X",
          color: "Y",
        }),
    ],
    [
      "apartmentData.getEmergencyContact",
      () => services.apartmentData.getEmergencyContact(semAtor, qualquer),
    ],
    ["directory.apartment", () => services.directory.apartment(semAtor, "804")],
  ]

  it.each(chamadas)("%s → forbidden", async (_nome, chamar) => {
    await expect(chamar()).rejects.toMatchObject({ code: "forbidden" })
  })
})
