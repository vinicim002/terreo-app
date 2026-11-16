import { IDBFactory } from "fake-indexeddb"
import { beforeEach, describe, expect, it } from "vitest"
import { ServiceError, type Services } from "@/services/contracts"
import { createLocalServices } from "@/services/local"
import { SEED_VERSION, TAQUARETINGA_ID, buildSeed } from "@/services/local/seed"

// A partir da spec 002, os serviços exigem quem está agindo (RF-030): aqui, a síndica.
const seed = buildSeed()
const sindica = seed.managers[0].personId
const ctx = {
  condominiumId: TAQUARETINGA_ID,
  actor: { personId: sindica, role: { kind: "manager" as const, condominiumId: TAQUARETINGA_ID } },
}
const OUTRO = "00000000-0000-4000-8000-999999999999"
/** A mesma síndica, mas com o papel apontando para outro condomínio. */
const outro = {
  condominiumId: OUTRO,
  actor: { personId: sindica, role: { kind: "manager" as const, condominiumId: OUTRO } },
}

/** Instante a partir de um horário de Brasília (UTC−3) num dia da semana de novembro de 2026. */
function brasilia(dia: number, hhmm: string) {
  // 15/11/2026 é domingo (weekday 0).
  const [h, m] = hhmm.split(":").map(Number)
  return new Date(Date.UTC(2026, 10, 15 + dia, h + 3, m))
}

let services: Services

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  services = createLocalServices()
})

describe("dados de exemplo", () => {
  it("cria o Taquaretinga com as contagens do data-model.md", async () => {
    const condo = await services.condominium.getCurrent(ctx)
    expect(condo).toMatchObject({ name: "Edifício Taquaretinga", floors: 12, unitsPerFloor: 4 })
    expect(await services.dev.counts(ctx)).toMatchObject({
      condominiums: 1,
      apartments: 48,
      staff: 5,
      managers: 1,
      shifts: 33,
    })
    expect(await services.apartments.list(ctx, { withoutResponsible: true })).toHaveLength(3)
  })

  it("numera os apartamentos de 101 a 1204, 4 por andar", async () => {
    const numeros = (await services.apartments.list(ctx)).map((a) => a.number)
    expect(numeros[0]).toBe("101")
    expect(numeros.at(-1)).toBe("1204")
    expect(new Set(numeros).size).toBe(48)
    expect(await services.apartments.list(ctx, { floor: 8 })).toHaveLength(4)
  })

  it("respeita as regras do data-model.md", async () => {
    const apartamentos = await services.apartments.list(ctx)
    const telefones = new Set<string>()
    for (const apt of apartamentos) {
      expect(apt.floor).toBeGreaterThanOrEqual(1)
      expect(apt.floor).toBeLessThanOrEqual(12)
      const moradores = await services.residents.listByApartment(ctx, apt.id)
      if (moradores.length === 0) {
        expect(apt.responsibleResidentId).toBeNull()
        continue
      }
      expect(moradores.length).toBeLessThanOrEqual(4)
      const responsaveis = moradores.filter((r) => r.isResponsible)
      expect(responsaveis, apt.number).toHaveLength(1)
      expect(apt.responsibleResidentId).toBe(responsaveis[0].residencyId)
      for (const r of moradores) {
        expect(r.apartmentId).toBe(apt.id)
        // Telefone fictício com DDD inexistente 00 (RF-028), único no condomínio.
        expect(r.phone).toMatch(/^\+5500\d{9}$/)
        expect(telefones.has(r.phone)).toBe(false)
        telefones.add(r.phone)
      }
    }
    expect(telefones.size).toBeGreaterThan(45)
  })

  it("não duplica ao abrir de novo e restaura quando pedido", async () => {
    const antes = await services.dev.counts(ctx)
    const reaberto = createLocalServices()
    expect(await reaberto.dev.counts(ctx)).toEqual(antes)

    const apt = await services.apartments.getByNumber(ctx, "804")
    expect(apt.number).toBe("804")
    await services.dev.resetSeed()
    expect(await services.dev.counts(ctx)).toEqual(antes)
    expect(SEED_VERSION).toBeGreaterThanOrEqual(1)
  })
})

describe("isolamento por condomínio (RF-026) e quem está agindo (RF-030 da 002)", () => {
  it("papel de outro condomínio não lê nada", async () => {
    await expect(services.condominium.getCurrent(outro)).rejects.toMatchObject({
      code: "forbidden",
    })
    await expect(services.apartments.list(outro)).rejects.toMatchObject({ code: "forbidden" })
    await expect(services.staff.list(outro)).rejects.toMatchObject({ code: "forbidden" })
    await expect(services.schedule.listWeek(outro)).rejects.toMatchObject({ code: "forbidden" })
    await expect(services.apartments.getByNumber(outro, "804")).rejects.toBeInstanceOf(ServiceError)
  })

  it("sem ninguém conectado, os serviços da spec 001 recusam", async () => {
    const semAtor = { condominiumId: TAQUARETINGA_ID }
    await expect(services.condominium.getCurrent(semAtor)).rejects.toMatchObject({
      code: "forbidden",
    })
    await expect(services.apartments.list(semAtor)).rejects.toMatchObject({ code: "forbidden" })
    await expect(services.staff.onDutyAt(semAtor, new Date())).rejects.toMatchObject({
      code: "forbidden",
    })
  })

  it("um id de outro condomínio dá not_found, nunca o dado", async () => {
    const [apt] = await services.apartments.list(ctx)
    const [morador] = await services.residents.listByApartment(ctx, apt.id)
    await expect(services.residents.get(outro, morador.residencyId)).rejects.toBeInstanceOf(
      ServiceError,
    )
  })

  it("apartamento inexistente dá not_found", async () => {
    await expect(services.apartments.getByNumber(ctx, "9999")).rejects.toMatchObject({
      code: "not_found",
    })
  })
})

describe("plantão pela escala, no horário de Brasília", () => {
  it.each([
    [1, "07:00", "06:00"],
    [1, "15:00", "14:00"],
    [1, "23:00", "22:00"],
    [3, "05:59", "22:00"], // turno da noite começou na terça
  ])("dia %i às %s está de plantão o porteiro do turno das %s", async (dia, hora, inicio) => {
    const plantao = await services.staff.onDutyAt(ctx, brasilia(dia, hora))
    const porteiros = plantao.filter((s) => s.role === "doorman")
    expect(porteiros).toHaveLength(1)
    const turnos = await services.schedule.listWeek(ctx)
    const turno = turnos.find((t) => t.staffId === porteiros[0].id && t.startTime === inicio)
    expect(turno, `${dia} ${hora}`).toBeDefined()
  })

  it("na madrugada de segunda, vale o turno da noite de domingo", async () => {
    const plantao = await services.staff.onDutyAt(ctx, brasilia(1, "02:00"))
    const turnos = await services.schedule.listWeek(ctx)
    const domingoNoite = turnos.find((t) => t.weekday === 0 && t.startTime === "22:00")!
    expect(plantao.map((s) => s.id)).toContain(domingoNoite.staffId)
  })

  it("inclui os faxineiros no horário deles", async () => {
    const plantao = await services.staff.onDutyAt(ctx, brasilia(2, "10:00")) // terça
    expect(plantao.filter((s) => s.role === "cleaner").length).toBeGreaterThanOrEqual(1)
    const domingo = await services.staff.onDutyAt(ctx, brasilia(0, "10:00"))
    expect(domingo.filter((s) => s.role === "cleaner")).toHaveLength(0)
  })
})
