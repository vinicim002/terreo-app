import { beforeEach, describe, expect, it } from "vitest"
import { code, commSetup, outbox, repoOf } from "./comm-helpers"

// Spec 005, História 2: alerta geral (RF-010 a RF-013, CS-003).
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})

const incendio = { kind: "fire" as const, message: "Fumaça no 3º andar, desçam pela escada" }

describe("enviar", () => {
  it("só portaria e síndico enviam; mensagem de 5 a 280", async () => {
    expect(await code(env.services.generalAlert.send(env.resident, incendio))).toBe("forbidden")
    expect(
      await code(env.services.generalAlert.send(env.frontDesk, { kind: "fire", message: "Fogo" })),
    ).toBe("validation")
    expect(
      await code(
        env.services.generalAlert.send(env.frontDesk, { kind: "fire", message: "x".repeat(281) }),
      ),
    ).toBe("validation")
    const v = await env.services.generalAlert.send(env.frontDesk, incendio)
    expect(v).toMatchObject({
      status: "open",
      kind: "fire",
      createdBy: "Jonas Siqueira",
      seenByMe: true,
    })
  })

  it("com um em aberto, recusa outro (conflict)", async () => {
    await env.services.generalAlert.send(env.frontDesk, incendio)
    expect(
      await code(
        env.services.generalAlert.send(env.manager, { kind: "gas", message: "Cheiro de gás" }),
      ),
    ).toBe("conflict")
  })

  it("chega a todos no app, no grupo e no privado, mesmo com preferências desligadas (CS-003)", async () => {
    await env.services.notifications.setPrefs(env.resident, {
      app: { notices: false, meetings: false, polls: false, deliveries: false, visitors: false },
      whatsapp: { deliveries: false, visitors: false },
    })
    const repo = await repoOf(env)
    await env.services.generalAlert.send(env.frontDesk, incendio)
    for (const id of [env.ids.resident, env.ids.family, env.ids.manager, env.ids.frontDesk]) {
      const n = (await repo.byIndex("notifications", "byPerson", id)).filter(
        (x) => x.type === "general-alert",
      )
      expect(n).toHaveLength(1)
    }
    const grupo = (await outbox(env.services, "group")).filter((m) =>
      m.body.includes("ALERTA GERAL"),
    )
    expect(grupo).toHaveLength(1)
    expect(grupo[0].body).toContain("Incêndio")
    expect(grupo[0].body).toContain("Fumaça no 3º andar")
    const privados = (await outbox(env.services, "private")).filter((m) =>
      m.body.includes("Fumaça no 3º andar"),
    )
    const pessoas = await repo.all("people")
    const ativos = pessoas.filter((p) => !p.removedAt && p.firstAccessAt)
    // Todas as pessoas ativas (os faxineiros não entram no app nem têm cadastro de pessoa).
    expect(new Set(privados.map((m) => m.toPhone)).size).toBe(ativos.length)
  })
})

describe("ver, marcar visto e encerrar", () => {
  it("current com seenByMe por pessoa; markSeen fecha só para quem tocou", async () => {
    const a = await env.services.generalAlert.send(env.frontDesk, incendio)
    expect((await env.services.generalAlert.current(env.resident))?.seenByMe).toBe(false)
    await env.services.generalAlert.markSeen(env.resident, a.id)
    await env.services.generalAlert.markSeen(env.resident, a.id) // idempotente
    expect((await env.services.generalAlert.current(env.resident))?.seenByMe).toBe(true)
    expect((await env.services.generalAlert.current(env.family))?.seenByMe).toBe(false)
    const repo = await repoOf(env)
    expect((await repo.byIndex("generalAlertSeen", "byPerson", env.ids.resident)).length).toBe(1)
  })

  it("encerra quem enviou ou o síndico, avisando todos", async () => {
    const a = await env.services.generalAlert.send(env.frontDesk, incendio)
    expect((await env.services.generalAlert.current(env.manager))?.canClose).toBe(true)
    expect((await env.services.generalAlert.current(env.resident))?.canClose).toBe(false)
    expect(await code(env.services.generalAlert.close(env.resident, a.id, null))).toBe("forbidden")
    expect(await code(env.services.generalAlert.close(env.frontDesk, a.id, "x".repeat(281)))).toBe(
      "validation",
    )
    const v = await env.services.generalAlert.close(env.frontDesk, a.id, null)
    expect(v).toMatchObject({ status: "closed", closingMessage: null, closedBy: "Jonas Siqueira" })
    expect(await env.services.generalAlert.current(env.resident)).toBeNull()
    const grupo = (await outbox(env.services, "group")).filter((m) =>
      m.body.includes("Alerta encerrado"),
    )
    expect(grupo).toHaveLength(1)
    expect(grupo[0].body).toContain("Situação controlada.")
    const repo = await repoOf(env)
    const n = (await repo.byIndex("notifications", "byPerson", env.ids.family)).filter(
      (x) => x.type === "general-alert-closed",
    )
    expect(n).toHaveLength(1)
    expect(await code(env.services.generalAlert.close(env.manager, a.id, null))).toBe("conflict")
  })

  it("a portaria não encerra alerta enviado pelo síndico", async () => {
    const a = await env.services.generalAlert.send(env.manager, incendio)
    expect(await code(env.services.generalAlert.close(env.frontDesk, a.id, null))).toBe("forbidden")
    expect((await env.services.generalAlert.close(env.manager, a.id, "Tudo certo")).status).toBe(
      "closed",
    )
  })
})

describe("histórico (História 4)", () => {
  it("todos veem os gerais dos últimos 90 dias, do mais novo para o mais antigo", async () => {
    const a = await env.services.generalAlert.send(env.frontDesk, incendio)
    await env.services.generalAlert.close(env.frontDesk, a.id, null)
    for (const ctx of [env.resident, env.frontDesk, env.manager]) {
      const h = await env.services.generalAlert.history(ctx)
      expect(h[0].id).toBe(a.id)
      // O alerta de exemplo (gás, há 10 dias) também aparece.
      expect(h.some((x) => x.kind === "gas" && x.status === "closed")).toBe(true)
    }
    env.advance(91 * 86_400_000)
    expect(await env.services.generalAlert.history(env.resident)).toHaveLength(0)
  })
})
