// Reuniões do conselho e agenda do prédio (spec 003, História 4).
import { addRecurrence, dayKeyBrasilia, fromDayKey, startOfDayBrasilia } from "@/i18n/datetime"
import { getIn, nowIso, save, type ServiceDeps } from "./base"
import {
  ServiceError,
  type AgendaItem,
  type AgendaService,
  type MeetingInput,
  type MeetingService,
  type MeetingView,
} from "./contracts"
import { announceMeeting, runDue } from "./due"
import { authorize } from "./permissions"
import type { AgendaEvent, Meeting } from "./schemas"

const invalid = (field: string, reason: string, message = "Dado inválido.") =>
  new ServiceError("validation", message, { [field]: reason })

export function meetingService(deps: ServiceDeps): MeetingService {
  function view(m: Meeting): MeetingView {
    return {
      id: m.id,
      startsAt: m.startsAt,
      place: m.place,
      agenda: m.agenda,
      summary: m.summary,
      summaryAt: m.summaryAt,
      status: m.cancelledAt
        ? "cancelled"
        : new Date(m.startsAt).getTime() <= deps.now().getTime()
          ? "past"
          : "upcoming",
    }
  }

  const clean = (input: MeetingInput) => ({
    startsAt: new Date(input.startsAt).toISOString(),
    place: input.place.trim(),
    agenda: input.agenda.map((a) => a.trim()).filter(Boolean),
  })

  async function load(condominiumId: string, id: string) {
    const meeting = await getIn(deps, "meetings", condominiumId, id, "Reunião")
    if (meeting.cancelledAt) throw new ServiceError("not_found", "Reunião não encontrada.")
    return meeting
  }

  return {
    async list(ctx) {
      await authorize(deps, ctx, "agenda.read")
      await runDue(deps, ctx.condominiumId)
      const all = (await deps.repo.byIndex("meetings", "byCondominium", ctx.condominiumId))
        .filter((m) => !m.cancelledAt)
        .map(view)
      return {
        upcoming: all
          .filter((m) => m.status === "upcoming")
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
        past: all
          .filter((m) => m.status === "past")
          .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
      }
    },

    async get(ctx, id) {
      await authorize(deps, ctx, "agenda.read")
      await runDue(deps, ctx.condominiumId)
      return view(await load(ctx.condominiumId, id))
    },

    async create(ctx, input) {
      const actor = await authorize(deps, ctx, "agenda.manage")
      if (new Date(input.startsAt).getTime() <= deps.now().getTime())
        throw invalid("startsAt", "past", "A data da reunião já passou.")
      const meeting = await save(deps, "meetings", {
        id: deps.uuid(),
        condominiumId: ctx.condominiumId,
        authorId: actor.personId,
        ...clean(input),
        summary: null,
        summaryAt: null,
        reminderSentAt: null,
        cancelledAt: null,
      })
      await announceMeeting(deps, meeting, "meeting", "Reunião do conselho marcada")
      return view(meeting)
    },

    async update(ctx, id, input) {
      await authorize(deps, ctx, "agenda.manage")
      const meeting = await load(ctx.condominiumId, id)
      const data = clean(input)
      const updated = await save(deps, "meetings", {
        ...meeting,
        ...data,
        reminderSentAt: data.startsAt === meeting.startsAt ? meeting.reminderSentAt : null,
      })
      await announceMeeting(deps, updated, "meeting", "Reunião do conselho alterada")
      return view(updated)
    },

    async setSummary(ctx, id, summary) {
      await authorize(deps, ctx, "agenda.manage")
      const meeting = await load(ctx.condominiumId, id)
      if (new Date(meeting.startsAt).getTime() > deps.now().getTime())
        throw invalid("summary", "not_yet", "A reunião ainda não aconteceu.")
      const first = !meeting.summary
      const updated = await save(deps, "meetings", {
        ...meeting,
        summary: summary.trim(),
        summaryAt: nowIso(deps),
      })
      await announceMeeting(
        deps,
        updated,
        "meeting-summary",
        first ? "Resumo da reunião do conselho disponível" : "Resumo da reunião atualizado",
      )
      return view(updated)
    },

    async cancel(ctx, id) {
      await authorize(deps, ctx, "agenda.manage")
      const meeting = await load(ctx.condominiumId, id)
      const cancelled = await save(deps, "meetings", { ...meeting, cancelledAt: nowIso(deps) })
      if (new Date(meeting.startsAt).getTime() > deps.now().getTime())
        await announceMeeting(deps, cancelled, "meeting", "Reunião do conselho cancelada")
    },
  }
}

