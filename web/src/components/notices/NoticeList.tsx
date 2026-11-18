"use client"

import { ChevronRight, Plus } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Badge, Empty, KindIcon, NOTICE_ICON, Tabs, useDates } from "@/components/comm/shared"
import { useNotices } from "@/hooks/data"
import { PROFILES_DEF } from "@/navigation/screens"
import type { Profile } from "@/preferences/types"
import type { NoticeFilter } from "@/services/contracts"

/** Lista de avisos (Histórias 1 e 2, mockup 06): Todos, Não lidos (N) e, para o síndico, Agendados. */
export function NoticeList({ profile }: { profile: Profile }) {
  const t = useTranslations("comm.notices")
  const tk = useTranslations("comm.kinds")
  const dates = useDates()
  const isManager = profile === "manager"
  const [filter, setFilter] = useState<NoticeFilter>("all")
  const { data } = useNotices(filter)
  const base = PROFILES_DEF[profile].basePath
  const filters: NoticeFilter[] = isManager ? ["all", "unread", "scheduled"] : ["all", "unread"]
  const empty = { all: t("empty"), unread: t("emptyUnread"), scheduled: t("emptyScheduled") }[
    filter
  ]

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 py-4">
      {isManager && (
        <Link href="/manager/notice/edit/" className="btn-primary">
          <Plus aria-hidden className="size-5" />
          {t("new")}
        </Link>
      )}
      <Tabs
        label={t("all")}
        options={filters}
        value={filter}
        onChange={setFilter}
        labelOf={(f) => (f === "unread" ? t("unread", { count: data?.unread ?? 0 }) : t(f))}
      />
      {data && data.items.length === 0 && <Empty>{empty}</Empty>}
      <ul className="flex flex-col gap-2" aria-busy={!data}>
        {data?.items.map((n) => {
          const unread = n.status !== "scheduled" && !n.me.read
          return (
            <li key={n.id}>
              <Link
                href={`${base}/notice/?id=${n.id}`}
                className={`flex min-h-16 items-start gap-3 rounded-xl border bg-card p-3 text-card-foreground hover:bg-muted ${
                  n.important ? "border-2 border-primary" : "border-border"
                }`}
              >
                <KindIcon
                  icon={NOTICE_ICON[n.kind]}
                  tone={n.status === "resolved" ? "muted" : "brand"}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {unread && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-link">
                        <span aria-hidden className="size-2.5 rounded-full bg-link" />
                        {t("unreadMark")}
                      </span>
                    )}
                    {n.important && <Badge tone="primary">{t("important")}</Badge>}
                    {n.status === "resolved" && <Badge tone="success">{t("resolved")}</Badge>}
                  </span>
                  <span className={`block ${unread ? "font-extrabold" : "font-semibold"}`}>
                    {n.title}
                  </span>
                  <span className="line-clamp-2 block text-sm text-muted-foreground">{n.body}</span>
                  <span className="block text-xs text-muted-foreground">
                    {n.status === "scheduled"
                      ? t("scheduledFor", { date: dates.short(n.publishAt) })
                      : `${n.kind === "other" ? (n.customKind ?? tk("other")) : tk(n.kind)} · ${dates.short(n.publishedAt!)}`}
                  </span>
                </span>
                <ChevronRight aria-hidden className="mt-3 size-5 shrink-0" />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
