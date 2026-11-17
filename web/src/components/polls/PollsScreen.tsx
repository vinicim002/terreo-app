"use client"

import { Plus } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Empty, Tabs } from "@/components/comm/shared"
import { usePolls } from "@/hooks/data"
import { PollCard } from "./PollCard"

/** Enquetes abertas e encerradas (História 3). */
export function PollsScreen({ manager = false }: { manager?: boolean }) {
  const t = useTranslations("comm.polls")
  const [tab, setTab] = useState<"open" | "closed">("open")
  const { data } = usePolls()
  const list = data?.[tab] ?? []
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 py-4">
      {manager && (
        <Link href="/manager/poll/new/" className="btn-primary">
          <Plus aria-hidden className="size-5" />
          {t("new")}
        </Link>
      )}
      <Tabs
        label={t("open")}
        options={["open", "closed"] as const}
        value={tab}
        onChange={setTab}
        labelOf={(v) => `${t(v)}${data ? ` (${data[v].length})` : ""}`}
      />
      {data && list.length === 0 && <Empty>{tab === "open" ? t("empty") : t("emptyClosed")}</Empty>}
      {list.map((p) => (
        <PollCard key={p.id} poll={p} manager={manager} />
      ))}
    </div>
  )
}
