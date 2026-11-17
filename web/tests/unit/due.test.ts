import { beforeEach, describe, expect, it } from "vitest"
import { commSetup, noticeInput, outbox } from "./comm-helpers"
import { brasiliaToIso, dayKeyBrasilia } from "@/i18n/datetime"

// research R1: tarefas com horário aplicadas ao abrir, idempotentes (CS-007). Relógio: 16/11/2026 09:00 (Brasília).
const H = 3_600_000
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})

const titles = async (ctx: typeof env.resident) =>
  (await env.services.notices.list(ctx, "all")).items.map((n) => n.title)

describe("runDue", () => {
  it("publica o aviso agendado só depois do horário, uma vez só", async () => {
    const em = new Date(env.clock.now.getTime() + 2 * H).toISOString()
    await env.services.notices.create(
      env.manager,
      noticeInput({ title: "Aviso agendado", publishAt: em }),
    )
    expect(await titles(env.resident)).not.toContain("Aviso agendado")
    const grupoAntes = (await outbox(env.services, "group")).length
    env.advance(2 * H + 1000)
    expect(await titles(env.resident)).toContain("Aviso agendado")
    // Rodar de novo (outras leituras) não duplica nada.
    await env.services.notices.list(env.resident, "all")
    await env.services.notifications.list(env.family)
    await Promise.all([
      env.services.notices.list(env.family, "all"),
      env.services.polls.list(env.resident),
    ])
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes + 1)
    const notifs = (await env.services.notifications.list(env.resident)).filter(
      (n) => n.title === "Aviso agendado",
    )
    expect(notifs).toHaveLength(1)
    // Fica com a hora marcada como data de publicação.
    const [aviso] = (await env.services.notices.list(env.resident, "all")).items
    expect(aviso.publishedAt).toBe(em)
  })

  it("manda o lembrete na véspera, uma vez, e vai ao grupo só se o aviso foi", async () => {
    const quinta = dayKeyBrasilia(new Date(env.clock.now.getTime() + 3 * 24 * H)) // 19/11
    await env.services.notices.create(
      env.manager,
      noticeInput({ title: "Com grupo", referenceDate: quinta, remindDayBefore: true }),
    )
    await env.services.notices.create(
      env.manager,
      noticeInput({
        title: "Sem grupo",
        referenceDate: quinta,
        remindDayBefore: true,
        sendToGroup: false,
      }),
    )
    const lembretes = async () =>
      (await env.services.notifications.list(env.resident)).filter(
        (n) => n.type === "notice-reminder",
      )
    expect(await lembretes()).toHaveLength(0)
    env.clock.now = new Date(brasiliaToIso("2026-11-18", "00:30"))
    const grupoAntes = (await outbox(env.services, "group")).length
    expect(await lembretes()).toHaveLength(2)
    await env.services.notices.list(env.resident, "all")
    expect(await lembretes()).toHaveLength(2)
    const grupo = (await outbox(env.services, "group")).slice(0, 5)
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes + 1)
    expect(grupo.some((m) => m.body.includes("Com grupo"))).toBe(true)
  })

  it("não manda o lembrete perdido depois que o dia chegou", async () => {
    const amanha = dayKeyBrasilia(new Date(env.clock.now.getTime() + 24 * H))
    // Agendado para depois da véspera: publica já no dia do assunto.
    await env.services.notices.create(
      env.manager,
      noticeInput({
        title: "Lembrete perdido",
        referenceDate: amanha,
        remindDayBefore: true,
        publishAt: brasiliaToIso(amanha, "10:00"),
      }),
    )
    env.clock.now = new Date(brasiliaToIso(amanha, "11:00"))
    const lembretes = (await env.services.notifications.list(env.resident)).filter(
      (n) => n.type === "notice-reminder" && n.title === "Lembrete perdido",
    )
    expect(lembretes).toHaveLength(0)
  })

  it("lembra a reunião na véspera", async () => {
    const reuniao = await env.services.meetings.create(env.manager, {
      startsAt: brasiliaToIso("2026-11-20", "19:00"),
      place: "Salão",
      agenda: ["Fachada"],
    })
    env.clock.now = new Date(brasiliaToIso("2026-11-19", "08:00"))
    const lembretes = (await env.services.notifications.list(env.resident)).filter(
      (n) => n.type === "meeting-reminder" && n.target?.id === reuniao.id,
    )
    expect(lembretes).toHaveLength(1)
  })

  it("encerra a enquete vencida, avisa o resultado e manda ao grupo", async () => {
    const enquete = await env.services.polls.create(env.manager, {
      question: "Pintar o hall de verde?",
      options: ["Sim", "Não"],
      closesAt: new Date(env.clock.now.getTime() + 24 * H).toISOString(),
      official: false,
      showPartial: true,
    })
    await env.services.polls.vote(env.resident, enquete.id, enquete.options[0].id)
    env.advance(24 * H + 1)
    const grupoAntes = (await outbox(env.services, "group")).length
    const lida = await env.services.polls.get(env.family, enquete.id)
    expect(lida.status).toBe("closed")
    expect(lida.winner).toEqual({ optionIds: [enquete.options[0].id], tie: false })
    const fim = (await env.services.notifications.list(env.resident)).filter(
      (n) => n.type === "poll-closed" && n.target?.id === enquete.id,
    )
    expect(fim).toHaveLength(1)
    expect(fim[0].body).toContain("Sim")
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes + 1)
  })
})
