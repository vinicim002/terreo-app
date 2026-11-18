import { beforeEach, describe, expect, it } from "vitest"
import { commSetup, outbox } from "./comm-helpers"
import { notify } from "@/services/notify"
import { createLocalRepository } from "@/services/local"
import { TAQUARETINGA_ID } from "@/services/local/seed"
import type { ServiceDeps } from "@/services/base"

// research R2: canais e preferências (RF-024 a RF-026, CS-006).
let env: Awaited<ReturnType<typeof commSetup>>
let deps: ServiceDeps
let n = 0

beforeEach(async () => {
  env = await commSetup()
  deps = {
    repo: createLocalRepository(undefined, () => env.clock.now),
    mode: "dev",
    now: () => env.clock.now,
    uuid: () => `00000000-0000-4000-9000-${String(++n).padStart(12, "0")}`,
    otpCode: () => "123456",
  }
})

const count = async (personId: string) =>
  (await deps.repo.byIndex("notifications", "byPerson", personId)).length

describe("notify", () => {
  it("avisa moradores ativos no app e manda uma única mensagem ao grupo", async () => {
    const antes = await count(env.ids.resident)
    const grupoAntes = (await outbox(env.services, "group")).length
    const privadoAntes = (await outbox(env.services, "private")).length
    await notify(deps, TAQUARETINGA_ID, {
      type: "notice",
      audience: "residents",
      title: "Teste",
      body: "Texto",
      target: null,
      toGroup: true,
    })
    expect(await count(env.ids.resident)).toBe(antes + 1)
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes + 1)
    // Assuntos gerais nunca vão ao privado (RF-026).
    expect((await outbox(env.services, "private")).length).toBe(privadoAntes)
  })

  it("só inclui a portaria em avisos", async () => {
    const antes = await count(env.ids.frontDesk)
    const base = { title: "T", body: "B", target: null, audience: "residents+staff" as const }
    await notify(deps, TAQUARETINGA_ID, { ...base, type: "notice" })
    await notify(deps, TAQUARETINGA_ID, { ...base, type: "poll" })
    expect(await count(env.ids.frontDesk)).toBe(antes + 1)
    // "residents" não inclui a portaria.
    await notify(deps, TAQUARETINGA_ID, { ...base, type: "notice", audience: "residents" })
    expect(await count(env.ids.frontDesk)).toBe(antes + 1)
  })

  it("respeita a preferência no app, mas o grupo continua", async () => {
    await env.services.notifications.setPrefs(env.resident, {
      app: { notices: true, meetings: true, polls: false, deliveries: true, visitors: true },
      whatsapp: { deliveries: true, visitors: true },
    })
    const antes = await count(env.ids.resident)
    const grupoAntes = (await outbox(env.services, "group")).length
    await notify(deps, TAQUARETINGA_ID, {
      type: "poll",
      audience: "residents",
      title: "Enquete",
      body: "x",
      target: null,
      toGroup: true,
    })
    expect(await count(env.ids.resident)).toBe(antes)
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes + 1)
  })

  it("manda entregas ao privado só com o WhatsApp ligado, e nunca ao grupo", async () => {
    await env.services.notifications.setPrefs(env.resident, {
      app: { notices: true, meetings: true, polls: true, deliveries: true, visitors: true },
      whatsapp: { deliveries: false, visitors: true },
    })
    const grupoAntes = (await outbox(env.services, "group")).length
    const ids = { personIds: [env.ids.resident, env.ids.family] }
    await notify(deps, TAQUARETINGA_ID, {
      type: "delivery",
      audience: ids,
      title: "Encomenda",
      body: "Chegou",
      target: null,
      toGroup: true,
    })
    const privado = await outbox(env.services, "private")
    expect(privado.filter((m) => m.body.includes("Encomenda"))).toHaveLength(1)
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes)
  })

  it("emergência ignora as preferências e chega a todos no app e no privado (RF-025)", async () => {
    await env.services.notifications.setPrefs(env.resident, {
      app: { notices: false, meetings: false, polls: false, deliveries: false, visitors: false },
      whatsapp: { deliveries: false, visitors: false },
    })
    const antes = await count(env.ids.resident)
    await notify(deps, TAQUARETINGA_ID, {
      type: "emergency",
      audience: "residents+staff",
      title: "Incêndio",
      body: "Saiam pela escada",
      target: null,
    })
    expect(await count(env.ids.resident)).toBe(antes + 1)
    expect(await count(env.ids.frontDesk)).toBeGreaterThan(0)
    const privado = (await outbox(env.services, "private")).filter((m) =>
      m.body.includes("Incêndio"),
    )
    // 44 apartamentos ativos com 1 a 4 pessoas, mais 3 porteiros: todos recebem.
    expect(privado.length).toBeGreaterThan(90)
  })

  it("não vaza para outro condomínio", async () => {
    const outro = "00000000-0000-4000-8000-0000000000ff"
    const antes = await count(env.ids.resident)
    await notify(deps, outro, {
      type: "notice",
      audience: "residents",
      title: "x",
      body: "y",
      target: null,
      toGroup: true,
    })
    expect(await count(env.ids.resident)).toBe(antes)
  })
})

