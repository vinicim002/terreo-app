// Tarefas com horário sem servidor (research R1 da spec 003). `runDue` aplica, de forma idempotente, tudo o que já
// deveria ter acontecido até `deps.now()`: publicar avisos agendados, lembretes da véspera de avisos e reuniões e
// encerrar enquetes vencidas. Os serviços chamam `runDue` no início das leituras. Na Etapa 3, a mesma lógica vira
// tarefa agendada do ARQ no servidor.
import { formatShortDateTime, fromDayKey, startOfDayBrasilia } from "@/i18n/datetime"
import { nowIso, save, type ServiceDeps } from "./base"
import { notify } from "./notify"
import {
  activeTravel,
  daysBetween,
  deliveryRecipients,
  storeLabel,
  todayKey,
} from "./front-desk-shared"
import type { Meeting, Notice, Poll, PollVote } from "./schemas"
import { KIND_LABEL, doormen, managerIds } from "./security-shared"

const DAY = 86_400_000

// ---------- Efeitos compartilhados com os serviços ----------

const excerpt = (text: string) => text.replace(/\s+/g, " ").trim()

/** Avisa a publicação (ou atualização, resolução, lembrete) de um aviso. */
export async function announceNotice(
  deps: ServiceDeps,
  notice: Notice,
  type: "notice" | "notice-updated" | "notice-resolved" | "notice-reminder",
) {
  const prefix = {
    notice: "📢 Aviso do síndico",
    "notice-updated": "✏️ Aviso atualizado",
    "notice-resolved": "✅ Resolvido",
    "notice-reminder": "⏰ Lembrete para amanhã",
  }[type]
  const body =
    type === "notice-resolved"
      ? (notice.resolutionNote ?? "O síndico marcou este aviso como resolvido.")
      : excerpt(notice.body)
  await notify(deps, notice.condominiumId, {
    type,
    audience: "residents+staff",
    title: notice.title,
    body,
    target: { kind: "notice", id: notice.id },
    toGroup: notice.sendToGroup,
    groupText: `${prefix}: *${notice.title}*\n${body}`,
  })
}

export function meetingWhen(meeting: Meeting) {
  return `${formatShortDateTime(meeting.startsAt, "pt")} · ${meeting.place}`
}

export async function announceMeeting(
  deps: ServiceDeps,
  meeting: Meeting,
  type: "meeting" | "meeting-reminder" | "meeting-summary",
  headline: string,
) {
  const body = type === "meeting-summary" ? excerpt(meeting.summary ?? "") : meetingWhen(meeting)
  await notify(deps, meeting.condominiumId, {
    type,
    audience: "residents",
    title: headline,
    body,
    target: { kind: "meeting", id: meeting.id },
    toGroup: true,
    groupText: `🗓️ ${headline}\n${body}`,
  })
}

export interface Tally {
  counts: Map<string, number>
  total: number
  /** Vazio quando não há votos. */
  leaders: string[]
}

export function tallyPoll(poll: Poll, votes: PollVote[]): Tally {
  const counts = new Map(poll.options.map((o) => [o.id, 0]))
  for (const v of votes)
    if (counts.has(v.optionId)) counts.set(v.optionId, counts.get(v.optionId)! + 1)
  const total = [...counts.values()].reduce((a, b) => a + b, 0)
  const max = Math.max(...counts.values())
  const leaders = total === 0 ? [] : [...counts].filter(([, c]) => c === max).map(([id]) => id)
  return { counts, total, leaders }
}

export const percent = (count: number, total: number) =>
  total === 0 ? 0 : Math.round((count / total) * 100)

/** Fecha a enquete e avisa o resultado no app e no grupo (H3-8). */
export async function closePoll(deps: ServiceDeps, poll: Poll, closedAt: string) {
  const closed = await save(deps, "polls", { ...poll, closedAt })
  const votes = await deps.repo.byIndex("pollVotes", "byPoll", poll.id)
  const { counts, total, leaders } = tallyPoll(closed, votes)
  const label = (id: string) => closed.options.find((o) => o.id === id)!.label
  const result =
    total === 0
      ? "Enquete encerrada sem votos."
      : leaders.length > 1
        ? `Empate: ${leaders.map(label).join(", ")} (${total} votos)`
        : `Vencedora: ${label(leaders[0])} (${percent(counts.get(leaders[0])!, total)}% de ${total} votos)`
  await notify(deps, poll.condominiumId, {
    type: "poll-closed",
    audience: "residents",
    title: closed.question,
    body: result,
    target: { kind: "poll", id: poll.id },
    toGroup: true,
    groupText: `🗳️ Enquete encerrada: *${closed.question}*\n${result}`,
  })
  return closed
}

/** Publica um aviso (na hora ou pelo agendamento). */
export async function publishNotice(deps: ServiceDeps, notice: Notice, publishedAt: string) {
  const published = await save(deps, "notices", { ...notice, publishedAt })
  await announceNotice(deps, published, "notice")
  return published
}

// ---------- runDue ----------

/** Está na véspera do dia `dayStart` (de 00:00 da véspera até 00:00 do dia, em Brasília)? */
const inEve = (now: number, dayStart: number) => now >= dayStart - DAY && now < dayStart

