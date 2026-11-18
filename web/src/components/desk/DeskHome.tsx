"use client"

import { Mail, Mic, PackagePlus, Plane, Search, UserCheck } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Section } from "@/components/comm/shared"
import { useDeskOverview, useTodayVisitors } from "@/hooks/data"
import { GeneralAlertBanner } from "@/components/security/GeneralAlertOverlay"
import { DeskSafety } from "@/components/security/HomeShortcuts"

const ACTIONS = [
  { key: "receive", href: "/front-desk/receive-delivery/", icon: PackagePlus },
  { key: "mail", href: "/front-desk/mail/", icon: Mail },
  { key: "visitor", href: "/front-desk/visitors/", icon: UserCheck },
  { key: "dictate", href: "/front-desk/dictate/", icon: Mic },
  { key: "lost", href: "/front-desk/lost-and-found/", icon: Search },
  { key: "travel", href: "/front-desk/travel-watch/", icon: Plane },
] as const

/** Início da portaria (mockup 30, RF-016): busca, 6 botões grandes do mesmo tamanho, números do dia e visitantes esperados. */
export function DeskHome() {
  const t = useTranslations("fd")
  const { data } = useDeskOverview()
  const { data: visitors } = useTodayVisitors()
  const [search, setSearch] = useState("")
  const matches = search ? (data?.apartments.filter((a) => a.number.startsWith(search)) ?? []) : []

  return (
    <>
      <GeneralAlertBanner manageHref="/front-desk/general-alert/" />
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
        <DeskSafety />
        <input
          type="search"
          inputMode="numeric"
          aria-label={t("desk.search")}
          placeholder={t("desk.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value.replace(/\D/g, ""))}
          className="min-h-14 rounded-xl border border-input bg-card px-4 text-xl text-card-foreground"
        />
        {matches.length > 0 && (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
            {matches.map((a) => (
              <li key={a.number}>
                <Link
                  href={`/front-desk/apartment/?n=${a.number}`}
                  className="flex min-h-14 items-center justify-center rounded-xl border-2 border-primary bg-card text-lg font-extrabold"
                >
                  {a.number}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <ul className="grid auto-rows-fr grid-cols-2 gap-2 min-[480px]:grid-cols-3">
          {ACTIONS.map(({ key, href, icon: Icon }) => (
            <li key={key} className="min-w-0">
              <Link
                href={href}
                className="flex h-full min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3 text-center font-bold text-card-foreground hover:bg-muted"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand text-brand-foreground">
                  <Icon aria-hidden className="size-6" />
                </span>
                <span className="w-full hyphens-auto [overflow-wrap:anywhere]">
                  {t(`desk.actions.${key}`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Section title={t("desk.today")}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,6rem),1fr))] gap-2">
            {(
              [
                ["awaiting", "/front-desk/deliveries/"],
                ["atDesk", "/front-desk/deliveries/"],
                ["visitors", "/front-desk/visitors/"],
              ] as const
            ).map(([key, href]) => (
              <Link
                key={key}
                href={href}
                className="flex min-h-20 min-w-0 flex-col justify-center rounded-xl border border-border bg-card p-3 text-card-foreground [overflow-wrap:anywhere] hover:bg-muted"
              >
                <span className="text-3xl font-extrabold" data-testid={`count-${key}`}>
                  {data ? (key === "visitors" ? data.expectedVisitors : data[key]) : "–"}
                </span>
                <span className="text-sm text-muted-foreground">{t(`desk.${key}`)}</span>
              </Link>
            ))}
          </div>
        </Section>
        <Section title={t("desk.expected")}>
          {visitors?.expected.length === 0 && (
            <p className="text-muted-foreground">{t("desk.noExpected")}</p>
          )}
          <ul className="flex flex-col gap-2">
            {visitors?.expected.slice(0, 3).map((v) => (
              <li key={v.id}>
                <Link
                  href="/front-desk/visitors/"
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground"
                >
                  <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                    <span className="block font-semibold">
                      {v.name} → {v.apartment}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t("visitors.between", { from: v.fromTime, to: v.toTime })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  )
}
