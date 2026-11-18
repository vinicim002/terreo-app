import { beforeEach, describe, expect, it } from "vitest"
import { PHONE } from "./auth-helpers"
import { code, commSetup, outbox, repoOf } from "./comm-helpers"

// Spec 005, História 1 e 4: botão de emergência (RF-001 a RF-009, RF-018).
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  // 2026-11-16 (segunda) 09:00 em Brasília: Jonas (a conta da portaria) está de plantão.
  env = await commSetup()
})

const notifs = async (personId: string) => {
  const repo = await repoOf(env)
  return (await repo.byIndex("notifications", "byPerson", personId)).filter((n) =>
    n.type.startsWith("emergency"),
  )
}
const PHONE_RITA = "+5500900009902" // contato de emergência do 804 nos dados de exemplo

describe("pedir ajuda", () => {
  it("cria o alerta com apartamento, autor, hora e tipo", async () => {
    const v = await env.services.emergency.raise(env.family, "health")
    expect(v).toMatchObject({
      apartment: "804",
      floor: 8,
      kind: "health",
      origin: "app",
      status: "open",
      acknowledgedBy: null,
      canCancel: true,
      emergencyContact: null, // morador não vê o contato pelo alerta
    })
    expect(v.createdAt).toBe(env.clock.now.toISOString())
  })

  it("um em aberto por apartamento: o segundo pedido devolve o mesmo (RF-008)", async () => {
    const a = await env.services.emergency.raise(env.family, "health")
    const b = await env.services.emergency.raise(env.resident, "fire")
    expect(b.id).toBe(a.id)
    expect(b.kind).toBe("health")
  })

  it("avisa portaria, síndico e a casa, e manda WhatsApp ao contato de emergência (RF-003, RF-003a)", async () => {
    await env.services.emergency.raise(env.family, "health")
    expect(await notifs(env.ids.frontDesk)).toHaveLength(1)
    expect(await notifs(env.ids.manager)).toHaveLength(1)
    expect(await notifs(env.ids.resident)).toHaveLength(1) // outra pessoa do apartamento
    expect(await notifs(env.ids.family)).toHaveLength(0) // quem pediu não recebe o próprio aviso
    const contato = (await outbox(env.services, "private")).filter((m) => m.toPhone === PHONE_RITA)
    expect(contato).toHaveLength(1)
    expect(contato[0].body).toContain("pediu ajuda no apartamento 804 do Edifício Taquaretinga")
    expect(contato[0].body).toContain("09:00")
    // Nada vai ao grupo.
    expect((await outbox(env.services, "group")).some((m) => m.body.includes("804"))).toBe(false)
  })

  it("apartamento sem contato de emergência não manda nada para fora do prédio", async () => {
    const repo = await repoOf(env)
    const [c] = await repo
      .all("emergencyContacts")
      .then((l) => l.filter((x) => x.phone === PHONE_RITA))
    await repo.remove("emergencyContacts", c.id)
    const antes = (await outbox(env.services, "private")).length
    await env.services.emergency.raise(env.family, "health")
    const depois = await outbox(env.services, "private")
    // Só os privados das pessoas avisadas; nenhum para número desconhecido.
    const pessoas = new Set((await repo.all("people")).map((p) => p.phone))
    expect(depois.slice(antes).every((m) => pessoas.has(m.toPhone!))).toBe(true)
    const [porteiro] = await env.services.emergency.open(env.frontDesk)
    expect(porteiro.emergencyContact).toBeNull()
  })

  it("a portaria vê o contato de emergência e a tela cheia só para quem está de plantão (RF-003, RF-004)", async () => {
    await env.services.emergency.raise(env.family, "health")
    const [v] = await env.services.emergency.open(env.frontDesk)
    expect(v.emergencyContact).toEqual({
      name: "Rita Moreira",
      relationship: "Irmã",
      phone: PHONE_RITA,
    })
    expect(v.fullScreenForMe).toBe(true)
    expect(v.noDoormanOnDuty).toBe(false)
    const [s] = await env.services.emergency.open(env.manager)
    expect(s.fullScreenForMe).toBe(false)
    expect(s.emergencyContact?.name).toBe("Rita Moreira")
  })

  it("porteiro fora do plantão não recebe a tela cheia; sem ninguém na escala, todos recebem", async () => {
    await env.services.emergency.raise(env.family, "health")
    // Segunda 15:00 em Brasília: Caio está de plantão, Jonas não.
    env.clock.now = new Date("2026-11-16T18:00:00Z")
    let [v] = await env.services.emergency.open(env.frontDesk)
    expect(v.fullScreenForMe).toBe(false)
    // Sem turnos na escala: todos os porteiros recebem a tela cheia e o morador vê o aviso.
    const repo = await repoOf(env)
    for (const s of await repo.all("shifts")) await repo.remove("shifts", s.id)
    ;[v] = await env.services.emergency.open(env.frontDesk)
    expect(v.fullScreenForMe).toBe(true)
    expect(v.noDoormanOnDuty).toBe(true)
    const { current } = await env.services.emergency.mine(env.family)
    expect(current?.noDoormanOnDuty).toBe(true)
  })

  it("só pessoas de apartamento pedem ajuda", async () => {
    expect(await code(env.services.emergency.raise(env.frontDesk, "health"))).toBe("forbidden")
    expect(await code(env.services.emergency.raise(env.manager, "health"))).toBe("forbidden")
    expect(
      await code(
        env.services.emergency.raise({ condominiumId: env.resident.condominiumId }, "health"),
      ),
    ).toBe("forbidden")
  })
})

