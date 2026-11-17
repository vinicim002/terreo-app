import { beforeEach, describe, expect, it } from "vitest"
import { commSetup, noticeInput } from "./comm-helpers"
import { ServiceError } from "@/services/contracts"
import { brasiliaToIso } from "@/i18n/datetime"

// História 4: agenda do prédio (RF-017, RF-018). Relógio: segunda, 16/11/2026, 09:00 (Brasília).
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})

describe("agenda", () => {
  it("junta reuniões, eventos que se repetem e avisos com data, por dia de Brasília", async () => {
    const m = await env.services.meetings.create(env.manager, {
      startsAt: brasiliaToIso("2026-11-21", "22:30"), // 01:30 UTC do dia 22
      place: "Salão",
      agenda: ["Fachada"],
    })
    await env.services.agenda.createEvent(env.manager, {
      title: "Teste semanal",
      kind: "routine",
      startsAt: brasiliaToIso("2026-11-03", "08:00"),
      durationMinutes: null,
      recurrence: "weekly",
    })
    await env.services.notices.create(
      env.manager,
      noticeInput({ title: "Água", referenceDate: "2026-11-26" }),
    )
    const { days } = await env.services.agenda.month(env.resident, 2026, 11)
    expect(days["2026-11-21"].some((i) => i.target.id === m.id)).toBe(true)
    for (const d of ["03", "10", "17", "24"])
      expect(
        days[`2026-11-${d}`].some((i) => i.title === "Teste semanal"),
        d,
      ).toBe(true)
    expect(days["2026-11-26"].some((i) => i.kind === "notice" && i.title === "Água")).toBe(true)
  })

  it("evento mensal no dia 31 aparece no dia 30 de novembro (caso-limite)", async () => {
    await env.services.agenda.createEvent(env.manager, {
      title: "Mensal 31",
      kind: "maintenance",
      startsAt: brasiliaToIso("2026-10-31", "09:00"),
      durationMinutes: 60,
      recurrence: "monthly",
    })
    const { days } = await env.services.agenda.month(env.resident, 2026, 11)
    expect(days["2026-11-30"].some((i) => i.title === "Mensal 31")).toBe(true)
  })

  it("lista os 10 próximos a partir de agora, em ordem", async () => {
    const proximos = await env.services.agenda.upcoming(env.resident)
    expect(proximos.length).toBeLessThanOrEqual(10)
    const datas = proximos.map((i) => i.date)
    expect([...datas].sort()).toEqual(datas)
    // Dados de exemplo: reunião daqui a 5 dias e coleta seletiva semanal.
    expect(proximos.some((i) => i.kind === "meeting")).toBe(true)
    expect(proximos.some((i) => i.title === "Coleta seletiva" && i.recurrence === "weekly")).toBe(
      true,
    )
  })

  it("só o síndico cadastra e cancela eventos (RF-019)", async () => {
    const input = {
      title: "Vistoria",
      kind: "maintenance" as const,
      startsAt: brasiliaToIso("2026-11-20", "09:00"),
      durationMinutes: 60,
      recurrence: "none" as const,
    }
    for (const ctx of [env.resident, env.frontDesk]) {
      const e = await env.services.agenda.createEvent(ctx, input).catch((x) => x)
      expect((e as ServiceError).code).toBe("forbidden")
    }
    const item = await env.services.agenda.createEvent(env.manager, input)
    await env.services.agenda.cancelEvent(env.manager, item.target.id)
    const { days } = await env.services.agenda.month(env.frontDesk, 2026, 11)
    expect(days["2026-11-20"]?.some((i) => i.title === "Vistoria") ?? false).toBe(false)
  })
})
