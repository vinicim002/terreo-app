// Avisos do prédio (spec 003, Histórias 1 e 2). Só o síndico publica; todos leem.
// Leituras guardam a versão do aviso: editar um aviso publicado sobe a versão e "zera" leituras e
// confirmações sem apagar o histórico (research R3).
import { getIn, nowIso, save, type ServiceDeps } from "./base"
import {
  ServiceError,
  type NoticeInput,
  type NoticeService,
  type NoticeStats,
  type NoticeView,
  type ServiceContext,
} from "./contracts"
import { announceNotice, publishNotice, runDue } from "./due"
import { activeResidents } from "./notify"
import { authorize, type ActorInfo } from "./permissions"
import type { Notice, NoticeRead } from "./schemas"

const invalid = (field: string, reason: string, message = "Dado inválido.") =>
  new ServiceError("validation", message, { [field]: reason })

function statusOf(n: Notice): NoticeView["status"] {
  if (!n.publishedAt) return "scheduled"
  return n.resolvedAt ? "resolved" : "published"
}

function view(n: Notice, authorName: string, read?: NoticeRead): NoticeView {
  const current = read && read.version === n.version ? read : undefined
  return {
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    important: n.important,
    sendToGroup: n.sendToGroup,
    requireConfirmation: n.requireConfirmation,
    referenceDate: n.referenceDate,
    remindDayBefore: n.remindDayBefore,
    status: statusOf(n),
    publishAt: n.publishAt,
    publishedAt: n.publishedAt,
    editedAt: n.editedAt,
    resolvedAt: n.resolvedAt,
    resolutionNote: n.resolutionNote,
    author: { name: authorName },
    me: { read: !!current, confirmed: !!current?.confirmedAt },
  }
}

const sortDate = (n: Notice) => n.publishedAt ?? n.publishAt

