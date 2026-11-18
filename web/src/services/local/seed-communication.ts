/**
 * Dados de exemplo da comunicação (spec 003, data-model.md; RF-030). TUDO É FICTÍCIO.
 * As datas são relativas a `now` (o dia em que os dados são criados), para os avisos, enquetes e reuniões
 * parecerem sempre recentes (research R8).
 */
import { brasiliaToIso, dayKeyBrasilia, fromDayKey, startOfDayBrasilia } from "@/i18n/datetime"
import type {
  AgendaEvent,
  Apartment,
  Meeting,
  Notice,
  NoticeRead,
  Notification,
  Person,
  Poll,
  PollSuggestion,
  PollVote,
  Residency,
} from "../schemas"

export interface CommunicationSeed {
  notices: Notice[]
  noticeReads: NoticeRead[]
  polls: Poll[]
  pollVotes: PollVote[]
  pollSuggestions: PollSuggestion[]
  meetings: Meeting[]
  agendaEvents: AgendaEvent[]
  notifications: Notification[]
}

interface Base {
  condominiumId: string
  apartments: Apartment[]
  people: Person[]
  residencies: Residency[]
  managerPersonId: string
  frontDeskPersonId: string
  id: (kind: number, n: number) => string
}

const DAY = 86_400_000

export function buildCommunicationSeed(base: Base, now: Date): CommunicationSeed {
  const { condominiumId, id } = base
  const today = startOfDayBrasilia(now).getTime()
  const day = (offset: number) => dayKeyBrasilia(new Date(today + offset * DAY + 12 * 3_600_000))
  const at = (offset: number, time: string) => brasiliaToIso(day(offset), time)
  /** Um instante já passado, `hours` antes de agora. */
  const ago = (hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString()

  const apt = (number: string) => base.apartments.find((a) => a.number === number)!
  const activeResidencies = base.residencies.filter(
    (r) => base.people.find((p) => p.id === r.personId)!.firstAccessAt,
  )
  const responsibles = activeResidencies.filter((r) => r.isResponsible)
  const r804 = activeResidencies.filter((r) => r.apartmentId === apt("804").id)
  const responsible804 = r804.find((r) => r.isResponsible)!
  const family804 = r804.find((r) => !r.isResponsible)!
  const author = base.managerPersonId

  // ---------- Avisos (Histórias 1 e 2) ----------
  const notice = (
    n: number,
    data: Partial<Notice> & Pick<Notice, "kind" | "title" | "body" | "publishAt">,
  ): Notice => ({
    id: id(12, n),
    condominiumId,
    authorId: author,
    customKind: null,
    important: false,
    sendToGroup: true,
    requireConfirmation: false,
    referenceDate: null,
    remindDayBefore: false,
    publishedAt: data.publishAt,
    editedAt: null,
    version: 1,
    resolvedAt: null,
    resolutionNote: null,
    reminderSentAt: null,
    deletedAt: null,
    ...data,
  })
  const waterPublished = ago(2)
  const notices: Notice[] = [
    notice(1, {
      kind: "general",
      title: "Coleta seletiva passa a ser às terças",
      body: "A partir desta semana, a coleta dos recicláveis passa a ser toda terça-feira de manhã. Deixe o material separado no contêiner azul do térreo até as 7h.",
      publishAt: at(-6, "09:00"),
    }),
    notice(2, {
      kind: "power",
      title: "Desligamento de energia para manutenção",
      body: "A concessionária vai desligar a energia do prédio das 9h às 12h para trocar o transformador da rua. O elevador ficará parado nesse horário.",
      publishAt: at(-2, "10:00"),
      referenceDate: day(3),
    }),
    notice(3, {
      kind: "water",
      title: "Falta d'água amanhã das 8h às 14h",
      body: "A Cedae vai fazer um reparo na rede e o fornecimento de água será interrompido amanhã, das 8h às 14h. Encham baldes e garrafas com antecedência e mantenham as torneiras fechadas.",
      important: true,
      requireConfirmation: true,
      referenceDate: day(1),
      remindDayBefore: true,
      publishAt: waterPublished,
      // O lembrete da véspera já saiu junto com a publicação.
      reminderSentAt: waterPublished,
    }),
    notice(4, {
      kind: "elevator",
      title: "Elevador social em manutenção",
      body: "O elevador social está parado para manutenção preventiva. Use o elevador de serviço até a liberação.",
      publishAt: at(-1, "07:30"),
      resolvedAt: at(-1, "16:00"),
      resolutionNote: "O elevador social voltou a funcionar às 16h.",
    }),
    notice(5, {
      kind: "general",
      title: "Dedetização das áreas comuns",
      body: "Haverá dedetização da garagem, do hall e das escadas. Mantenha animais de estimação dentro de casa durante o serviço.",
      publishAt: at(2, "09:00"),
      publishedAt: null,
      referenceDate: day(5),
      remindDayBefore: true,
    }),
  ]
  const [coleta, energia, agua, elevador] = notices

  const noticeReads: NoticeRead[] = []
  const read = (n: Notice, personId: string, hoursAfter: number, confirm = false) => {
    const readAt = new Date(new Date(n.publishedAt!).getTime() + hoursAfter * 3_600_000)
    const safe = new Date(Math.min(readAt.getTime(), now.getTime() - 60_000)).toISOString()
    noticeReads.push({
      id: id(13, noticeReads.length + 1),
      condominiumId,
      noticeId: n.id,
      personId,
      version: n.version,
      readAt: safe,
      confirmedAt: confirm ? safe : null,
    })
  }
  responsibles.slice(0, 20).forEach((r, i) => read(coleta, r.personId, 1 + i))
  read(coleta, responsible804.personId, 3)
  responsibles.slice(0, 10).forEach((r, i) => read(energia, r.personId, 1 + i))
  responsibles.slice(0, 6).forEach((r, i) => read(agua, r.personId, 0.1 * (i + 1), i < 4))
  responsibles.slice(0, 25).forEach((r, i) => read(elevador, r.personId, 0.5 + i * 0.2))
  read(elevador, responsible804.personId, 2)

  // ---------- Enquetes (História 3) ----------
  const option = (n: number, label: string) => ({ id: id(15, n), label })
  const polls: Poll[] = [
    {
      id: id(14, 1),
      condominiumId,
      authorId: author,
      question: "Qual cor para a nova pintura da fachada?",
      options: [option(1, "Cinza claro"), option(2, "Bege"), option(3, "Branco")],
      official: true,
      showPartial: true,
      createdAt: at(-3, "10:00"),
      closesAt: at(7, "22:00"),
      closedAt: null,
    },
    {
      id: id(14, 2),
      condominiumId,
      authorId: author,
      question: "Que horas o portão da garagem deve fechar à noite?",
      options: [option(4, "Às 22h"), option(5, "Às 23h"), option(6, "Fica aberto")],
      official: false,
      showPartial: true,
      createdAt: at(-20, "10:00"),
      closesAt: at(-10, "22:00"),
      closedAt: at(-10, "22:00"),
    },
    {
      id: id(14, 3),
      condominiumId,
      authorId: author,
      question: "Instalar um bicicletário na garagem?",
      options: [option(7, "Sim"), option(8, "Não")],
      official: true,
      showPartial: false,
      createdAt: at(-45, "10:00"),
      closesAt: at(-30, "22:00"),
      closedAt: at(-30, "22:00"),
    },
  ]
  const [fachada, portao, bicicletario] = polls
  const pollVotes: PollVote[] = []
  const vote = (poll: Poll, r: Residency, optionIndex: number) =>
    pollVotes.push({
      id: id(16, pollVotes.length + 1),
      condominiumId,
      pollId: poll.id,
      optionId: poll.options[optionIndex].id,
      personId: r.personId,
      apartmentId: poll.official ? r.apartmentId : null,
      votedAt: new Date(
        new Date(poll.createdAt).getTime() + (pollVotes.length + 1) * 3_600_000,
      ).toISOString(),
    })
  const others = responsibles.filter((r) => r.apartmentId !== apt("804").id)
  // Fachada: 12 apartamentos votaram (o 804 ainda não).
  others.slice(0, 12).forEach((r, i) => vote(fachada, r, [1, 0, 1, 2, 1, 0][i % 6]))
  // Portão (comum): votos de pessoas com permissão.
  others.slice(0, 18).forEach((r, i) => vote(portao, r, [1, 1, 0, 2][i % 4]))
  vote(portao, responsible804, 1)
  // Bicicletário: 30 apartamentos.
  others.slice(0, 30).forEach((r, i) => vote(bicicletario, r, i % 3 === 0 ? 1 : 0))
  vote(bicicletario, responsible804, 0)

  // ---------- Reuniões e agenda (História 4) ----------
  const meetings: Meeting[] = [
    {
      id: id(17, 1),
      condominiumId,
      authorId: author,
      startsAt: at(5, "19:30"),
      place: "Salão de festas",
      agenda: [
        "Pintura da fachada: orçamentos e cor escolhida",
        "Troca do motor do portão da garagem",
        "Previsão de gastos para 2027",
      ],
      summary: null,
      summaryAt: null,
      reminderSentAt: null,
      cancelledAt: null,
    },
    {
      id: id(17, 2),
      condominiumId,
      authorId: author,
      startsAt: at(-20, "19:30"),
      place: "Salão de festas",
      agenda: ["Horário do portão da garagem", "Limpeza da caixa d'água", "Câmeras do hall"],
      summary:
        "Presentes: 18 apartamentos.\n1. Portão da garagem: aberta enquete para escolher o horário de fechamento à noite.\n2. Caixa d'água: limpeza aprovada a cada 6 meses, com a próxima já agendada.\n3. Câmeras do hall: o síndico vai trazer três orçamentos na próxima reunião.",
      summaryAt: at(-19, "10:00"),
      reminderSentAt: at(-21, "09:00"),
      cancelledAt: null,
    },
  ]
  const [nextMeeting, lastMeeting] = meetings

  // Coleta seletiva: toda terça às 7h, a partir da terça mais recente.
  const weekday = new Date(fromDayKey(day(0)).getTime() - 3 * 3_600_000).getUTCDay()
  const lastTuesday = (weekday - 2 + 7) % 7
  const agendaEvents: AgendaEvent[] = [
    {
      id: id(18, 1),
      condominiumId,
      title: "Coleta seletiva",
      kind: "routine",
      startsAt: at(-lastTuesday, "07:00"),
      durationMinutes: null,
      recurrence: "weekly",
      cancelledAt: null,
    },
    {
      id: id(18, 2),
      condominiumId,
      title: "Limpeza da caixa d'água",
      kind: "maintenance",
      startsAt: at(12, "08:00"),
      durationMinutes: 240,
      recurrence: "semiannual",
      cancelledAt: null,
    },
    {
      id: id(18, 3),
      condominiumId,
      title: "Recarga dos extintores",
      kind: "maintenance",
      startsAt: at(40, "09:00"),
      durationMinutes: 120,
      recurrence: "yearly",
      cancelledAt: null,
    },
  ]

  // ---------- Notificações das contas de exemplo (História 5) ----------
  const notifications: Notification[] = []
  const add = (
    personId: string,
    data: Pick<Notification, "type" | "title" | "body" | "target" | "createdAt">,
    readAt: string | null,
  ) =>
    notifications.push({
      id: id(19, notifications.length + 1),
      condominiumId,
      personId,
      ...data,
      readAt,
    })
  const cut = (text: string) => (text.length > 200 ? `${text.slice(0, 199)}…` : text)
  const noticeNote = (n: Notice, type: Notification["type"], createdAt: string, body = n.body) => ({
    type,
    title: n.title,
    body: cut(body),
    target: { kind: "notice" as const, id: n.id },
    createdAt,
  })
  const residentsToNotify = [responsible804.personId, family804.personId, author]
  for (const personId of residentsToNotify) {
    const isResponsible804 = personId === responsible804.personId
    add(personId, noticeNote(agua, "notice", agua.publishedAt!), null)
    add(
      personId,
      {
        type: "meeting",
        title: "Reunião do conselho marcada",
        body: `${nextMeeting.place} · ${day(5).split("-").reverse().slice(0, 2).join("/")} às 19:30`,
        target: { kind: "meeting", id: nextMeeting.id },
        createdAt: at(-1, "20:00"),
      },
      null,
    )
    add(
      personId,
      noticeNote(elevador, "notice-resolved", elevador.resolvedAt!, elevador.resolutionNote!),
      isResponsible804 ? elevador.resolvedAt : null,
    )
    add(personId, noticeNote(energia, "notice", energia.publishedAt!), null)
    add(
      personId,
      {
        type: "poll",
        title: fachada.question,
        body: fachada.options.map((o) => o.label).join(" · "),
        target: { kind: "poll", id: fachada.id },
        createdAt: fachada.createdAt,
      },
      at(-3, "12:00"),
    )
    add(
      personId,
      {
        type: "meeting-summary",
        title: "Resumo da reunião do conselho disponível",
        body: cut(lastMeeting.summary!.replace(/\s+/g, " ")),
        target: { kind: "meeting", id: lastMeeting.id },
        createdAt: lastMeeting.summaryAt!,
      },
      at(-19, "12:00"),
    )
  }
  add(base.frontDeskPersonId, noticeNote(agua, "notice", agua.publishedAt!), null)
  add(
    base.frontDeskPersonId,
    noticeNote(elevador, "notice-resolved", elevador.resolvedAt!, elevador.resolutionNote!),
    elevador.resolvedAt,
  )
  add(base.frontDeskPersonId, noticeNote(energia, "notice", energia.publishedAt!), null)

  return {
    notices,
    noticeReads,
    polls,
    pollVotes,
    pollSuggestions: [],
    meetings,
    agendaEvents,
    notifications,
  }
}