const MAX_OCCURRENCES = 1000

/** Ocorrências de um evento no intervalo [from, to). */
export function occurrences(event: AgendaEvent, from: number, to: number): string[] {
  const out: string[] = []
  for (let n = 0; n < MAX_OCCURRENCES; n++) {
    const date = addRecurrence(event.startsAt, event.recurrence, n)
    const t = new Date(date).getTime()
    if (t >= to) break
    if (t >= from) out.push(date)
    if (event.recurrence === "none") break
  }
  return out
}

export function agendaService(deps: ServiceDeps): AgendaService {
  async function itemsBetween(condominiumId: string, from: number, to: number) {
    const [meetings, events, notices] = await Promise.all([
      deps.repo.byIndex("meetings", "byCondominium", condominiumId),
      deps.repo.byIndex("agendaEvents", "byCondominium", condominiumId),
      deps.repo.byIndex("notices", "byCondominium", condominiumId),
    ])
    const items: AgendaItem[] = []
    const inRange = (iso: string) => {
      const t = new Date(iso).getTime()
      return t >= from && t < to
    }
    for (const m of meetings)
      if (!m.cancelledAt && inRange(m.startsAt))
        items.push({
          date: m.startsAt,
          kind: "meeting",
          title: "Reunião do conselho",
          recurrence: "none",
          target: { kind: "meeting", id: m.id },
        })
    for (const e of events)
      if (!e.cancelledAt)
        for (const date of occurrences(e, from, to))
          items.push({
            date,
            kind: e.kind,
            title: e.title,
            recurrence: e.recurrence,
            target: { kind: "event", id: e.id },
          })
    for (const n of notices) {
      if (n.deletedAt || !n.publishedAt || !n.referenceDate) continue
      const date = fromDayKey(n.referenceDate).toISOString()
      if (inRange(date))
        items.push({
          date,
          kind: "notice",
          title: n.title,
          recurrence: "none",
          target: { kind: "notice", id: n.id },
        })
    }
    return items.sort((a, b) => a.date.localeCompare(b.date))
  }

  return {
    async month(ctx, year, month) {
      await authorize(deps, ctx, "agenda.read")
      await runDue(deps, ctx.condominiumId)
      const pad = (n: number) => String(n).padStart(2, "0")
      const from = fromDayKey(`${year}-${pad(month)}-01`).getTime()
      const next = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`
      const items = await itemsBetween(ctx.condominiumId, from, fromDayKey(next).getTime())
      const days: Record<string, AgendaItem[]> = {}
      for (const item of items) (days[dayKeyBrasilia(item.date)] ??= []).push(item)
      return { days }
    },

    async upcoming(ctx, limit = 10) {
      await authorize(deps, ctx, "agenda.read")
      await runDue(deps, ctx.condominiumId)
      const now = deps.now().getTime()
      const from = startOfDayBrasilia(deps.now()).getTime()
      const items = await itemsBetween(ctx.condominiumId, from, now + 400 * 86_400_000)
      return items
        .filter((i) => i.kind === "notice" || new Date(i.date).getTime() >= now)
        .slice(0, limit)
    },

    async createEvent(ctx, input) {
      await authorize(deps, ctx, "agenda.manage")
      const event = await save(deps, "agendaEvents", {
        id: deps.uuid(),
        condominiumId: ctx.condominiumId,
        title: input.title.trim(),
        kind: input.kind,
        startsAt: new Date(input.startsAt).toISOString(),
        durationMinutes: input.durationMinutes,
        recurrence: input.recurrence,
        cancelledAt: null,
      })
      return {
        date: event.startsAt,
        kind: event.kind,
        title: event.title,
        recurrence: event.recurrence,
        target: { kind: "event", id: event.id },
      }
    },

    async cancelEvent(ctx, id) {
      await authorize(deps, ctx, "agenda.manage")
      const event = await getIn(deps, "agendaEvents", ctx.condominiumId, id, "Evento")
      await save(deps, "agendaEvents", { ...event, cancelledAt: nowIso(deps) })
    },
  }
}
