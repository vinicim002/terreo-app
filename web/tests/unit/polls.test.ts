import { beforeEach, describe, expect, it } from "vitest"
import { commSetup, outbox } from "./comm-helpers"
import { ServiceError, type PollInput } from "@/services/contracts"
import { createLocalRepository } from "@/services/local"

// História 3: enquetes (RF-010 a RF-016, esclarecimento 1, CS-004).
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

const input = (patch: Partial<PollInput> = {}): PollInput => ({
  question: "Qual horário para a festa junina?",
  options: ["Sábado à tarde", "Sábado à noite", "Domingo"],
  closesAt: new Date(env.clock.now.getTime() + 7 * 86_400_000).toISOString(),
  official: false,
  showPartial: true,
  ...patch,
})

describe("criação", () => {
  it("só o síndico cria; avisa os moradores e o grupo (RF-010)", async () => {
    const grupoAntes = (await outbox(env.services, "group")).length
    const enquete = await env.services.polls.create(env.manager, input())
    expect(enquete.status).toBe("open")
    expect(enquete.options).toHaveLength(3)
    const notif = (await env.services.notifications.list(env.resident))[0]
    expect(notif).toMatchObject({ type: "poll", target: { kind: "poll", id: enquete.id } })
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes + 1)
    // A portaria não recebe enquetes.
    expect(
      (await env.services.notifications.list(env.frontDesk)).some((n) => n.type === "poll"),
    ).toBe(false)
    for (const ctx of [env.resident, env.family, env.frontDesk])
      expect(await code(env.services.polls.create(ctx, input()))).toBe("forbidden")
  })

  it("exige de 2 a 6 opções sem repetir e encerramento futuro", async () => {
    const det = async (p: PollInput) =>
      (await env.services.polls.create(env.manager, p).catch((e) => e)).details
    expect(await det(input({ options: ["Só uma"] }))).toEqual({ options: "count" })
    expect(await det(input({ options: ["a", "b", "c", "d", "e", "f", "g"] }))).toEqual({
      options: "count",
    })
    expect(await det(input({ options: ["Sim", "sim"] }))).toEqual({ options: "repeated" })
    expect(
      await det(input({ closesAt: new Date(env.clock.now.getTime() - 1).toISOString() })),
    ).toEqual({ closesAt: "past" })
    expect(await det(input({ question: "Oi?" }))).toEqual({ question: "invalid" })
  })

  it("a portaria não vê enquetes (RF-016)", async () => {
    expect(await code(env.services.polls.list(env.frontDesk))).toBe("forbidden")
  })
})

describe("enquete comum", () => {
  it("cada pessoa com permissão vota; mudar substitui (RF-012, RF-013)", async () => {
    const e = await env.services.polls.create(env.manager, input())
    const [a, b] = e.options
    let v = await env.services.polls.vote(env.resident, e.id, a.id)
    expect(v.me.vote?.optionId).toBe(a.id)
    v = await env.services.polls.vote(env.family, e.id, b.id)
    expect(v.totalVotes).toBe(2)
    v = await env.services.polls.vote(env.resident, e.id, b.id)
    expect(v.totalVotes).toBe(2)
    expect(v.me.vote?.optionId).toBe(b.id)
    expect(v.options.find((o) => o.id === b.id)).toMatchObject({ votes: 2, percent: 100 })
  })

  it("quem não tem permissão só vê", async () => {
    const e = await env.services.polls.create(env.manager, input())
    // Tira a permissão do familiar.
    const repo = createLocalRepository(undefined, () => env.clock.now)
    const [r] = await repo.byIndex("residencies", "byPerson", env.ids.family)
    await repo.put("residencies", { ...r, canVotePolls: false })
    const vista = await env.services.polls.get(env.family, e.id)
    expect(vista.me.canVote).toBe(false)
    expect(await code(env.services.polls.vote(env.family, e.id, e.options[0].id))).toBe("forbidden")
    // O síndico, no papel de síndico, não vota.
    expect(await code(env.services.polls.vote(env.manager, e.id, e.options[0].id))).toBe(
      "forbidden",
    )
  })

  it("esconde o parcial do morador quando desligado; o síndico sempre vê (RF-014)", async () => {
    const e = await env.services.polls.create(env.manager, input({ showPartial: false }))
    const v = await env.services.polls.vote(env.resident, e.id, e.options[0].id)
    expect(v.totalVotes).toBeNull()
    expect(v.options.every((o) => o.percent === null)).toBe(true)
    expect((await env.services.polls.get(env.manager, e.id)).totalVotes).toBe(1)
    const fechada = await env.services.polls.close(env.manager, e.id)
    expect(fechada.totalVotes).toBe(1)
    expect((await env.services.polls.get(env.resident, e.id)).options[0].percent).toBe(100)
  })
})

