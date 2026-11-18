"use client"

import { Check, Plus, User, Wrench, X } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Badge, Empty, KindIcon, Section, useDates } from "@/components/comm/shared"
import { dayKeyBrasilia, fromDayKey } from "@/i18n/datetime"
import { serviceContext, useMyVisitors, useServiceMutation } from "@/hooks/data"
import { getServices } from "@/services"
import type { VisitorView } from "@/services/contracts"

function VisitorCard({ v }: { v: VisitorView }) {
  const t = useTranslations("fd.visitors")
  const dates = useDates()
  const cancel = useServiceMutation(() => getServices().visitors.cancel(serviceContext(), v.id))
  const [{ today, tomorrow }] = useState(() => ({
    today: dayKeyBrasilia(new Date()),
    tomorrow: dayKeyBrasilia(new Date(Date.now() + 86_400_000)),
  }))
  const dayLabel =
    v.day === today
      ? t("today")
      : v.day === tomorrow
        ? t("tomorrow")
        : dates.long(fromDayKey(v.day))
  return (
    <article className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground">
      <KindIcon
        icon={v.status === "arrived" ? Check : v.kind === "provider" ? Wrench : User}
        tone={v.status === "expected" ? "brand" : "muted"}
      />
      <div className="min-w-0 flex-1">
        <h3 className="text-lg leading-tight">{v.name}</h3>
        <p className="text-sm text-muted-foreground">
          {v.status === "arrived"
            ? t("arrivedAt", { date: dates.short(v.arrivedAt!), name: v.releasedBy ?? "" })
            : `${dayLabel} · ${t("between", { from: v.fromTime, to: v.toTime })}`}
        </p>
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {v.kind === "provider"
            ? t("provider")
            : `${t("visit")} · ${t("people", { count: v.people })}`}
          {v.walkIn && <Badge tone="warning">{t("walkInMark")}</Badge>}
          {v.status === "no-show" && <Badge>{t("noShow")}</Badge>}
          {v.status === "cancelled" && <Badge>{t("cancelled")}</Badge>}
          {v.status === "expected" && v.day === today && <Badge tone="primary">{t("today")}</Badge>}
        </p>
      </div>
      {v.canCancel && (
        <button
          type="button"
          onClick={() => cancel.mutate(undefined)}
          className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border px-3 text-sm font-semibold"
        >
          <X aria-hidden className="size-4" />
          {t("cancel")}
        </button>
      )}
    </article>
  )
}

/** Visitantes do morador (mockup 17): avisar, Esperados e Histórico (História 3). */
export function ResidentVisitors() {
  const t = useTranslations("fd.visitors")
  const { data } = useMyVisitors()
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <Link href="/resident/visitor/new/" className="btn-primary min-h-14 text-lg">
        <Plus aria-hidden className="size-6" />
        {t("new")}
      </Link>
      <Section title={t("expected")}>
        {data?.expected.length === 0 && <Empty>{t("empty")}</Empty>}
        {data?.expected.map((v) => (
          <VisitorCard key={v.id} v={v} />
        ))}
      </Section>
      <Section title={t("history")}>
        {data?.history.length === 0 && <p className="text-muted-foreground">{t("emptyHistory")}</p>}
        {data?.history.map((v) => (
          <VisitorCard key={v.id} v={v} />
        ))}
      </Section>
    </div>
  )
}
