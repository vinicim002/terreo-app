"use client"

import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Users,
  Wrench,
  Megaphone,
  Recycle,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Badge, Empty, Section, useDates } from "@/components/comm/shared"
import { useAgendaMonth, useUpcoming } from "@/hooks/data"
import {
  dayKeyBrasilia,
  formatMonthYear,
  fromDayKey,
  intlLocale,
  monthGridBrasilia,
} from "@/i18n/datetime"
import { PROFILES_DEF } from "@/navigation/screens"
import type { Profile } from "@/preferences/types"
import type { AgendaItem } from "@/services/contracts"

const ICON = { meeting: Users, maintenance: Wrench, routine: Recycle, notice: Megaphone }

function hrefOf(base: string, item: AgendaItem) {
  if (item.target.kind === "meeting") return `${base}/meeting/?id=${item.target.id}`
  if (item.target.kind === "notice") return `${base}/notice/?id=${item.target.id}`
  return null
}

function ItemRow({ item, base, showDate }: { item: AgendaItem; base: string; showDate?: boolean }) {
  const t = useTranslations("comm.agenda")
  const dates = useDates()
  const Icon = ICON[item.kind]
  const href = hrefOf(base, item)
  const title = item.kind === "meeting" ? t("meetingTitle") : item.title
  const content = (
    <>
      <span className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-accent py-1 text-accent-foreground">
        {showDate ? (
          <>
            <span className="text-lg font-extrabold leading-tight">
              {dayKeyBrasilia(item.date).slice(8)}
            </span>
            <span className="text-xs">{item.kind === "notice" ? "" : dates.time(item.date)}</span>
          </>
        ) : (
          <Icon aria-hidden className="my-1.5 size-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {showDate
            ? dates.long(item.date)
            : item.kind === "notice"
              ? t("kinds.notice")
              : dates.time(item.date)}
          <Badge>{t(`kinds.${item.kind}`)}</Badge>
          {item.recurrence !== "none" && (
            <Badge tone="warning">
              <Repeat aria-hidden className="mr-1 size-3" />
              {t(`recurrence.${item.recurrence}`)}
            </Badge>
          )}
        </span>
      </span>
      {href && <ChevronRight aria-hidden className="size-5 shrink-0" />}
    </>
  )
  const cls =
    "flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground"
  return href ? (
    <Link href={href} className={`${cls} hover:bg-muted`}>
      {content}
    </Link>
  ) : (
    <div className={cls}>{content}</div>
  )
}

/** Agenda do prédio (mockup 22): mês com marcas, eventos do dia e "Próximos". */
export function CalendarScreen({ profile }: { profile: Profile }) {
  const t = useTranslations("comm.agenda")
  const dates = useDates()
  const base = PROFILES_DEF[profile].basePath
  const todayKey = dayKeyBrasilia(new Date())
  const [ym, setYm] = useState(() => ({
    y: Number(todayKey.slice(0, 4)),
    m: Number(todayKey.slice(5, 7)),
  }))
  const [selected, setSelected] = useState(todayKey)
  const { data: month } = useAgendaMonth(ym.y, ym.m)
  const { data: upcoming } = useUpcoming()
  const grid = useMemo(() => monthGridBrasilia(ym.y, ym.m), [ym])
  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intlLocale(dates.locale), {
      weekday: "narrow",
      timeZone: "UTC",
    })
    // 2026-11-01 é domingo.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2026, 10, 1 + i))))
  }, [dates.locale])
  const move = (delta: number) =>
    setYm(({ y, m }) => {
      const total = y * 12 + (m - 1) + delta
      return { y: Math.floor(total / 12), m: (total % 12) + 1 }
    })
  const dayItems = month?.days[selected] ?? []

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      {profile === "manager" && (
        <div className="grid grid-cols-2 gap-2">
          <Link href="/manager/meeting/edit/" className="btn-primary">
            <Users aria-hidden className="size-5" />
            {t("newMeeting")}
          </Link>
          <Link href="/manager/event/new/" className="btn-outline">
            <CalendarPlus aria-hidden className="size-5" />
            {t("newEvent")}
          </Link>
        </div>
      )}
      <section className="rounded-xl border border-border bg-card p-3 text-card-foreground">
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            aria-label={t("prev")}
            onClick={() => move(-1)}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-border"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <h2 className="flex-1 text-center text-lg first-letter:uppercase" aria-live="polite">
            {formatMonthYear(ym.y, ym.m, dates.locale)}
          </h2>
          <button
            type="button"
            aria-label={t("next")}
            onClick={() => move(1)}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-border"
          >
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </div>
        <div
          className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground"
          aria-hidden
        >
          {weekdays.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.flat().map((key, i) => {
            if (!key) return <span key={i} />
            const count = month?.days[key]?.length ?? 0
            const isToday = key === todayKey
            const isSelected = key === selected
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isSelected}
                aria-label={t("day", { date: dates.long(fromDayKey(key)), count })}
                onClick={() => setSelected(key)}
                className={`relative flex min-h-11 flex-col items-center justify-center rounded-xl text-sm font-semibold ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "border-2 border-primary"
                      : "hover:bg-muted"
                }`}
              >
                {Number(key.slice(8))}
                {count > 0 && (
                  <span
                    aria-hidden
                    className={`absolute bottom-1 size-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-brand"}`}
                  />
                )}
              </button>
            )
          })}
        </div>
      </section>

      <Section title={dates.long(fromDayKey(selected))}>
        {dayItems.length === 0 ? (
          <p className="text-muted-foreground">{t("emptyDay")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {dayItems.map((item, i) => (
              <li key={`${item.target.id}-${i}`}>
                <ItemRow item={item} base={base} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t("upcoming")}>
        {upcoming && upcoming.length === 0 && <Empty>{t("emptyUpcoming")}</Empty>}
        <ul className="flex flex-col gap-2" data-testid="upcoming">
          {upcoming?.map((item, i) => (
            <li key={`${item.target.id}-${i}`}>
              <ItemRow item={item} base={base} showDate />
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
