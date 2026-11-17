// Enquetes (spec 003, História 3). Comuns: cada pessoa com permissão vota. Oficiais: o voto do apartamento é do
// responsável; as outras pessoas com permissão deixam uma sugestão, que só o responsável vê (research R4).
// O resultado é calculado na leitura, sem contadores guardados.
import { getIn, nowIso, save, type ServiceDeps } from "./base"
import { ServiceError, type PollService, type PollView, type ServiceContext } from "./contracts"
import { closePoll, percent, runDue, tallyPoll } from "./due"
import { notify } from "./notify"
import { authorize, can, type ActorInfo } from "./permissions"
import type { Poll } from "./schemas"

const invalid = (field: string, reason: string, message = "Dado inválido.") =>
  new ServiceError("validation", message, { [field]: reason })

export function pollService(deps: ServiceDeps): PollService {
  async function nameOf(personId: string) {
    return (await deps.repo.get("people", personId))?.name ?? ""
  }

  async function view(actor: ActorInfo, poll: Poll): Promise<PollView> {
    const [votes, suggestions] = await Promise.all([
      deps.repo.byIndex("pollVotes", "byPoll", poll.id),
      deps.repo.byIndex("pollSuggestions", "byPoll", poll.id),
    ])
    const open = !poll.closedAt
    const { counts, total, leaders } = tallyPoll(poll, votes)
    const visible = !open || poll.showPartial || actor.kind === "manager"
    const mine = poll.official
      ? votes.find((v) => v.apartmentId && v.apartmentId === actor.apartmentId)
      : votes.find((v) => v.personId === actor.personId)
    const householdSuggestions =
      poll.official && actor.isResponsible
        ? await Promise.all(
            suggestions
              .filter((s) => s.apartmentId === actor.apartmentId && s.personId !== actor.personId)
              .map(async (s) => ({ personName: await nameOf(s.personId), optionId: s.optionId })),
          )
        : []
    return {
      id: poll.id,
      question: poll.question,
      official: poll.official,
      showPartial: poll.showPartial,
      options: poll.options.map((o) => ({
        id: o.id,
        label: o.label,
        votes: visible ? counts.get(o.id)! : null,
        percent: visible ? percent(counts.get(o.id)!, total) : null,
      })),
      totalVotes: visible ? total : null,
      status: open ? "open" : "closed",
      closesAt: poll.closesAt,
      closedAt: poll.closedAt,
      winner: !open && total > 0 ? { optionIds: leaders, tie: leaders.length > 1 } : null,
      me: {
        canVote: open && can(actor, "poll.vote", { official: poll.official }) === "ok",
        canSuggest: open && can(actor, "poll.suggest", { official: poll.official }) === "ok",
        vote: mine ? { optionId: mine.optionId, byName: await nameOf(mine.personId) } : null,
        suggestion: suggestions.find((s) => s.personId === actor.personId)?.optionId ?? null,
        householdSuggestions,
      },
    }
  }

  async function loadOpen(ctx: ServiceContext, id: string) {
    const poll = await getIn(deps, "polls", ctx.condominiumId, id, "Enquete")
    if (poll.closedAt) throw invalid("poll", "closed", "A enquete já foi encerrada.")
    return poll
  }

  function checkOption(poll: Poll, optionId: string) {
    if (!poll.options.some((o) => o.id === optionId)) throw invalid("optionId", "invalid")
  }

  return {
    async list(ctx) {
      const actor = await authorize(deps, ctx, "poll.view")
      await runDue(deps, ctx.condominiumId)
      const polls = await deps.repo.byIndex("polls", "byCondominium", ctx.condominiumId)
      const open = polls
        .filter((p) => !p.closedAt)
        .sort((a, b) => a.closesAt.localeCompare(b.closesAt))
      const closed = polls
        .filter((p) => p.closedAt)
        .sort((a, b) => b.closedAt!.localeCompare(a.closedAt!))
      return {
        open: await Promise.all(open.map((p) => view(actor, p))),
        closed: await Promise.all(closed.map((p) => view(actor, p))),
      }
    },

    async get(ctx, id) {
      const actor = await authorize(deps, ctx, "poll.view")
      await runDue(deps, ctx.condominiumId)
      return view(actor, await getIn(deps, "polls", ctx.condominiumId, id, "Enquete"))
    },

    async vote(ctx, id, optionId) {
      await authorize(deps, ctx, "poll.view")
      await runDue(deps, ctx.condominiumId)
      const poll = await loadOpen(ctx, id)
      const actor = await authorize(deps, ctx, "poll.vote", { official: poll.official })
      checkOption(poll, optionId)
      const votes = await deps.repo.byIndex("pollVotes", "byPoll", id)
      const existing = poll.official
        ? votes.find((v) => v.apartmentId === actor.apartmentId)
        : votes.find((v) => v.personId === actor.personId)
      await save(deps, "pollVotes", {
        id: existing?.id ?? deps.uuid(),
        condominiumId: ctx.condominiumId,
        pollId: id,
        optionId,
        personId: actor.personId,
        apartmentId: poll.official ? actor.apartmentId! : null,
        votedAt: nowIso(deps),
      })
      return view(actor, poll)
    },

    async suggest(ctx, id, optionId) {
      await authorize(deps, ctx, "poll.view")
      await runDue(deps, ctx.condominiumId)
      const poll = await loadOpen(ctx, id)
      const actor = await authorize(deps, ctx, "poll.suggest", { official: poll.official })
      checkOption(poll, optionId)
      const suggestions = await deps.repo.byIndex("pollSuggestions", "byPoll", id)
      const existing = suggestions.find((s) => s.personId === actor.personId)
      await save(deps, "pollSuggestions", {
        id: existing?.id ?? deps.uuid(),
        condominiumId: ctx.condominiumId,
        pollId: id,
        optionId,
        personId: actor.personId,
        apartmentId: actor.apartmentId!,
        suggestedAt: nowIso(deps),
      })
      return view(actor, poll)
    },

    async create(ctx, input) {
      const actor = await authorize(deps, ctx, "poll.manage")
      const labels = input.options.map((o) => o.trim()).filter(Boolean)
      if (labels.length < 2 || labels.length > 6) throw invalid("options", "count")
      if (new Set(labels.map((l) => l.toLocaleLowerCase())).size !== labels.length)
        throw invalid("options", "repeated")
      if (new Date(input.closesAt).getTime() <= deps.now().getTime())
        throw invalid("closesAt", "past", "A data de encerramento já passou.")
      const poll = await save(deps, "polls", {
        id: deps.uuid(),
        condominiumId: ctx.condominiumId,
        authorId: actor.personId,
        question: input.question.trim(),
        options: labels.map((label) => ({ id: deps.uuid(), label })),
        official: input.official,
        showPartial: input.showPartial,
        createdAt: nowIso(deps),
        closesAt: new Date(input.closesAt).toISOString(),
        closedAt: null,
      })
      await notify(deps, ctx.condominiumId, {
        type: "poll",
        audience: "residents",
        title: poll.question,
        body: poll.options.map((o) => o.label).join(" · "),
        target: { kind: "poll", id: poll.id },
        toGroup: true,
        groupText: `🗳️ Nova enquete: *${poll.question}*\n${poll.options.map((o) => `• ${o.label}`).join("\n")}\nVote pelo app Térreo.`,
      })
      return view(actor, poll)
    },

    async close(ctx, id) {
      const actor = await authorize(deps, ctx, "poll.manage")
      const poll = await loadOpen(ctx, id)
      return view(actor, await closePoll(deps, poll, nowIso(deps)))
    },
  }
}
