import { beforeEach, describe, expect, it } from "vitest"
import { commSetup, noticeInput } from "./comm-helpers"
import { ServiceError } from "@/services/contracts"

// História 5: central e preferências (RF-022 a RF-026).
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})

describe("central de notificações", () => {
  it("lista só as da pessoa, da mais nova para a mais antiga, e conta as não lidas", async () => {
    const lista = await env.services.notifications.list(env.resident)
    expect(lista.length).toBeGreaterThan(0)
    const datas = lista.map((n) => n.createdAt)
    expect([...datas].sort().reverse()).toEqual(datas)
    const naoLidas = await env.services.notifications.unreadCount(env.resident)
    expect(naoLidas).toBe(lista.filter((n) => !n.read).length)
  })

  it("marca uma como lida; não mexe na de outra pessoa", async () => {
    const [primeira] = await env.services.notifications.list(env.resident)
    await env.services.notifications.markRead(env.resident, primeira.id)
    expect((await env.services.notifications.list(env.resident))[0].read).toBe(true)
    const e = await env.services.notifications.markRead(env.family, primeira.id).catch((x) => x)
    expect((e as ServiceError).code).toBe("not_found")
  })

  it('"Ler todas" zera a contagem', async () => {
    await env.services.notices.create(env.manager, noticeInput())
    expect(await env.services.notifications.unreadCount(env.resident)).toBeGreaterThan(0)
    await env.services.notifications.markAllRead(env.resident)
    expect(await env.services.notifications.unreadCount(env.resident)).toBe(0)
    // A de outra pessoa continua.
    expect(await env.services.notifications.unreadCount(env.family)).toBeGreaterThan(0)
  })
})

describe("preferências (Como receber)", () => {
  it("começa tudo ligado e grava por pessoa, valendo em outro aparelho", async () => {
    const inicial = await env.services.notifications.getPrefs(env.resident)
    expect(Object.values(inicial.app).every(Boolean)).toBe(true)
    expect(inicial.whatsapp).toEqual({ deliveries: true, visitors: true })
    await env.services.notifications.setPrefs(env.resident, {
      ...inicial,
      app: { ...inicial.app, polls: false },
    })
    // Mesmo pessoa, outro aparelho: mesmo contexto de pessoa.
    expect((await env.services.notifications.getPrefs(env.resident)).app.polls).toBe(false)
    expect((await env.services.notifications.getPrefs(env.family)).app.polls).toBe(true)
  })

  it("não aceita WhatsApp para assuntos gerais (esclarecimento 2)", async () => {
    const e = await env.services.notifications
      .setPrefs(env.resident, {
        app: { notices: true, meetings: true, polls: true, deliveries: true, visitors: true },
        whatsapp: { deliveries: true, visitors: true, notices: true } as never,
      })
      .catch((x) => x)
    expect((e as ServiceError).code).toBe("validation")
  })

  it("desligar enquetes no app evita a notificação da próxima enquete", async () => {
    const p = await env.services.notifications.getPrefs(env.resident)
    await env.services.notifications.setPrefs(env.resident, {
      ...p,
      app: { ...p.app, polls: false },
    })
    const antes = await env.services.notifications.unreadCount(env.resident)
    await env.services.polls.create(env.manager, {
      question: "Trocar a grama do jardim?",
      options: ["Sim", "Não"],
      closesAt: new Date(env.clock.now.getTime() + 86_400_000).toISOString(),
      official: false,
      showPartial: true,
    })
    expect(await env.services.notifications.unreadCount(env.resident)).toBe(antes)
    expect(await env.services.notifications.unreadCount(env.family)).toBeGreaterThan(0)
  })
})
