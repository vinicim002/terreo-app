import { beforeEach, describe, expect, it } from "vitest"
import { commSetup, noticeInput, outbox } from "./comm-helpers"
import { PHONE, signIn } from "./auth-helpers"
import { ServiceError } from "@/services/contracts"
import { TAQUARETINGA_ID } from "@/services/local/seed"

// Histórias 1 e 2: avisos (RF-001 a RF-009, CS-004, CS-005).
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

describe("avisos — História 1", () => {
  it("o síndico publica na hora, no topo da lista de todos, com versão 1", async () => {
    const aviso = await env.services.notices.create(env.manager, noticeInput())
    expect(aviso.status).toBe("published")
    expect(aviso.publishedAt).toBe(env.clock.now.toISOString())
    for (const ctx of [env.resident, env.family, env.frontDesk]) {
      const { items } = await env.services.notices.list(ctx, "all")
      expect(items[0].id).toBe(aviso.id)
      expect(items[0].author.name).toBe("Helena Duarte")
    }
  })

  it("só o síndico publica (RF-001)", async () => {
    for (const ctx of [env.resident, env.family, env.frontDesk])
      expect(await code(env.services.notices.create(ctx, noticeInput()))).toBe("forbidden")
    expect(
      await code(env.services.notices.create({ condominiumId: TAQUARETINGA_ID }, noticeInput())),
    ).toBe("forbidden")
  })

  it("valida o título e o texto (RF-002)", async () => {
    const e = await env.services.notices
      .create(env.manager, noticeInput({ title: "Oi" }))
      .catch((x) => x)
    expect(e).toBeInstanceOf(ServiceError)
    expect(e.code).toBe("validation")
    expect(e.details).toEqual({ title: "invalid" })
    expect(await code(env.services.notices.create(env.manager, noticeInput({ body: "" })))).toBe(
      "validation",
    )
    expect(
      await code(env.services.notices.create(env.manager, noticeInput({ body: "x".repeat(2001) }))),
    ).toBe("validation")
  })

  it("lista não lidos, marca como lido ao abrir e conta (RF-005, RF-006)", async () => {
    const aviso = await env.services.notices.create(env.manager, noticeInput())
    const antes = await env.services.notices.list(env.resident, "unread")
    expect(antes.items.some((n) => n.id === aviso.id)).toBe(true)
    expect(antes.unread).toBe(antes.items.length)
    const aberto = await env.services.notices.get(env.resident, aviso.id)
    expect(aberto.me.read).toBe(true)
    const depois = await env.services.notices.list(env.resident, "unread")
    expect(depois.items.some((n) => n.id === aviso.id)).toBe(false)
    expect(depois.unread).toBe(antes.unread - 1)
    // Outra pessoa do mesmo apartamento continua com o aviso não lido.
    expect((await env.services.notices.list(env.family, "unread")).items[0].id).toBe(aviso.id)
  })

  it("manda uma mensagem ao grupo com título e texto, e nada no privado (RF-004)", async () => {
    const privadoAntes = (await outbox(env.services, "private")).length
    await env.services.notices.create(env.manager, noticeInput({ title: "Elevador parado amanhã" }))
    const [msg] = await outbox(env.services, "group")
    expect(msg.toPhone).toBeNull()
    expect(msg.body).toContain("Elevador parado amanhã")
    expect(msg.body).toContain("Reparo na rede da rua.")
    expect((await outbox(env.services, "private")).length).toBe(privadoAntes)
    const semGrupo = (await outbox(env.services, "group")).length
    await env.services.notices.create(env.manager, noticeInput({ sendToGroup: false }))
    expect((await outbox(env.services, "group")).length).toBe(semGrupo)
  })

  it("notifica cada morador e cada porteiro (RF-004)", async () => {
    const aviso = await env.services.notices.create(env.manager, noticeInput())
    for (const ctx of [env.resident, env.family, env.frontDesk]) {
      const notifs = await env.services.notifications.list(ctx)
      expect(notifs.some((n) => n.type === "notice" && n.target?.id === aviso.id)).toBe(true)
    }
  })

  it("aviso apagado some; aviso de outro condomínio não existe", async () => {
    const aviso = await env.services.notices.create(env.manager, noticeInput())
    await env.services.notices.remove(env.manager, aviso.id)
    expect(
      (await env.services.notices.list(env.resident, "all")).items.some((n) => n.id === aviso.id),
    ).toBe(false)
    expect(await code(env.services.notices.get(env.resident, aviso.id))).toBe("not_found")
    expect(await code(env.services.notices.remove(env.resident, aviso.id))).toBe("forbidden")
    const outro = { ...env.resident, condominiumId: "00000000-0000-4000-8000-0000000000ff" }
    expect(await code(env.services.notices.list(outro, "all"))).toBe("forbidden")
  })
})

