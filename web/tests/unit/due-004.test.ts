import { beforeEach, describe, expect, it } from "vitest"
import { commSetup, repoOf } from "./comm-helpers"
import { brasiliaToIso, dayKeyBrasilia } from "@/i18n/datetime"

// research R2: lembretes de encomenda parada (esclarecimento 2), código que não chegou e visitante que não veio.
// Relógio: segunda, 16/11/2026, 09:00 (Brasília).
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})

const lembretes = async (id: string) =>
  (await env.services.notifications.list(env.resident)).filter(
    (n) => n.type === "delivery-reminder" && n.target?.id === id,
  )

describe("runDue da portaria", () => {
  it("lembra no 3º dia e depois uma vez por dia, para os mesmos avisados", async () => {
    const d = await env.services.deliveries.receive(env.frontDesk, {
      apartmentNumber: "804",
      size: "medium",
      store: "amazon",
      photo: null,
      notifyResident: true,
    })
    env.clock.now = new Date(brasiliaToIso("2026-11-18", "20:00")) // 2º dia
    expect(await lembretes(d.id)).toHaveLength(0)
    env.clock.now = new Date(brasiliaToIso("2026-11-19", "08:00")) // 3º dia
    expect(await lembretes(d.id)).toHaveLength(1)
    env.clock.now = new Date(brasiliaToIso("2026-11-19", "18:00"))
    expect(await lembretes(d.id)).toHaveLength(1)
    env.clock.now = new Date(brasiliaToIso("2026-11-20", "07:00"))
    expect(await lembretes(d.id)).toHaveLength(2)
    // O familiar também recebe (sem código: todos do apto).
    expect(
      (await env.services.notifications.list(env.family)).filter(
        (n) => n.type === "delivery-reminder" && n.target?.id === d.id,
      ),
    ).toHaveLength(2)
    // Depois de retirada, para.
    await env.services.deliveries.pickUp(env.resident, d.id)
    env.clock.now = new Date(brasiliaToIso("2026-11-21", "07:00"))
    expect(await lembretes(d.id)).toHaveLength(2)
  })

  it("não lembra durante o modo viagem; volta no dia seguinte à volta", async () => {
    await env.services.travel.start(env.resident, { from: "2026-11-16", to: "2026-11-20" })
    const d = await env.services.deliveries.receive(env.frontDesk, {
      apartmentNumber: "804",
      size: "small",
      store: "shopee",
      photo: null,
      notifyResident: true,
    })
    env.clock.now = new Date(brasiliaToIso("2026-11-20", "10:00"))
    expect(await lembretes(d.id)).toHaveLength(0)
    env.clock.now = new Date(brasiliaToIso("2026-11-21", "08:00"))
    expect(await lembretes(d.id)).toHaveLength(1)
  })

  it("código sem chegada há mais de 7 dias vira Não chegou", async () => {
    const d = await env.services.deliveries.registerCode(env.resident, {
      store: "amazon",
      code: "7DIAS",
      onArrival: "front-desk",
      confirmDuplicate: true,
    })
    env.advance(7 * 86_400_000 - 1000)
    expect(
      (await env.services.deliveries.mine(env.resident)).awaiting.some((x) => x.id === d.id),
    ).toBe(true)
    env.advance(2000)
    const { awaiting, done } = await env.services.deliveries.mine(env.resident)
    expect(awaiting.some((x) => x.id === d.id)).toBe(false)
    expect(done.find((x) => x.id === d.id)?.status).toBe("not-arrived")
  })

  it("visitante esperado de um dia que passou vira Não veio; rodar de novo não muda nada", async () => {
    const v = await env.services.visitors.register(env.resident, {
      kind: "visit",
      name: "Mariana Costa",
      day: dayKeyBrasilia(env.clock.now),
      fromTime: "19:00",
      toTime: "21:00",
      people: 2,
    })
    env.clock.now = new Date(brasiliaToIso("2026-11-16", "23:30"))
    expect(
      (await env.services.visitors.today(env.frontDesk)).expected.some((x) => x.id === v.id),
    ).toBe(true)
    env.clock.now = new Date(brasiliaToIso("2026-11-17", "00:10"))
    await env.services.visitors.mine(env.resident)
    await env.services.visitors.mine(env.resident)
    const repo = await repoOf(env)
    expect((await repo.get("visitors", v.id))?.status).toBe("no-show")
  })
})
