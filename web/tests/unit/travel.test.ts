import { beforeEach, describe, expect, it } from "vitest"
import { code, commSetup, repoOf } from "./comm-helpers"
import { brasiliaToIso } from "@/i18n/datetime"

// História 5: modo viagem (RF-019). Relógio: 16/11/2026.
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})

describe("modo viagem", () => {
  it("ativa, a portaria vê e encerra", async () => {
    const t = await env.services.travel.start(env.resident, {
      from: "2026-11-16",
      to: "2026-11-21",
    })
    expect(t).toMatchObject({ from: "2026-11-16", to: "2026-11-21" })
    expect((await env.services.travel.mine(env.family))?.to).toBe("2026-11-21")
    const { apartments } = await env.services.desk.overview(env.frontDesk)
    expect(apartments.find((a) => a.number === "804")?.travelUntil).toBe("2026-11-21")
    expect((await env.services.desk.apartment(env.frontDesk, "804")).travelUntil).toBe("2026-11-21")
    expect(
      (await env.services.travel.active(env.frontDesk)).some((x) => x.apartment === "804"),
    ).toBe(true)
    await env.services.travel.end(env.resident)
    expect(await env.services.travel.mine(env.resident)).toBeNull()
  })

  it("valida datas e permissão", async () => {
    const det = async (from: string, to: string) =>
      (await env.services.travel.start(env.resident, { from, to }).catch((e) => e)).details
    expect(await det("2026-11-20", "2026-11-18")).toEqual({ to: "invalid" })
    expect(await det("2026-11-16", "2027-03-17")).toEqual({ to: "invalid" }) // 121 dias
    expect(await det("2026-11-10", "2026-11-18")).toEqual({ from: "past" })
    const repo = await repoOf(env)
    const [r] = await repo.byIndex("residencies", "byPerson", env.ids.family)
    await repo.put("residencies", { ...r, canRegisterDeliveries: false })
    expect(
      await code(env.services.travel.start(env.family, { from: "2026-11-16", to: "2026-11-18" })),
    ).toBe("forbidden")
    expect(await code(env.services.travel.mine(env.family))).toBe("ok")
    expect(await code(env.services.travel.active(env.resident))).toBe("forbidden")
  })

  it("um ativo por apartamento; deixa de valer no dia seguinte à volta", async () => {
    await env.services.travel.start(env.resident, { from: "2026-11-16", to: "2026-11-18" })
    await env.services.travel.start(env.family, { from: "2026-11-16", to: "2026-11-19" })
    expect((await env.services.travel.mine(env.resident))?.to).toBe("2026-11-19")
    env.clock.now = new Date(brasiliaToIso("2026-11-19", "23:00"))
    expect((await env.services.desk.apartment(env.frontDesk, "804")).travelUntil).toBe("2026-11-19")
    env.clock.now = new Date(brasiliaToIso("2026-11-20", "00:30"))
    expect((await env.services.desk.apartment(env.frontDesk, "804")).travelUntil).toBeNull()
  })
})
