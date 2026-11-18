import { beforeEach, describe, expect, it } from "vitest"
import { code, commSetup, outbox, repoOf } from "./comm-helpers"
import { brasiliaToIso } from "@/i18n/datetime"
import { VisitorSchema } from "@/services/schemas"
import type { VisitorInput } from "@/services/contracts"

// História 3: visitantes (RF-011 a RF-015, esclarecimento 3, RF-013a). Relógio: 16/11/2026 09:00.
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})
const visita = (patch: Partial<VisitorInput> = {}): VisitorInput => ({
  kind: "visit",
  name: "Mariana Costa",
  day: "2026-11-16",
  fromTime: "19:00",
  toTime: "21:00",
  people: 2,
  ...patch,
})

describe("visitantes", () => {
  it("qualquer pessoa do apto avisa; todos do apto veem; outro apto e portaria não", async () => {
    const v = await env.services.visitors.register(env.family, visita())
    expect(v).toMatchObject({ apartment: "804", status: "expected", canCancel: true })
    const { expected } = await env.services.visitors.mine(env.resident)
    expect(expected.find((x) => x.id === v.id)?.canCancel).toBe(true) // responsável
    expect(await code(env.services.visitors.register(env.frontDesk, visita()))).toBe("forbidden")
    expect(await code(env.services.visitors.mine(env.manager))).toBe("forbidden")
  })

  it("valida dia, horário e pessoas; prestador conta 1", async () => {
    const det = async (i: VisitorInput) =>
      (await env.services.visitors.register(env.resident, i).catch((e) => e)).details
    expect(await det(visita({ day: "2026-11-15" }))).toEqual({ day: "out_of_range" })
    expect(await det(visita({ day: "2026-12-17" }))).toEqual({ day: "out_of_range" })
    expect(await det(visita({ fromTime: "21:00", toTime: "19:00" }))).toEqual({ toTime: "invalid" })
    expect(await det(visita({ people: 21 }))).toEqual({ people: "invalid" })
    expect(await det(visita({ name: "M" }))).toEqual({ name: "invalid" })
    const p = await env.services.visitors.register(
      env.resident,
      visita({ kind: "provider", name: "Técnico da Claro", people: 5 }),
    )
    expect(p.people).toBe(1)
  })

  it("cancela quem avisou ou o responsável; outro morador não", async () => {
    const doResp = await env.services.visitors.register(env.resident, visita())
    expect(await code(env.services.visitors.cancel(env.family, doResp.id))).toBe("forbidden")
    const doFam = await env.services.visitors.register(env.family, visita({ name: "Outra Visita" }))
    expect(await code(env.services.visitors.cancel(env.resident, doFam.id))).toBe("ok")
    expect(await code(env.services.visitors.cancel(env.resident, doResp.id))).toBe("ok")
  })

  it("a portaria vê os esperados de hoje em ordem e confirma a entrada, avisando quem avisou e o responsável", async () => {
    const tarde = await env.services.visitors.register(
      env.family,
      visita({ name: "Visita da tarde", fromTime: "15:00", toTime: "16:00" }),
    )
    const noite = await env.services.visitors.register(
      env.family,
      visita({ name: "Visita da noite" }),
    )
    await env.services.visitors.register(env.family, visita({ name: "Amanhã", day: "2026-11-17" }))
    const { expected } = await env.services.visitors.today(env.frontDesk)
    const ordem = expected.map((v) => v.id)
    expect(ordem.indexOf(tarde.id)).toBeLessThan(ordem.indexOf(noite.id))
    expect(expected.some((v) => v.name === "Amanhã")).toBe(false)
    expect(await code(env.services.visitors.today(env.resident))).toBe("forbidden")

    // Com a faixa já passada, continua esperado até o fim do dia.
    env.clock.now = new Date(brasiliaToIso("2026-11-16", "17:00"))
    expect(
      (await env.services.visitors.today(env.frontDesk)).expected.some((v) => v.id === tarde.id),
    ).toBe(true)

    const chegou = await env.services.visitors.checkIn(env.frontDesk, tarde.id)
    expect(chegou).toMatchObject({ status: "arrived", releasedBy: "Jonas Siqueira" })
    const repo = await repoOf(env)
    const avisados = (await repo.all("notifications"))
      .filter((n) => n.target?.id === tarde.id)
      .map((n) => n.personId)
    expect(avisados.sort()).toEqual([env.ids.family, env.ids.resident].sort())
    expect(
      (await outbox(env.services, "group")).some((m) => m.body.includes("Visita da tarde")),
    ).toBe(false)
    const { history } = await env.services.visitors.mine(env.resident)
    expect(history.find((v) => v.id === tarde.id)?.releasedBy).toBe("Jonas Siqueira")
  })

  it("visitante sem cadastro avisa todos do apto e entra no histórico", async () => {
    const v = await env.services.visitors.walkIn(env.frontDesk, {
      apartmentNumber: "804",
      name: "Pedro Henrique",
    })
    expect(v).toMatchObject({ walkIn: true, status: "arrived" })
    const repo = await repoOf(env)
    const apt = (await repo.byIndex("residencies", "byPerson", env.ids.resident))[0].apartmentId
    const ativos = (await repo.byIndex("residencies", "byApartment", apt)).length
    expect((await repo.all("notifications")).filter((n) => n.target?.id === v.id)).toHaveLength(
      ativos,
    )
    expect((await env.services.visitors.today(env.frontDesk)).arrived[0].id).toBe(v.id)
  })

  it("não guarda documento, CPF nem foto de visitante (RF-014)", async () => {
    const v = await env.services.visitors.register(env.resident, visita())
    const repo = await repoOf(env)
    const salvo = (await repo.get("visitors", v.id))!
    const comDocumento = VisitorSchema.parse({ ...salvo, document: "123", cpf: "000", photo: "x" })
    expect(Object.keys(comDocumento)).not.toContain("document")
    expect(Object.keys(comDocumento)).not.toContain("cpf")
    expect(Object.keys(comDocumento)).not.toContain("photo")
  })
})
