"use client"

import { ChevronRight, Plus, Users } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Badge, Empty, KindIcon, Tabs, useDates } from "@/components/comm/shared"
import { useMeetings } from "@/hooks/data"
import { PROFILES_DEF } from "@/navigation/screens"
import type { Profile } from "@/preferences/types"

/** Reuniões do conselho: próximas e passadas (História 4). */
export function MeetingsScreen({ profile }: { profile: Profile }) {
  const t = useTranslations("comm.meetings")
  const ta = useTranslations("comm.agenda")
  const dates = useDates()
  const base = PROFILES_DEF[profile].basePath
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming")
  const { data } = useMeetings()
  const list = data?.[tab] ?? []
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 py-4">
      {profile === "manager" && (
        <Link href="/manager/meeting/edit/" className="btn-primary">
          <Plus aria-hidden className="size-5" />
          {ta("newMeeting")}
        </Link>
      )}
      <Tabs
        label={t("upcoming")}
        options={["upcoming", "past"] as const}
        value={tab}
        onChange={setTab}
        labelOf={(v) => t(v)}
      />
      {data && list.length === 0 && (
        <Empty>{tab === "upcoming" ? t("empty") : t("emptyPast")}</Empty>
      )}
      <ul className="flex flex-col gap-2">
        {list.map((m) => (
          <li key={m.id}>
            <Link
              href={`${base}/meeting/?id=${m.id}`}
              className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground hover:bg-muted"
            >
              <KindIcon icon={Users} tone={tab === "upcoming" ? "brand" : "muted"} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold first-letter:uppercase">
                  {t("when", { date: dates.long(m.startsAt), time: dates.time(m.startsAt) })}
                </span>
                <span className="block text-sm text-muted-foreground">{m.place}</span>
                {m.summary && <Badge tone="success">{t("summaryAvailable")}</Badge>}
              </span>
              <ChevronRight aria-hidden className="size-5" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
