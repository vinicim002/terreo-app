"use client"

import { CheckCircle2, MessageCircle, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { ConfirmBox } from "@/components/forms/fields"
import {
  Badge,
  Empty,
  ErrorText,
  KindIcon,
  NOTICE_ICON,
  Section,
  TextArea,
  useDates,
} from "@/components/comm/shared"
import { serviceContext, useNotice, useNoticeStats, useServiceMutation } from "@/hooks/data"
import { fromDayKey } from "@/i18n/datetime"
import { PROFILES_DEF } from "@/navigation/screens"
import type { Profile } from "@/preferences/types"
import { getServices } from "@/services"

/** Detalhe do aviso (mockup 07): abrir marca como lido; confirmação; para o síndico, leituras e ações. */
export function NoticeDetail({ profile }: { profile: Profile }) {
  const t = useTranslations("comm.notices")
  const tc = useTranslations("comm")
  const tk = useTranslations("comm.kinds")
  const dates = useDates()
  const router = useRouter()
  const id = useSearchParams().get("id")
  const isManager = profile === "manager"
  const { data: notice, error } = useNotice(id)
  const { data: stats } = useNoticeStats(id, isManager && !!notice && notice.status !== "scheduled")
  const [resolving, setResolving] = useState(false)
  const [note, setNote] = useState("")
  const [removing, setRemoving] = useState(false)
  const base = PROFILES_DEF[profile].basePath

  const confirm = useServiceMutation(() => getServices().notices.confirm(serviceContext(), id!))
  const resolve = useServiceMutation(() =>
    getServices().notices.resolve(serviceContext(), id!, note.trim() || null),
  )
  const remove = useServiceMutation(() => getServices().notices.remove(serviceContext(), id!))

  if (error)
    return (
      <div className="mx-auto max-w-xl px-4 py-4">
        <Empty>{tc("notFound")}</Empty>
      </div>
    )
  if (!notice) return <p className="px-4 py-4 text-muted-foreground">{tc("loading")}</p>

  const confirmed = notice.me.confirmed || confirm.data?.me.confirmed
  return (
    <article className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <header className="flex items-start gap-3">
        <KindIcon
          icon={NOTICE_ICON[notice.kind]}
          tone={notice.status === "resolved" ? "muted" : "brand"}
        />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            {tk(notice.kind)}
            {notice.important && <Badge tone="primary">{t("important")}</Badge>}
            {notice.status === "resolved" && <Badge tone="success">{t("resolved")}</Badge>}
          </p>
          <h2 className="text-2xl leading-tight">{notice.title}</h2>
          <p className="text-sm text-muted-foreground">
            {t("by", { name: notice.author.name })} ·{" "}
            {notice.status === "scheduled"
              ? t("scheduledFor", { date: dates.short(notice.publishAt) })
              : dates.short(notice.publishedAt!)}
            {notice.editedAt && <> · {t("edited", { time: dates.time(notice.editedAt) })}</>}
          </p>
        </div>
      </header>

      {notice.status === "resolved" && (
        <div
          role="status"
          className="flex gap-2 rounded-xl bg-secondary p-3 text-secondary-foreground"
        >
          <CheckCircle2 aria-hidden className="size-5 shrink-0" />
          <p>
            <strong>{t("resolvedAt", { date: dates.short(notice.resolvedAt!) })}</strong>
            {notice.resolutionNote && <> — {notice.resolutionNote}</>}
          </p>
        </div>
      )}

      <p className="whitespace-pre-line text-lg leading-relaxed">{notice.body}</p>

      {notice.referenceDate && (
        <p className="text-sm text-muted-foreground">
          {t("referenceDate", { date: dates.long(fromDayKey(notice.referenceDate)) })}
          {notice.remindDayBefore && <> · {t("remindDayBefore")}</>}
        </p>
      )}
      {notice.sendToGroup && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle aria-hidden className="size-4" />
          {t("sentToGroup")}
        </p>
      )}

      {notice.requireConfirmation && notice.status !== "scheduled" && profile !== "front-desk" && (
        <div className="flex flex-col gap-2 rounded-xl border-2 border-primary p-4">
          {!confirmed && <p>{t("confirmHint")}</p>}
          <button
            type="button"
            className={confirmed ? "btn-outline" : "btn-primary"}
            disabled={!!confirmed || confirm.isPending}
            onClick={() => confirm.mutate(undefined)}
          >
            {confirmed ? t("confirmed") : t("confirm")}
          </button>
        </div>
      )}

      {isManager && stats && (
        <Section title={t("readBy", { read: stats.readApartments, total: stats.totalApartments })}>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={stats.totalApartments}
            aria-valuenow={stats.readApartments}
            aria-label={t("readBy", { read: stats.readApartments, total: stats.totalApartments })}
            className="h-3 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full bg-brand"
              style={{
                width: `${(100 * stats.readApartments) / Math.max(1, stats.totalApartments)}%`,
              }}
            />
          </div>
          {notice.requireConfirmation && (
            <>
              <h3 className="mt-2">{t("confirmations", { count: stats.confirmations.length })}</h3>
              <ul className="flex flex-col gap-1">
                {stats.confirmations.map((c) => (
                  <li key={`${c.personName}-${c.at}`} className="text-sm">
                    <strong>{c.apartment}</strong> · {c.personName} · {dates.short(c.at)}
                  </li>
                ))}
              </ul>
              <h3 className="mt-2">{t("pending", { count: stats.pendingApartments.length })}</h3>
              <p className="flex flex-wrap gap-1">
                {stats.pendingApartments.map((n) => (
                  <Badge key={n}>{n}</Badge>
                ))}
              </p>
            </>
          )}
        </Section>
      )}

      {isManager && (
        <div className="flex flex-col gap-2">
          <Link href={`/manager/notice/edit/?id=${notice.id}`} className="btn-outline">
            <Pencil aria-hidden className="size-5" />
            {t("edit")}
          </Link>
          {notice.status === "published" && !resolving && (
            <button type="button" className="btn-outline" onClick={() => setResolving(true)}>
              <CheckCircle2 aria-hidden className="size-5" />
              {t("resolve")}
            </button>
          )}
          {resolving && (
            <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
              <TextArea
                label={t("resolveNote")}
                value={note}
                onChange={setNote}
                max={500}
                rows={2}
                placeholder={t("resolveHint")}
              />
              {resolve.isError && <ErrorText>{tc("error")}</ErrorText>}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={resolve.isPending}
                  onClick={() =>
                    resolve.mutate(undefined, { onSuccess: () => setResolving(false) })
                  }
                >
                  {t("resolve")}
                </button>
                <button type="button" className="btn-outline" onClick={() => setResolving(false)}>
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
          {!removing ? (
            <button
              type="button"
              className="btn-outline text-destructive"
              onClick={() => setRemoving(true)}
            >
              <Trash2 aria-hidden className="size-5" />
              {t("remove")}
            </button>
          ) : (
            <ConfirmBox
              text={t("removeConfirm")}
              yes={t("removeYes")}
              no={t("no")}
              onNo={() => setRemoving(false)}
              onYes={() =>
                remove.mutate(undefined, { onSuccess: () => router.replace(`${base}/notices/`) })
              }
            />
          )}
        </div>
      )}
    </article>
  )
}
