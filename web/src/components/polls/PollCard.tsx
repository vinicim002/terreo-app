"use client"

import { Check, Trophy, Vote } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { ConfirmBox } from "@/components/forms/fields"
import { Badge, ErrorText, useDates } from "@/components/comm/shared"
import { serviceContext, useServiceMutation } from "@/hooks/data"
import { getServices } from "@/services"
import type { PollView } from "@/services/contracts"

/**
 * Cartão de enquete (mockup 21): votar com um toque, mudar voto, sugerir ao responsável (oficiais),
 * resultado parcial ou final. O que cada pessoa pode fazer vem do serviço (`me.canVote`, `me.canSuggest`).
 */
export function PollCard({ poll, manager = false }: { poll: PollView; manager?: boolean }) {
  const t = useTranslations("comm.polls")
  const tc = useTranslations("comm")
  const dates = useDates()
  const [changing, setChanging] = useState(false)
  const [closing, setClosing] = useState(false)
  const vote = useServiceMutation((optionId: string) =>
    getServices().polls.vote(serviceContext(), poll.id, optionId),
  )
  const suggest = useServiceMutation((optionId: string) =>
    getServices().polls.suggest(serviceContext(), poll.id, optionId),
  )
  const close = useServiceMutation(() => getServices().polls.close(serviceContext(), poll.id))

  const open = poll.status === "open"
  const label = (id: string) => poll.options.find((o) => o.id === id)?.label ?? ""
  const myVote = poll.me.vote
  const choosing = open && (poll.me.canVote ? !myVote || changing : poll.me.canSuggest)
  const winners = new Set(poll.winner?.optionIds ?? [])

  const pick = (optionId: string) => {
    if (poll.me.canVote) vote.mutate(optionId, { onSuccess: () => setChanging(false) })
    else if (poll.me.canSuggest) suggest.mutate(optionId)
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <header className="flex flex-col gap-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Vote aria-hidden className="size-4" />
          {open
            ? t("closesAt", { date: dates.short(poll.closesAt) })
            : t("closedAt", { date: dates.short(poll.closedAt!) })}
          {poll.official && <Badge tone="warning">{t("official")}</Badge>}
        </p>
        <h2 className="text-lg leading-snug">{poll.question}</h2>
      </header>

      {poll.me.canSuggest && open && (
        <p className="text-sm text-muted-foreground">{t("suggestHint")}</p>
      )}

      {choosing ? (
        <ul className="flex flex-col gap-2">
          {poll.options.map((o) => {
            const suggested = poll.me.suggestion === o.id
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => pick(o.id)}
                  disabled={vote.isPending || suggest.isPending}
                  aria-pressed={poll.me.canVote ? myVote?.optionId === o.id : suggested}
                  className={`flex min-h-12 w-full items-center gap-2 rounded-xl border-2 px-4 text-left font-semibold ${
                    suggested || myVote?.optionId === o.id
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <span className="flex-1">{o.label}</span>
                  {(suggested || myVote?.optionId === o.id) && (
                    <Check aria-hidden className="size-5" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <ul className="flex flex-col gap-2">
          {poll.options.map((o) => (
            <li key={o.id} className="flex flex-col gap-1">
              <span className="flex items-center gap-2">
                {winners.has(o.id) && <Trophy aria-hidden className="size-4 text-link" />}
                <span
                  className={`flex-1 ${myVote?.optionId === o.id || winners.has(o.id) ? "font-bold" : ""}`}
                >
                  {o.label}
                </span>
                {o.percent !== null && <span className="font-semibold">{o.percent}%</span>}
              </span>
              {o.percent !== null && (
                <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className={`block h-full ${winners.has(o.id) || myVote?.optionId === o.id ? "bg-brand" : "bg-input"}`}
                    style={{ width: `${o.percent}%` }}
                  />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {poll.totalVotes !== null && (
        <p className="text-sm text-muted-foreground">{t("votes", { count: poll.totalVotes })}</p>
      )}
      {poll.totalVotes === null && open && (
        <p className="text-sm text-muted-foreground">{t("hidden")}</p>
      )}

      {!open && poll.winner && (
        <p role="status" className="font-bold">
          {poll.winner.tie
            ? t("tie", { options: poll.winner.optionIds.map(label).join(", ") })
            : t("winner", { option: label(poll.winner.optionIds[0]) })}
        </p>
      )}
      {!open && !poll.winner && poll.totalVotes !== null && (
        <p className="text-sm text-muted-foreground">{t("noVotes")}</p>
      )}

      {myVote && (
        <p role="status" className="text-sm font-semibold">
          {poll.official && !poll.me.canVote
            ? t("aptVoted", { name: myVote.byName, option: label(myVote.optionId) })
            : t("youVoted", { option: label(myVote.optionId) })}
        </p>
      )}
      {poll.me.suggestion && (
        <p className="text-sm">{t("yourSuggestion", { option: label(poll.me.suggestion) })}</p>
      )}
      {poll.me.householdSuggestions.length > 0 && open && (
        <div className="rounded-xl bg-muted p-3 text-sm">
          <p className="font-semibold">{t("suggestions")}</p>
          <ul>
            {poll.me.householdSuggestions.map((s) => (
              <li key={s.personName}>
                {t("suggested", { name: s.personName, option: label(s.optionId) })}
              </li>
            ))}
          </ul>
        </div>
      )}
      {open && !manager && !poll.me.canVote && !poll.me.canSuggest && (
        <p className="text-sm text-muted-foreground">
          {poll.official ? t("officialHint") : t("noPermission")}
        </p>
      )}
      {open && poll.me.canVote && myVote && !changing && (
        <button type="button" className="btn-outline" onClick={() => setChanging(true)}>
          {t("change")}
        </button>
      )}
      {(vote.isError || suggest.isError || close.isError) && <ErrorText>{tc("error")}</ErrorText>}

      {manager &&
        open &&
        (closing ? (
          <ConfirmBox
            text={t("closeConfirm")}
            yes={t("closeYes")}
            no={t("no")}
            onNo={() => setClosing(false)}
            onYes={() => close.mutate(undefined)}
          />
        ) : (
          <button type="button" className="btn-outline" onClick={() => setClosing(true)}>
            {t("close")}
          </button>
        ))}
    </article>
  )
}