export function noticeService(deps: ServiceDeps): NoticeService {
  async function authorName(n: Notice) {
    return (await deps.repo.get("people", n.authorId))?.name ?? "Síndico"
  }

  /** Leitura mais recente de cada aviso pela pessoa. */
  async function myReads(personId: string) {
    const reads = await deps.repo.byIndex("noticeReads", "byPerson", personId)
    const latest = new Map<string, NoticeRead>()
    for (const r of reads) {
      const prev = latest.get(r.noticeId)
      if (!prev || r.version > prev.version) latest.set(r.noticeId, r)
    }
    return latest
  }

  /** Aviso visível para o ator: apagado some; agendado só para o síndico (contracts/permissoes.md). */
  async function load(ctx: ServiceContext, actor: ActorInfo, id: string) {
    const notice = await getIn(deps, "notices", ctx.condominiumId, id, "Aviso")
    if (notice.deletedAt) throw new ServiceError("not_found", "Aviso não encontrado.")
    if (!notice.publishedAt && actor.kind !== "manager")
      throw new ServiceError("not_found", "Aviso não encontrado.")
    return notice
  }

  async function viewFor(actor: ActorInfo, notice: Notice) {
    const reads = await myReads(actor.personId)
    return view(notice, await authorName(notice), reads.get(notice.id))
  }

  function checkInput(input: NoticeInput) {
    if (input.remindDayBefore && !input.referenceDate)
      throw invalid("referenceDate", "required", "Informe a data do assunto para o lembrete.")
    if (input.publishAt && new Date(input.publishAt).getTime() < deps.now().getTime())
      throw invalid("publishAt", "past", "O horário escolhido já passou.")
  }

  const fields = (input: NoticeInput) => ({
    kind: input.kind,
    title: input.title.trim(),
    body: input.body.trim(),
    important: input.important,
    sendToGroup: input.sendToGroup,
    requireConfirmation: input.requireConfirmation,
    referenceDate: input.referenceDate,
    remindDayBefore: input.remindDayBefore,
  })

  return {
    async list(ctx, filter) {
      const actor = await authorize(deps, ctx, "notice.read")
      if (filter === "scheduled") await authorize(deps, ctx, "notice.manage")
      await runDue(deps, ctx.condominiumId)
      const all = (await deps.repo.byIndex("notices", "byCondominium", ctx.condominiumId)).filter(
        (n) => !n.deletedAt,
      )
      const reads = await myReads(actor.personId)
      const isRead = (n: Notice) => reads.get(n.id)?.version === n.version
      const published = all.filter((n) => n.publishedAt)
      const unread = published.filter((n) => !isRead(n)).length
      const chosen =
        filter === "scheduled"
          ? all.filter((n) => !n.publishedAt)
          : filter === "unread"
            ? published.filter((n) => !isRead(n))
            : published
      chosen.sort((a, b) =>
        filter === "scheduled"
          ? a.publishAt.localeCompare(b.publishAt)
          : sortDate(b).localeCompare(sortDate(a)),
      )
      const names = new Map<string, string>()
      const items: NoticeView[] = []
      for (const n of chosen) {
        if (!names.has(n.authorId)) names.set(n.authorId, await authorName(n))
        items.push(view(n, names.get(n.authorId)!, reads.get(n.id)))
      }
      return { items, unread }
    },

    async get(ctx, id) {
      const actor = await authorize(deps, ctx, "notice.read")
      await runDue(deps, ctx.condominiumId)
      const notice = await load(ctx, actor, id)
      if (notice.publishedAt) {
        const reads = await myReads(actor.personId)
        const read = reads.get(id)
        if (!read || read.version !== notice.version) {
          await save(deps, "noticeReads", {
            id: deps.uuid(),
            condominiumId: ctx.condominiumId,
            noticeId: id,
            personId: actor.personId,
            version: notice.version,
            readAt: nowIso(deps),
            confirmedAt: null,
          })
        }
      }
      return viewFor(actor, notice)
    },

    async confirm(ctx, id) {
      const actor = await authorize(deps, ctx, "notice.confirm")
      await runDue(deps, ctx.condominiumId)
      const notice = await load(ctx, actor, id)
      if (!notice.publishedAt || !notice.requireConfirmation)
        throw invalid("notice", "no_confirmation")
      const read = (await myReads(actor.personId)).get(id)
      const now = nowIso(deps)
      await save(deps, "noticeReads", {
        id: read && read.version === notice.version ? read.id : deps.uuid(),
        condominiumId: ctx.condominiumId,
        noticeId: id,
        personId: actor.personId,
        version: notice.version,
        readAt: read && read.version === notice.version ? read.readAt : now,
        confirmedAt: read?.version === notice.version && read.confirmedAt ? read.confirmedAt : now,
      })
      return viewFor(actor, notice)
    },

    async create(ctx, input) {
      const actor = await authorize(deps, ctx, "notice.manage")
      checkInput(input)
      const now = nowIso(deps)
      const draft = await save(deps, "notices", {
        id: deps.uuid(),
        condominiumId: ctx.condominiumId,
        authorId: actor.personId,
        ...fields(input),
        publishAt: input.publishAt ?? now,
        publishedAt: null,
        editedAt: null,
        version: 1,
        resolvedAt: null,
        resolutionNote: null,
        reminderSentAt: null,
        deletedAt: null,
      })
      const notice = input.publishAt ? draft : await publishNotice(deps, draft, now)
      return viewFor(actor, notice)
    },

    async update(ctx, id, input) {
      const actor = await authorize(deps, ctx, "notice.manage")
      const notice = await load(ctx, actor, id)
      if (!notice.publishedAt) {
        checkInput(input)
        const updated = await save(deps, "notices", {
          ...notice,
          ...fields(input),
          publishAt: input.publishAt ?? nowIso(deps),
        })
        const result = input.publishAt ? updated : await publishNotice(deps, updated, nowIso(deps))
        return viewFor(actor, result)
      }
      if (input.remindDayBefore && !input.referenceDate)
        throw invalid("referenceDate", "required", "Informe a data do assunto para o lembrete.")
      const updated = await save(deps, "notices", {
        ...notice,
        ...fields(input),
        version: notice.version + 1,
        editedAt: nowIso(deps),
        reminderSentAt: input.referenceDate === notice.referenceDate ? notice.reminderSentAt : null,
      })
      await announceNotice(deps, updated, "notice-updated")
      return viewFor(actor, updated)
    },

    async resolve(ctx, id, note) {
      const actor = await authorize(deps, ctx, "notice.manage")
      const notice = await load(ctx, actor, id)
      if (!notice.publishedAt) throw invalid("notice", "scheduled")
      const resolved = await save(deps, "notices", {
        ...notice,
        resolvedAt: nowIso(deps),
        resolutionNote: note?.trim() ? note.trim() : null,
      })
      await announceNotice(deps, resolved, "notice-resolved")
      return viewFor(actor, resolved)
    },

    async remove(ctx, id) {
      const actor = await authorize(deps, ctx, "notice.manage")
      const notice = await load(ctx, actor, id)
      await save(deps, "notices", { ...notice, deletedAt: nowIso(deps) })
    },

    async stats(ctx, id): Promise<NoticeStats> {
      const actor = await authorize(deps, ctx, "notice.manage")
      const notice = await load(ctx, actor, id)
      const residents = await activeResidents(deps, ctx.condominiumId)
      const apartments = await deps.repo.byIndex("apartments", "byCondominium", ctx.condominiumId)
      const numberOf = new Map(apartments.map((a) => [a.id, a.number]))
      const activeApartments = new Set(residents.map((r) => r.residency.apartmentId))
      const reads = (await deps.repo.byIndex("noticeReads", "byNotice", id)).filter(
        (r) => r.version === notice.version,
      )
      const readers = new Set(reads.map((r) => r.personId))
      const confirmers = new Map(reads.filter((r) => r.confirmedAt).map((r) => [r.personId, r]))
      const readApartments = new Set<string>()
      const confirmedApartments = new Set<string>()
      const confirmations: NoticeStats["confirmations"] = []
      for (const { residency, person } of residents) {
        if (readers.has(person.id)) readApartments.add(residency.apartmentId)
        const c = confirmers.get(person.id)
        if (c) {
          confirmedApartments.add(residency.apartmentId)
          confirmations.push({
            personName: person.name,
            apartment: numberOf.get(residency.apartmentId) ?? "",
            at: c.confirmedAt!,
          })
        }
      }
      const byNumber = (a: string, b: string) => Number(a) - Number(b)
      return {
        readApartments: readApartments.size,
        totalApartments: activeApartments.size,
        confirmations: confirmations.sort((a, b) => a.at.localeCompare(b.at)),
        pendingApartments: notice.requireConfirmation
          ? [...activeApartments]
              .filter((a) => !confirmedApartments.has(a))
              .map((a) => numberOf.get(a) ?? "")
              .sort(byNumber)
          : [],
      }
    },
  }
}