describe("notify — portaria (spec 004, research R7)", () => {
  const privados = async (texto: string) =>
    (await outbox(env.services, "private")).filter((m) => m.body.includes(texto))

  it("entregas, lembretes e correspondência vão ao app e ao privado, nunca ao grupo (CS-004)", async () => {
    const grupoAntes = (await outbox(env.services, "group")).length
    for (const type of ["delivery", "delivery-reminder", "mail"] as const) {
      const antes = await count(env.ids.resident)
      await notify(deps, TAQUARETINGA_ID, {
        type,
        audience: { personIds: [env.ids.resident] },
        title: `Teste ${type}`,
        body: "x",
        target: null,
        toGroup: true,
      })
      expect(await count(env.ids.resident)).toBe(antes + 1)
      expect(await privados(`Teste ${type}`)).toHaveLength(1)
    }
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes)
  })

  it("visitante segue a preferência Visitantes", async () => {
    await env.services.notifications.setPrefs(env.resident, {
      app: { notices: true, meetings: true, polls: true, deliveries: true, visitors: false },
      whatsapp: { deliveries: true, visitors: false },
    })
    const antes = await count(env.ids.resident)
    await notify(deps, TAQUARETINGA_ID, {
      type: "visitor",
      audience: { personIds: [env.ids.resident] },
      title: "Visita chegou",
      body: "x",
      target: null,
    })
    expect(await count(env.ids.resident)).toBe(antes)
    expect(await privados("Visita chegou")).toHaveLength(0)
  })

  it("recados e achados só no app, mesmo com tudo desligado", async () => {
    await env.services.notifications.setPrefs(env.resident, {
      app: { notices: false, meetings: false, polls: false, deliveries: false, visitors: false },
      whatsapp: { deliveries: false, visitors: false },
    })
    for (const type of ["lost-found", "memo"] as const) {
      const antes = await count(env.ids.resident)
      await notify(deps, TAQUARETINGA_ID, {
        type,
        audience: { personIds: [env.ids.resident] },
        title: `Só app ${type}`,
        body: "x",
        target: null,
        toGroup: true,
      })
      expect(await count(env.ids.resident)).toBe(antes + 1)
      expect(await privados(`Só app ${type}`)).toHaveLength(0)
    }
  })
})

describe("notify — segurança (spec 005, research R3)", () => {
  const desligar = async (ctx: typeof env.resident) =>
    env.services.notifications.setPrefs(ctx, {
      app: { notices: false, meetings: false, polls: false, deliveries: false, visitors: false },
      whatsapp: { deliveries: false, visitors: false },
    })

  for (const type of ["general-alert", "general-alert-closed"] as const) {
    it(`${type} chega a todos no app, no privado e uma vez no grupo, mesmo com preferências desligadas (CS-003)`, async () => {
      await desligar(env.resident)
      await desligar(env.family)
      const antes = {
        resident: await count(env.ids.resident),
        family: await count(env.ids.family),
        frontDesk: await count(env.ids.frontDesk),
        manager: await count(env.ids.manager),
      }
      const grupoAntes = (await outbox(env.services, "group")).length
      await notify(deps, TAQUARETINGA_ID, {
        type,
        audience: "everyone",
        title: "Princípio de incêndio",
        body: "Desçam pela escada",
        target: null,
        toGroup: true,
        groupText: "🚨 Princípio de incêndio",
      })
      expect(await count(env.ids.resident)).toBe(antes.resident + 1)
      expect(await count(env.ids.family)).toBe(antes.family + 1)
      expect(await count(env.ids.frontDesk)).toBe(antes.frontDesk + 1)
      expect(await count(env.ids.manager)).toBe(antes.manager + 1)
      const grupo = (await outbox(env.services, "group")).slice(grupoAntes)
      expect(grupo).toHaveLength(1)
      expect(grupo[0].body).toBe("🚨 Princípio de incêndio")
      const privados = (await outbox(env.services, "private")).filter((m) =>
        m.body.includes("Princípio de incêndio"),
      )
      // Todas as pessoas ativas (moradores, 3 porteiros e a síndica, que também mora no prédio), uma vez cada.
      const telefones = new Set(privados.map((m) => m.toPhone))
      expect(telefones.size).toBe(privados.length)
      expect(privados.length).toBeGreaterThan(90)
    })
  }

  it("emergency-update ignora preferências e vai ao app e ao privado, nunca ao grupo", async () => {
    await desligar(env.resident)
    const antes = await count(env.ids.resident)
    const grupoAntes = (await outbox(env.services, "group")).length
    await notify(deps, TAQUARETINGA_ID, {
      type: "emergency-update",
      audience: { personIds: [env.ids.resident] },
      title: "Jonas está a caminho",
      body: "A portaria viu o alerta",
      target: null,
      toGroup: true,
    })
    expect(await count(env.ids.resident)).toBe(antes + 1)
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes)
    const privado = (await outbox(env.services, "private")).filter((m) =>
      m.body.includes("Jonas está a caminho"),
    )
    expect(privado).toHaveLength(1)
  })
})