describe("atender e resolver", () => {
  it('o primeiro "Estou indo" vale e o morador vê quem está a caminho (RF-005)', async () => {
    const a = await env.services.emergency.raise(env.family, "health")
    const v = await env.services.emergency.acknowledge(env.frontDesk, a.id)
    expect(v.status).toBe("acknowledged")
    expect(v.acknowledgedBy).toBe("Jonas Siqueira")
    const { current } = await env.services.emergency.mine(env.family)
    expect(current).toMatchObject({ status: "acknowledged", acknowledgedBy: "Jonas Siqueira" })
    const aviso = (await notifs(env.ids.family)).find((n) => n.type === "emergency-update")!
    expect(aviso.title).toBe("Jonas Siqueira está a caminho")
    // Um segundo toque não muda quem foi.
    const de_novo = await env.services.emergency.acknowledge(env.frontDesk, a.id)
    expect(de_novo.acknowledgedAt).toBe(v.acknowledgedAt)
  })

  it("resolve com nota até 300 e avisa a casa, o síndico e o contato", async () => {
    const a = await env.services.emergency.raise(env.family, "health")
    await env.services.emergency.acknowledge(env.frontDesk, a.id)
    expect(await code(env.services.emergency.resolve(env.frontDesk, a.id, "x".repeat(301)))).toBe(
      "validation",
    )
    const v = await env.services.emergency.resolve(
      env.frontDesk,
      a.id,
      "Pressão baixa, SAMU chamado",
    )
    expect(v).toMatchObject({ status: "resolved", resolutionNote: "Pressão baixa, SAMU chamado" })
    expect((await notifs(env.ids.manager)).some((n) => n.title.includes("resolvido"))).toBe(true)
    const contato = (await outbox(env.services, "private")).filter((m) => m.toPhone === PHONE_RITA)
    expect(contato.at(-1)?.body).toContain("atendeu o pedido de ajuda")
    expect(await env.services.emergency.open(env.frontDesk)).toHaveLength(0)
    expect(await code(env.services.emergency.resolve(env.frontDesk, a.id, null))).toBe("conflict")
  })

  it("só a portaria atende e resolve", async () => {
    const a = await env.services.emergency.raise(env.family, "health")
    expect(await code(env.services.emergency.acknowledge(env.manager, a.id))).toBe("forbidden")
    expect(await code(env.services.emergency.resolve(env.resident, a.id, null))).toBe("forbidden")
    expect(await code(env.services.emergency.open(env.resident))).toBe("forbidden")
  })
})

describe("cancelar", () => {
  it("quem pediu cancela; a portaria e o contato são avisados (RF-006)", async () => {
    const a = await env.services.emergency.raise(env.family, "health")
    const v = await env.services.emergency.cancel(env.family, a.id)
    expect(v).toMatchObject({
      status: "cancelled",
      cancelledBy: expect.any(String),
      canCancel: false,
    })
    const avisoPortaria = (await notifs(env.ids.frontDesk)).find(
      (n) => n.type === "emergency-update",
    )
    expect(avisoPortaria?.body).toBe("Cancelado pelo morador.")
    const contato = (await outbox(env.services, "private")).filter((m) => m.toPhone === PHONE_RITA)
    expect(contato.at(-1)?.body).toContain("cancelou o pedido de ajuda")
    expect(await env.services.emergency.open(env.frontDesk)).toHaveLength(0)
    expect(await code(env.services.emergency.cancel(env.family, a.id))).toBe("conflict")
  })

  it("o responsável cancela o de outra pessoa da casa; outro morador não cancela o do responsável", async () => {
    const a = await env.services.emergency.raise(env.family, "health")
    expect((await env.services.emergency.cancel(env.resident, a.id)).status).toBe("cancelled")
    const b = await env.services.emergency.raise(env.resident, "fire")
    expect(b.id).not.toBe(a.id)
    const visto = await env.services.emergency.mine(env.family)
    expect(visto.current?.canCancel).toBe(false)
    expect(await code(env.services.emergency.cancel(env.family, b.id))).toBe("forbidden")
    expect(await code(env.services.emergency.cancel(env.frontDesk, b.id))).toBe("forbidden")
  })
})

describe("histórico (História 4)", () => {
  it("90 dias, do mais novo para o mais antigo; o morador só vê o próprio apartamento", async () => {
    const a = await env.services.emergency.raise(env.family, "health")
    await env.services.emergency.acknowledge(env.frontDesk, a.id)
    env.advance(60_000)
    await env.services.emergency.resolve(env.frontDesk, a.id, null)
    const historia = await env.services.emergency.history(env.manager)
    expect(historia[0]).toMatchObject({ id: a.id, status: "resolved" })
    // O alerta de exemplo do 501 (há 3 dias) também aparece.
    expect(historia.some((h) => h.apartment === "501")).toBe(true)
    for (let i = 1; i < historia.length; i++)
      expect(historia[i - 1].createdAt >= historia[i].createdAt).toBe(true)
    const mine = await env.services.emergency.mine(env.resident)
    expect(mine.current).toBeNull()
    expect(mine.history.map((h) => h.apartment)).toEqual(["804"])
    // Depois de 90 dias some.
    env.advance(91 * 86_400_000)
    expect((await env.services.emergency.history(env.manager)).length).toBe(0)
    expect(await code(env.services.emergency.history(env.resident))).toBe("forbidden")
  })
})

describe("pedir ajuda pelo WhatsApp (RF-007a)", () => {
  it("SOS do celular cadastrado cria o alerta", async () => {
    const r = await env.services.whatsappInbox!.receive(PHONE.family, "SOS")
    expect(r.result).toBe("sos")
    const [v] = await env.services.emergency.open(env.frontDesk)
    expect(v).toMatchObject({ apartment: "804", kind: "unknown", origin: "whatsapp" })
  })
})
