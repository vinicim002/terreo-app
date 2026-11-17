"use client"

import { MapPin, Pencil, X } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { ConfirmBox } from "@/components/forms/fields"
import { Badge, Empty, ErrorText, Section, TextArea, useDates } from "@/components/comm/shared"
import { serviceContext, useMeeting, useServiceMutation } from "@/hooks/data"
import { PROFILES_DEF } from "@/navigation/screens"
import type { Profile } from "@/preferences/types"
import { getServices } from "@/services"

/** Reunião: data, local, pauta e resumo; o síndico registra o resumo depois da data (RF-020, RF-021). */
export function MeetingDetail({ profile }: { profile: Profile }) {
  const t = useTranslations("comm.meetings")
  const tc = useTranslations("comm")
  const dates = useDates()
  const router = useRouter()
  const id = useSearchParams().get("id")
  const { data: m, error } = useMeeting(id)
  const [writing, setWriting] = useState(false)
  const [summary, setSummary] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const isManager = profile === "manager"
  const save = useServiceMutation(() =>
    getServices().meetings.setSummary(serviceContext(), id!, summary),
  )
  const cancel = useServiceMutation(() => getServices().meetings.cancel(serviceContext(), id!))

  if (error)
    return (
      <div className="mx-auto max-w-xl px-4 py-4">
        <Empty>{tc("notFound")}</Empty>
      </div>
    )
  if (!m) return <p className="px-4 py-4 text-muted-foreground">{tc("loading")}</p>

  return (
    <article className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl leading-tight first-letter:uppercase">
          {t("when", { date: dates.long(m.startsAt), time: dates.time(m.startsAt) })}
        </h2>
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin aria-hidden className="size-4" />
          <span className="sr-only">{t("place")}: </span>
          {m.place}
        </p>
        {m.summary && <Badge tone="success">{t("summaryAvailable")}</Badge>}
      </header>
      <Section title={t("agenda")}>
        <ol className="list-decimal pl-6">
          {m.agenda.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </Section>
      <Section title={t("summary")}>
        {m.summary ? (
          <p className="whitespace-pre-line leading-relaxed">{m.summary}</p>
        ) : (
          <p className="text-muted-foreground">{t("noSummary")}</p>
        )}
      </Section>

      {isManager && m.status === "past" && !writing && (
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setSummary(m.summary ?? "")
            setWriting(true)
          }}
        >
          <Pencil aria-hidden className="size-5" />
          {m.summary ? t("editSummary") : t("writeSummary")}
        </button>
      )}
      {writing && (
        <div className="flex flex-col gap-2">
          <TextArea
            label={t("summary")}
            value={summary}
            onChange={setSummary}
            max={5000}
            rows={8}
          />
          {save.isError && <ErrorText>{tc("error")}</ErrorText>}
          <button
            type="button"
            className="btn-primary"
            disabled={save.isPending || !summary.trim()}
            onClick={() => save.mutate(undefined, { onSuccess: () => setWriting(false) })}
          >
            {t("saveSummary")}
          </button>
        </div>
      )}
      {isManager && m.status === "upcoming" && (
        <div className="flex flex-col gap-2">
          <Link href={`/manager/meeting/edit/?id=${m.id}`} className="btn-outline">
            <Pencil aria-hidden className="size-5" />
            {t("edit")}
          </Link>
          {cancelling ? (
            <ConfirmBox
              text={t("cancelConfirm")}
              yes={t("cancelYes")}
              no={t("no")}
              onNo={() => setCancelling(false)}
              onYes={() =>
                cancel.mutate(undefined, {
                  onSuccess: () => router.replace(`${PROFILES_DEF[profile].basePath}/meetings/`),
                })
              }
            />
          ) : (
            <button
              type="button"
              className="btn-outline text-destructive"
              onClick={() => setCancelling(true)}
            >
              <X aria-hidden className="size-5" />
              {t("cancelMeeting")}
            </button>
          )}
        </div>
      )}
    </article>
  )
}
