"use client"

import { ChevronRight, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { daysSince } from "@/components/forms/errors"
import { Header } from "@/components/layout/Header"
import { useOverview } from "@/hooks/data"

const FILTERS = ["all", "none", "tenants"] as const
const BADGE = {
  active: "bg-secondary text-secondary-foreground",
  pending: "bg-warning-background text-warning",
  none: "bg-destructive text-destructive-foreground",
}

/** Apartamentos do síndico (História 5, mockup 39): totais, filtros com contagem, busca e situação. */
export function ApartmentsScreen() {
  const t = useTranslations("admin")
  const tk = useTranslations("kindLabels")
  const ts = useTranslations("screens")
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all")
  const [search, setSearch] = useState("")
  const { data } = useOverview(filter, search)

  return (
    <>
      <Header
        title={ts("residents")}
        subtitle={
          data
            ? t("subtitle", { apartments: data.totals.apartments, floors: data.totals.floors })
            : undefined
        }
        notificationsHref="/manager/notifications/"
      />
      <main className="mx-auto flex max-w-xl flex-col gap-3 px-4 py-4">
        <label className="relative block">
          <span className="sr-only">{t("search")}</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="min-h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-card-foreground"
          />
        </label>
        <div role="group" aria-label={t("search")} className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`min-h-11 rounded-xl border px-4 font-medium ${
                filter === f
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-card-foreground"
              }`}
            >
              {t(`filters.${f}`)} {data && `(${data.totals[f]})`}
            </button>
          ))}
        </div>
        {data?.items.length === 0 && <p className="text-muted-foreground">{t("empty")}</p>}
        <ul className="flex flex-col gap-2">
          {data?.items.map((a) => (
            <li key={a.apartmentId}>
              <Link
                href={
                  a.status === "none"
                    ? `/manager/apartment/register/?id=${a.apartmentId}`
                    : `/manager/apartment/?id=${a.apartmentId}`
                }
                className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground hover:bg-muted"
              >
                <span className="inline-flex min-w-14 justify-center rounded-xl bg-accent px-2 py-2 text-lg font-extrabold text-accent-foreground">
                  {a.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{a.responsible?.name ?? "—"}</span>
                  <span className="block text-sm text-muted-foreground">
                    {a.status === "none"
                      ? t("none")
                      : a.status === "pending"
                        ? t("pendingSince", { days: daysSince(a.lastInviteAt!) })
                        : `${tk(a.responsible!.kind)} · ${t("people", { count: a.people })}`}
                  </span>
                </span>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${BADGE[a.status]}`}>
                  {t(`status.${a.status}`)}
                </span>
                <ChevronRight aria-hidden className="size-5" />
              </Link>
            </li>
          ))}
        </ul>
        {/* "+" mostra os apartamentos sem cadastro, onde se cadastra o responsável. */}
        <button
          type="button"
          aria-label={t("register")}
          onClick={() => setFilter("none")}
          className="fixed bottom-24 right-4 inline-flex size-14 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-lg"
        >
          <Plus aria-hidden className="size-7" />
        </button>
      </main>
    </>
  )
}
