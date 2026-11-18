"use client"

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import {
  dayKeyBrasilia,
  formatLongDate,
  formatMonthYear,
  fromDayKey,
  intlLocale,
  monthGridBrasilia,
} from "@/i18n/datetime"
import { useDates } from "./shared"

/**
 * Campo de data com o calendário do Térreo (no lugar do seletor nativo do navegador): abre embaixo do campo,
 * com o mês, os dias em botões grandes, "Hoje" e, quando o campo é opcional, "Limpar". Valor em `AAAA-MM-DD`.
 */
export function DateField({
  label,
  value,
  onChange,
  min,
  clearable = false,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  /** Primeiro dia que pode ser escolhido (`AAAA-MM-DD`). */
  min?: string
  clearable?: boolean
  hint?: string
}) {
  const t = useTranslations("comm.date")
  const dates = useDates()
  const id = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [today] = useState(() => dayKeyBrasilia(new Date()))
  const start = value || today
  const [ym, setYm] = useState(() => ({
    y: Number(start.slice(0, 4)),
    m: Number(start.slice(5, 7)),
  }))
  const grid = useMemo(() => monthGridBrasilia(ym.y, ym.m), [ym])
  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intlLocale(dates.locale), {
      weekday: "narrow",
      timeZone: "UTC",
    })
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2026, 10, 1 + i))))
  }, [dates.locale])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    panelRef.current
      ?.querySelector<HTMLButtonElement>("[aria-pressed=true], [data-today=true]")
      ?.focus()
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const move = (delta: number) =>
    setYm(({ y, m }) => {
      const total = y * 12 + (m - 1) + delta
      return { y: Math.floor(total / 12), m: (total % 12) + 1 }
    })
  const pick = (key: string) => {
    onChange(key)
    setOpen(false)
  }
  const openPanel = () => {
    const base = value || today
    setYm({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) })
    setOpen((o) => !o)
  }

  return (
    <div className="flex flex-col gap-1">
      <span id={`${id}-l`} className="text-sm font-semibold">
        {label}
      </span>
      <button
        type="button"
        aria-labelledby={`${id}-l ${id}-v`}
        aria-expanded={open}
        aria-controls={`${id}-p`}
        onClick={openPanel}
        className={`flex min-h-12 items-center gap-3 rounded-xl border bg-card px-4 text-left text-card-foreground ${
          open ? "border-primary ring-2 ring-ring" : "border-input"
        }`}
      >
        <CalendarDays aria-hidden className="size-5 shrink-0 text-primary" />
        <span
          id={`${id}-v`}
          className={`flex-1 first-letter:uppercase ${value ? "" : "text-muted-foreground"}`}
        >
          {value ? formatLongDate(fromDayKey(value), dates.locale) : t("choose")}
        </span>
      </button>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {open && (
        <div
          id={`${id}-p`}
          ref={panelRef}
          role="group"
          aria-label={label}
          className="mt-1 rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-lg"
        >
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              aria-label={t("prev")}
              onClick={() => move(-1)}
              className="inline-flex size-11 items-center justify-center rounded-xl border border-border hover:bg-muted"
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>
            <p
              className="flex-1 text-center font-extrabold first-letter:uppercase"
              aria-live="polite"
            >
              {formatMonthYear(ym.y, ym.m, dates.locale)}
            </p>
            <button
              type="button"
              aria-label={t("next")}
              onClick={() => move(1)}
              className="inline-flex size-11 items-center justify-center rounded-xl border border-border hover:bg-muted"
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
              const selected = key === value
              const isToday = key === today
              const disabled = !!min && key < min
              return (
                <button
                  key={key}
                  type="button"
                  data-day={key}
                  data-today={isToday || undefined}
                  disabled={disabled}
                  aria-pressed={selected}
                  aria-label={formatLongDate(fromDayKey(key), dates.locale)}
                  onClick={() => pick(key)}
                  className={`flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold disabled:opacity-40 ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                        ? "border-2 border-primary"
                        : "hover:bg-muted"
                  }`}
                >
                  {Number(key.slice(8))}
                </button>
              )
            })}
          </div>
          <div className="mt-2 flex justify-between gap-2">
            {clearable ? (
              <button type="button" className="btn-outline min-h-11" onClick={() => pick("")}>
                {t("clear")}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="btn-outline min-h-11"
              disabled={!!min && today < min}
              onClick={() => pick(today)}
            >
              {t("today")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
