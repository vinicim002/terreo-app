import { beforeEach, describe, expect, it } from "vitest"
import { commSetup, outbox } from "./comm-helpers"
import { ServiceError } from "@/services/contracts"
import { brasiliaToIso } from "@/i18n/datetime"

// História 4: reuniões do conselho (RF-019 a RF-021).
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})
const code = async (p: Promise<unknown>) => {
  try {
    await p
    return "ok"
  } catch (e) {
    return e instanceof ServiceError ? e.code : String(e)
  }
}
const reuniao = () => ({
  startsAt: brasiliaToIso("2026-11-21", "19:30"),
  place: "Salão de festas",
  agenda: ["Fachada", "Portão"],
})

describe("reuniões", () => {
  it("só o síndico cadastra; moradores são avisados e vai ao grupo", async () => {
    const grupoAntes = (await outbox(env.services, "group")).length
    const m = await env.services.meetings.create(env.manager, reuniao())
    expect(m.status).toBe("upcoming")
    const [n] = await env.services.notifications.list(env.resident)
    expect(n).toMatchObject({ type: "meeting", target: { kind: "meeting", id: m.id } })
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes + 1)
    for (const ctx of [env.resident, env.frontDesk])
      expect(await code(env.services.meetings.create(ctx, reuniao()))).toBe("forbidden")
    // Todos leem.
    for (const ctx of [env.resident, env.family, env.frontDesk])
      expect((await env.services.meetings.list(ctx)).upcoming.some((x) => x.id === m.id)).toBe(true)
  })

  it("valida local, pauta e data", async () => {
    const det = async (patch: object) =>
      (await env.services.meetings.create(env.manager, { ...reuniao(), ...patch }).catch((e) => e))
        .details
    expect(await det({ place: "S" })).toEqual({ place: "invalid" })
    expect(await det({ agenda: [] })).toEqual({ agenda: "invalid" })
    expect(await det({ agenda: Array(16).fill("Assunto") })).toEqual({ agenda: "invalid" })
    expect(await det({ startsAt: brasiliaToIso("2026-11-01", "10:00") })).toEqual({
      startsAt: "past",
    })
  })

  it("mudar a data avisa de novo", async () => {
    const m = await env.services.meetings.create(env.manager, reuniao())
    env.advance(60_000)
    await env.services.meetings.update(env.manager, m.id, {
      ...reuniao(),
      startsAt: brasiliaToIso("2026-11-22", "10:00"),
    })
    const [n] = await env.services.notifications.list(env.resident)
    expect(n.title).toContain("alterada")
  })

  it("o resumo só depois da reunião, e avisa (RF-021)", async () => {
    const m = await env.services.meetings.create(env.manager, reuniao())
    const cedo = await env.services.meetings
      .setSummary(env.manager, m.id, "Decidido")
      .catch((e) => e)
    expect(cedo.details).toEqual({ summary: "not_yet" })
    env.clock.now = new Date(brasiliaToIso("2026-11-22", "10:00"))
    const feita = await env.services.meetings.setSummary(env.manager, m.id, "Fachada: bege.")
    expect(feita.summary).toBe("Fachada: bege.")
    expect(feita.status).toBe("past")
    const notifs = await env.services.notifications.list(env.family)
    expect(notifs.some((n) => n.type === "meeting-summary" && n.target?.id === m.id)).toBe(true)
    expect(await code(env.services.meetings.setSummary(env.resident, m.id, "x"))).toBe("forbidden")
    const { past } = await env.services.meetings.list(env.resident)
    expect(past.find((x) => x.id === m.id)?.summary).toBe("Fachada: bege.")
  })

  it("cancelada some das listas", async () => {
    const m = await env.services.meetings.create(env.manager, reuniao())
    await env.services.meetings.cancel(env.manager, m.id)
    expect(
      (await env.services.meetings.list(env.resident)).upcoming.some((x) => x.id === m.id),
    ).toBe(false)
    expect(await code(env.services.meetings.get(env.resident, m.id))).toBe("not_found")
  })
})