describe("avisos — História 2", () => {
  it("confirma a leitura; a portaria não confirma (RF-006)", async () => {
    const aviso = await env.services.notices.create(
      env.manager,
      noticeInput({ requireConfirmation: true }),
    )
    const lido = await env.services.notices.get(env.resident, aviso.id)
    expect(lido.me).toEqual({ read: true, confirmed: false })
    const confirmado = await env.services.notices.confirm(env.resident, aviso.id)
    expect(confirmado.me).toEqual({ read: true, confirmed: true })
    expect(await code(env.services.notices.confirm(env.frontDesk, aviso.id))).toBe("forbidden")
    const semConfirmacao = await env.services.notices.create(env.manager, noticeInput())
    expect(await code(env.services.notices.confirm(env.resident, semConfirmacao.id))).toBe(
      "validation",
    )
  })

  it('conta "Lido por N de M apartamentos" (RF-007, CS-005)', async () => {
    const aviso = await env.services.notices.create(
      env.manager,
      noticeInput({ requireConfirmation: true }),
    )
    let stats = await env.services.notices.stats(env.manager, aviso.id)
    // 48 apartamentos − 3 sem cadastro − 902 com convite pendente = 44.
    expect(stats.totalApartments).toBe(44)
    expect(stats.readApartments).toBe(0)
    expect(stats.pendingApartments).toHaveLength(44)
    await env.services.notices.get(env.resident, aviso.id)
    await env.services.notices.get(env.family, aviso.id) // mesmo apartamento: conta 1
    await env.services.notices.get(env.frontDesk, aviso.id) // portaria não é apartamento
    await env.services.notices.confirm(env.family, aviso.id)
    stats = await env.services.notices.stats(env.manager, aviso.id)
    expect(stats.readApartments).toBe(1)
    expect(stats.confirmations).toHaveLength(1)
    expect(stats.confirmations[0].apartment).toBe("804")
    expect(stats.pendingApartments).not.toContain("804")
    expect(stats.pendingApartments).toHaveLength(43)
    expect(await code(env.services.notices.stats(env.resident, aviso.id))).toBe("forbidden")
  })

  it("agendado aparece só para o síndico, em Agendados (RF-003)", async () => {
    const em = new Date(env.clock.now.getTime() + 86_400_000).toISOString()
    const aviso = await env.services.notices.create(env.manager, noticeInput({ publishAt: em }))
    expect(aviso.status).toBe("scheduled")
    const agendados = await env.services.notices.list(env.manager, "scheduled")
    expect(agendados.items.map((n) => n.id)).toContain(aviso.id)
    expect(
      (await env.services.notices.list(env.manager, "all")).items.some((n) => n.id === aviso.id),
    ).toBe(false)
    expect(await code(env.services.notices.list(env.resident, "scheduled"))).toBe("forbidden")
    expect(await code(env.services.notices.get(env.resident, aviso.id))).toBe("not_found")
  })

  it("recusa horário no passado e lembrete sem data", async () => {
    const passado = new Date(env.clock.now.getTime() - 60_000).toISOString()
    const e = await env.services.notices
      .create(env.manager, noticeInput({ publishAt: passado }))
      .catch((x) => x)
    expect(e.details).toEqual({ publishAt: "past" })
    const e2 = await env.services.notices
      .create(env.manager, noticeInput({ remindDayBefore: true }))
      .catch((x) => x)
    expect(e2.details).toEqual({ referenceDate: "required" })
  })

  it("editar um agendado só troca, sem avisar ninguém (H2-4)", async () => {
    const em = new Date(env.clock.now.getTime() + 86_400_000).toISOString()
    const aviso = await env.services.notices.create(env.manager, noticeInput({ publishAt: em }))
    const antes = (await env.services.notifications.list(env.resident)).length
    const editado = await env.services.notices.update(
      env.manager,
      aviso.id,
      noticeInput({ publishAt: em, title: "Título corrigido" }),
    )
    expect(editado.title).toBe("Título corrigido")
    expect(editado.editedAt).toBeNull()
    expect((await env.services.notifications.list(env.resident)).length).toBe(antes)
  })

  it("editar um publicado volta a não lido, zera confirmações e avisa (RF-007a)", async () => {
    const aviso = await env.services.notices.create(
      env.manager,
      noticeInput({ requireConfirmation: true }),
    )
    await env.services.notices.get(env.resident, aviso.id)
    await env.services.notices.confirm(env.resident, aviso.id)
    env.advance(60_000)
    const grupoAntes = (await outbox(env.services, "group")).length
    const editado = await env.services.notices.update(
      env.manager,
      aviso.id,
      noticeInput({ requireConfirmation: true, body: "Agora das 9h às 15h." }),
    )
    expect(editado.editedAt).toBe(env.clock.now.toISOString())
    const doMorador = (await env.services.notices.list(env.resident, "unread")).items.find(
      (n) => n.id === aviso.id,
    )
    expect(doMorador?.me).toEqual({ read: false, confirmed: false })
    const stats = await env.services.notices.stats(env.manager, aviso.id)
    expect(stats.confirmations).toHaveLength(0)
    const notifs = await env.services.notifications.list(env.resident)
    expect(notifs[0].type).toBe("notice-updated")
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes + 1)
  })

  it("resolver registra a nota, avisa moradores e portaria e vai ao grupo (RF-008)", async () => {
    const aviso = await env.services.notices.create(env.manager, noticeInput())
    env.advance(60_000)
    const grupoAntes = (await outbox(env.services, "group")).length
    const resolvido = await env.services.notices.resolve(
      env.manager,
      aviso.id,
      "A água voltou às 13h",
    )
    expect(resolvido.status).toBe("resolved")
    expect(resolvido.resolutionNote).toBe("A água voltou às 13h")
    for (const ctx of [env.resident, env.frontDesk]) {
      const [ultima] = await env.services.notifications.list(ctx)
      expect(ultima.type).toBe("notice-resolved")
      expect(ultima.body).toBe("A água voltou às 13h")
    }
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes + 1)
    const semGrupo = await env.services.notices.create(
      env.manager,
      noticeInput({ sendToGroup: false }),
    )
    await env.services.notices.resolve(env.manager, semGrupo.id, null)
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes + 1)
    expect(await code(env.services.notices.resolve(env.manager, aviso.id, "x".repeat(501)))).toBe(
      "validation",
    )
  })

  it("quem entra depois vê o aviso como não lido", async () => {
    const aviso = await env.services.notices.create(env.manager, noticeInput())
    env.advance(61_000) // intervalo mínimo entre pedidos de código (spec 002)
    const outro = await signIn(env.services, PHONE.responsible, "aparelho-novo")
    const { items } = await env.services.notices.list(outro.ctx, "unread")
    expect(items.some((n) => n.id === aviso.id)).toBe(true)
  })
})
