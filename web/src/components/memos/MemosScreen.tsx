"use client"

import { Check, Megaphone } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Badge, Empty, useDates } from "@/components/comm/shared"
import { serviceContext, useMemos, useServiceMutation } from "@/hooks/data"
import { getServices } from "@/services"

/** Recados da portaria para o síndico (História 4, RF-018). */
export function MemosScreen() {
  const t = useTranslations("fd.memos")
  const dates = useDates()
  const { data } = useMemos()
  const seen = useServiceMutation((id: string) =>
    getServices().memos.markSeen(serviceContext(), id),
  )
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 py-4">
      {data?.length === 0 && <Empty>{t("empty")}</Empty>}
      {data?.map((m) => (
        <article
          key={m.id}
          className={`flex flex-col gap-2 rounded-xl border bg-card p-3 text-card-foreground ${m.seen ? "border-border" : "border-2 border-primary"}`}
        >
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {t("by", { name: m.author, date: dates.short(m.createdAt) })}
            {!m.seen && <Badge tone="primary">{t("new")}</Badge>}
            {m.noticeId && <Badge tone="success">{t("hasNotice")}</Badge>}
          </p>
          <p className="whitespace-pre-line text-lg">{m.text}</p>
          <div className="flex flex-wrap gap-2">
            {!m.noticeId && (
              <Link href={`/manager/notice/edit/?memo=${m.id}`} className="btn-primary">
                <Megaphone aria-hidden className="size-5" />
                {t("toNotice")}
              </Link>
            )}
            {!m.seen && (
              <button type="button" className="btn-outline" onClick={() => seen.mutate(m.id)}>
                <Check aria-hidden className="size-5" />
                {t("markSeen")}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