describe("enquete oficial", () => {
  it("só o responsável vota, um voto por apartamento (RF-011)", async () => {
    const e = await env.services.polls.create(env.manager, input({ official: true }))
    const [a, b] = e.options
    expect(await code(env.services.polls.vote(env.family, e.id, a.id))).toBe("forbidden")
    let v = await env.services.polls.vote(env.resident, e.id, a.id)
    v = await env.services.polls.vote(env.resident, e.id, b.id)
    expect(v.totalVotes).toBe(1)
    expect(v.me.vote).toMatchObject({ optionId: b.id })
    // O familiar vê o voto do apartamento e quem votou.
    const doFamiliar = await env.services.polls.get(env.family, e.id)
    expect(doFamiliar.me.vote?.optionId).toBe(b.id)
    expect(doFamiliar.me.vote?.byName).toBeTruthy()
    expect(doFamiliar.me.canVote).toBe(false)
    expect(doFamiliar.me.canSuggest).toBe(true)
  })

  it("o familiar com permissão sugere; só o responsável vê; não conta (esclarecimento 1)", async () => {
    const e = await env.services.polls.create(env.manager, input({ official: true }))
    const [a, b] = e.options
    let s = await env.services.polls.suggest(env.family, e.id, a.id)
    expect(s.me.suggestion).toBe(a.id)
    s = await env.services.polls.suggest(env.family, e.id, b.id)
    expect(s.me.suggestion).toBe(b.id)
    expect(s.totalVotes).toBe(0)
    const doResponsavel = await env.services.polls.get(env.resident, e.id)
    expect(doResponsavel.me.householdSuggestions).toEqual([
      { personName: expect.any(String), optionId: b.id },
    ])
    expect((await env.services.polls.get(env.manager, e.id)).me.householdSuggestions).toEqual([])
    expect(await code(env.services.polls.suggest(env.resident, e.id, a.id))).toBe("forbidden")
    const comum = await env.services.polls.create(env.manager, input())
    expect(await code(env.services.polls.suggest(env.family, comum.id, comum.options[0].id))).toBe(
      "forbidden",
    )
  })

  it("apartamento sem responsável não vota; as sugestões ficam guardadas", async () => {
    const e = await env.services.polls.create(env.manager, input({ official: true }))
    await env.services.polls.suggest(env.family, e.id, e.options[0].id)
    const repo = createLocalRepository(undefined, () => env.clock.now)
    const [r] = await repo.byIndex("residencies", "byPerson", env.ids.resident)
    await repo.put("residencies", { ...r, isResponsible: false })
    expect(await code(env.services.polls.vote(env.resident, e.id, e.options[0].id))).toBe(
      "forbidden",
    )
    expect(await repo.byIndex("pollSuggestions", "byPoll", e.id)).toHaveLength(1)
  })

  it("a troca de responsável mantém o voto, e o novo pode mudar", async () => {
    const e = await env.services.polls.create(env.manager, input({ official: true }))
    const [a, b] = e.options
    await env.services.polls.vote(env.resident, e.id, a.id)
    const repo = createLocalRepository(undefined, () => env.clock.now)
    const [antigo] = await repo.byIndex("residencies", "byPerson", env.ids.resident)
    const [novo] = await repo.byIndex("residencies", "byPerson", env.ids.family)
    await repo.put("residencies", { ...antigo, isResponsible: false })
    await repo.put("residencies", { ...novo, isResponsible: true })
    const vista = await env.services.polls.get(env.family, e.id)
    expect(vista.me.vote?.optionId).toBe(a.id)
    const mudou = await env.services.polls.vote(env.family, e.id, b.id)
    expect(mudou.totalVotes).toBe(1)
    expect(mudou.me.vote?.optionId).toBe(b.id)
  })
})

describe("encerramento (RF-015)", () => {
  it("mostra a vencedora, recusa votos e marca empate", async () => {
    const e = await env.services.polls.create(env.manager, input())
    const [a, b] = e.options
    await env.services.polls.vote(env.resident, e.id, a.id)
    await env.services.polls.vote(env.family, e.id, b.id)
    const fechada = await env.services.polls.close(env.manager, e.id)
    expect(fechada.winner).toEqual({ optionIds: [a.id, b.id], tie: true })
    const err = await env.services.polls.vote(env.resident, e.id, a.id).catch((x) => x)
    expect(err.details).toEqual({ poll: "closed" })
    const { open, closed } = await env.services.polls.list(env.resident)
    expect(closed[0].id).toBe(e.id)
    expect(open.some((p) => p.id === e.id)).toBe(false)
    expect(await code(env.services.polls.close(env.resident, e.id))).toBe("forbidden")
  })
})
