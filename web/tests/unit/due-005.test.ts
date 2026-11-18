import { beforeEach, describe, expect, it } from "vitest"
import { commSetup, repoOf } from "./comm-helpers"

// Spec 005, RF-009: sem "Estou indo" em 2 minutos, o alerta toca de novo e o síndico é avisado, uma única vez.
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})

const repetidos = async (personId: string) => {
  const repo = await repoOf(env)
  return (await repo.byIndex("notifications", "byPerson", personId)).filter((n) =>
    n.title.startsWith("🚨 Ainda sem resposta"),
  )
}

describe("repetição do alerta", () => {
  it("repete depois de 2 minutos, uma vez só", async () => {
    const a = await env.services.emergency.raise(env.family, "health")
    env.advance(119_000)
    let [v] = await env.services.emergency.open(env.frontDesk)
    expect(v.repeated).toBe(false)
    env.advance(2_000)
    ;[v] = await env.services.emergency.open(env.frontDesk)
    expect(v.repeated).toBe(true)
    expect(await repetidos(env.ids.manager)).toHaveLength(1)
    expect(await repetidos(env.ids.frontDesk)).toHaveLength(1)
    // Idempotente: novas leituras não repetem de novo.
    env.advance(5 * 60_000)
    await env.services.emergency.open(env.frontDesk)
    await env.services.emergency.mine(env.family)
    expect(await repetidos(env.ids.manager)).toHaveLength(1)
    expect(a.id).toBe(v.id)
  })

  it("atendido ou cancelado não repete", async () => {
    const a = await env.services.emergency.raise(env.family, "health")
    await env.services.emergency.acknowledge(env.frontDesk, a.id)
    env.advance(3 * 60_000)
    await env.services.emergency.open(env.frontDesk)
    expect(await repetidos(env.ids.manager)).toHaveLength(0)

    const repo = await repoOf(env)
    await env.services.emergency.resolve(env.frontDesk, a.id, null)
    const b = await env.services.emergency.raise(env.family, "fire")
    await env.services.emergency.cancel(env.family, b.id)
    env.advance(3 * 60_000)
    await env.services.emergency.history(env.manager)
    expect(await repetidos(env.ids.manager)).toHaveLength(0)
    expect((await repo.get("emergencyAlerts", b.id))?.repeatedAt).toBeNull()
  })
})