async function runDueNow(deps: ServiceDeps, condominiumId: string) {
  const now = deps.now().getTime()

  const notices = await deps.repo.byIndex("notices", "byCondominium", condominiumId)
  for (const notice of notices.sort((a, b) => a.publishAt.localeCompare(b.publishAt))) {
    if (notice.deletedAt) continue
    let current = notice
    if (!current.publishedAt && new Date(current.publishAt).getTime() <= now) {
      current = await publishNotice(deps, current, current.publishAt)
    }
    if (
      current.publishedAt &&
      current.remindDayBefore &&
      current.referenceDate &&
      !current.reminderSentAt &&
      !current.resolvedAt &&
      inEve(now, fromDayKey(current.referenceDate).getTime())
    ) {
      current = await save(deps, "notices", { ...current, reminderSentAt: nowIso(deps) })
      await announceNotice(deps, current, "notice-reminder")
    }
  }

  const meetings = await deps.repo.byIndex("meetings", "byCondominium", condominiumId)
  for (const meeting of meetings) {
    if (meeting.cancelledAt || meeting.reminderSentAt) continue
    const startDay = startOfDayBrasilia(meeting.startsAt).getTime()
    if (inEve(now, startDay)) {
      const saved = await save(deps, "meetings", { ...meeting, reminderSentAt: nowIso(deps) })
      await announceMeeting(deps, saved, "meeting-reminder", "Lembrete: reunião do conselho amanhã")
    }
  }

  const polls = await deps.repo.byIndex("polls", "byCondominium", condominiumId)
  for (const poll of polls) {
    if (!poll.closedAt && new Date(poll.closesAt).getTime() <= now) {
      await closePoll(deps, poll, poll.closesAt)
    }
  }

  await runFrontDeskDue(deps, condominiumId)
  await runSecurityDue(deps, condominiumId)
}

/** Segurança (spec 005, RF-009): alerta sem "Estou indo" em 2 minutos toca de novo e avisa o síndico, uma vez. */
const REPEAT_AFTER = 2 * 60_000

async function runSecurityDue(deps: ServiceDeps, condominiumId: string) {
  const now = deps.now().getTime()
  const alerts = await deps.repo.byIndex("emergencyAlerts", "byCondominium", condominiumId)
  for (const alert of alerts) {
    if (alert.status !== "open" || alert.repeatedAt) continue
    if (now - new Date(alert.createdAt).getTime() < REPEAT_AFTER) continue
    const saved = await save(deps, "emergencyAlerts", { ...alert, repeatedAt: nowIso(deps) })
    const [apt, staff, managers] = await Promise.all([
      deps.repo.get("apartments", alert.apartmentId),
      doormen(deps, condominiumId),
      managerIds(deps, condominiumId),
    ])
    await notify(deps, condominiumId, {
      type: "emergency",
      audience: { personIds: [...new Set([...staff.map((d) => d.personId), ...managers])] },
      title: `🚨 Ainda sem resposta · apto ${apt?.number}`,
      body: `${KIND_LABEL[saved.kind]} · ninguém tocou "Estou indo" há 2 minutos.`,
      target: { kind: "emergency", id: saved.id },
    })
  }
}

/** Portaria (spec 004, research R2): lembrete de encomenda parada, código que não chegou, visitante que não veio. */
async function runFrontDeskDue(deps: ServiceDeps, condominiumId: string) {
  const now = deps.now()
  const today = todayKey(deps)
  const deliveries = await deps.repo.byIndex("deliveries", "byCondominium", condominiumId)
  for (const d of deliveries) {
    if (d.deletedAt) continue
    if (d.status === "awaiting" && now.getTime() - new Date(d.createdAt).getTime() > 7 * DAY) {
      await save(deps, "deliveries", { ...d, status: "not-arrived" })
      continue
    }
    if (d.status !== "at-desk" || d.lastReminderDay === today) continue
    const days = daysBetween(d.arrivedAt ?? d.createdAt, now)
    if (days < 3 || (await activeTravel(deps, d.apartmentId, today))) continue
    const updated = await save(deps, "deliveries", { ...d, lastReminderDay: today })
    const what = d.origin === "mail" ? "Correspondência" : (storeLabel(d) ?? "Encomenda")
    await notify(deps, condominiumId, {
      type: "delivery-reminder",
      audience: { personIds: await deliveryRecipients(deps, updated) },
      title: "Encomenda esperando na portaria",
      body: `${what} está na portaria há ${days} dias. Passe para buscar.`,
      target: { kind: "delivery", id: d.id },
    })
  }

  const visitors = await deps.repo.byIndex("visitors", "byCondominium", condominiumId)
  for (const v of visitors)
    if (v.status === "expected" && v.day < today)
      await save(deps, "visitors", { ...v, status: "no-show" })
}

// Uma execução por vez em cada conjunto de serviços: leituras simultâneas não duplicam envios.
const running = new WeakMap<ServiceDeps, Promise<void>>()

export function runDue(deps: ServiceDeps, condominiumId: string): Promise<void> {
  const previous = running.get(deps) ?? Promise.resolve()
  const next = previous.catch(() => {}).then(() => runDueNow(deps, condominiumId))
  running.set(deps, next)
  return next
}
