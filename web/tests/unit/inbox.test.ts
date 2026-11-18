import { beforeEach, describe, expect, it } from "vitest"
import { PHONE, setup } from "./auth-helpers"
import { commSetup, outbox, repoOf } from "./comm-helpers"

// RF-002 e constituição V: código de entrega por mensagem ao WhatsApp do condomínio (simulado agora).
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})

describe("mensagens recebidas no WhatsApp", () => {
  it("cadastra o código para o apartamento de quem mandou e responde no privado", async () => {
    const r = await env.services.whatsappInbox!.receive(PHONE.family, "Mercado Livre MLB-99")
    expect(r.result).toBe("registered")
    const { awaiting } = await env.services.deliveries.mine(env.resident)
    const d = awaiting.find((x) => x.code === "MLB-99")!
    expect(d).toMatchObject({
      origin: "whatsapp",
      store: "mercado-livre",
      onArrival: "front-desk",
      apartment: "804",
    })
    const [resposta] = (await outbox(env.services, "private")).filter(
      (m) => m.toPhone === PHONE.family,
    )
    expect(resposta.body).toContain("MLB-99")
    expect(resposta.body).toContain("804")
    expect((await env.services.whatsappInbox!.list())[0]).toMatchObject({ result: "registered" })
  })

  it("celular desconhecido não cadastra nada", async () => {
    const r = await env.services.whatsappInbox!.receive("+5500999999999", "iFood 4821")
    expect(r.result).toBe("unknown-phone")
    const repo = await repoOf(env)
    expect(
      (await repo.all("deliveries")).some((d) => d.code === "4821" && d.origin === "whatsapp"),
    ).toBe(false)
  })

  it("quem não pode cadastrar entregas recebe a explicação", async () => {
    const repo = await repoOf(env)
    const [r] = await repo.byIndex("residencies", "byPerson", env.ids.family)
    await repo.put("residencies", { ...r, canRegisterDeliveries: false })
    const res = await env.services.whatsappInbox!.receive(PHONE.family, "iFood 4821")
    expect(res.result).toBe("no-permission")
    expect(res.reply).toContain("responsável")
  })

  it("mensagem sem código recebe o exemplo de como mandar", async () => {
    const res = await env.services.whatsappInbox!.receive(PHONE.responsible, "oi, tudo bem?")
    expect(res.result).toBe("not-understood")
    expect(res.reply).toContain("iFood 4821")
  })

  it("não existe na versão real", () => {
    expect(setup("real").services.whatsappInbox).toBeUndefined()
  })
})

describe("pedido de ajuda pelo WhatsApp (spec 005, RF-007a, CS-006a)", () => {
  for (const texto of ["SOS", "sos", "Socorro!", "SOCORRO", "socorro, caí no banheiro", "Sós"]) {
    it(`"${texto}" cria o alerta e responde no privado`, async () => {
      const r = await env.services.whatsappInbox!.receive(PHONE.family, texto)
      expect(r.result).toBe("sos")
      expect(r.reply).toContain("portaria foi avisada")
      expect(r.reply).toContain("192")
      const [alerta] = await env.services.emergency.open(env.frontDesk)
      expect(alerta).toMatchObject({ apartment: "804", kind: "unknown", origin: "whatsapp" })
      const resposta = (await outbox(env.services, "private")).filter(
        (m) => m.toPhone === PHONE.family && m.body.includes("pedido de ajuda"),
      )
      expect(resposta).toHaveLength(1)
    })
  }

  for (const texto of ["sossego", "socorrista chegou", "iFood 4821", "SOSA 12"]) {
    it(`"${texto}" não cria alerta`, async () => {
      await env.services.whatsappInbox!.receive(PHONE.family, texto)
      expect(await env.services.emergency.open(env.frontDesk)).toHaveLength(0)
    })
  }

  it("quem não pode cadastrar entregas também pede ajuda", async () => {
    const repo = await repoOf(env)
    const [res] = await repo.byIndex("residencies", "byPerson", env.ids.family)
    await repo.put("residencies", { ...res, canRegisterDeliveries: false })
    expect((await env.services.whatsappInbox!.receive(PHONE.family, "socorro")).result).toBe("sos")
  })

  it("celular desconhecido não cria alerta; segundo pedido avisa que já está com a portaria", async () => {
    expect((await env.services.whatsappInbox!.receive("+5500999999999", "SOS")).result).toBe(
      "unknown-phone",
    )
    expect(await env.services.emergency.open(env.frontDesk)).toHaveLength(0)
    await env.services.whatsappInbox!.receive(PHONE.family, "SOS")
    const segundo = await env.services.whatsappInbox!.receive(PHONE.responsible, "socorro")
    expect(segundo.reply).toContain("já está com a portaria")
    expect(await env.services.emergency.open(env.frontDesk)).toHaveLength(1)
  })

  it("códigos de entrega continuam funcionando", async () => {
    expect((await env.services.whatsappInbox!.receive(PHONE.family, "Shopee BR123")).result).toBe(
      "registered",
    )
  })
})
