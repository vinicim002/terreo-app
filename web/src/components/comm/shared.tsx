"use client"

// Peças comuns das telas de comunicação (spec 003): abas, ícones dos tipos, datas e campos.
import { ArrowUpDown, Droplet, Megaphone, Tag, Users, Zap, type LucideIcon } from "lucide-react"
import { useLocale } from "next-intl"
import { useId, type ReactNode } from "react"
import { formatLongDate, formatShortDateTime, timeBrasilia } from "@/i18n/datetime"
import type { Locale } from "@/preferences/types"
import type { NoticeKind } from "@/services/schemas"

export const NOTICE_ICON: Record<NoticeKind, LucideIcon> = {
  water: Droplet,
  elevator: ArrowUpDown,
  power: Zap,
  meeting: Users,
  general: Megaphone,
  other: Tag,
}

export function KindIcon({
  icon: Icon,
  tone = "brand",
}: {
  icon: LucideIcon
  tone?: "brand" | "muted"
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${
        tone === "brand" ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
      }`}
    >
      <Icon className="size-5" />
    </span>
  )
}

/** Datas no fuso de Brasília e no idioma escolhido. */
export function useDates() {
  const locale = useLocale() as Locale
  return {
    locale,
    short: (iso: string) => formatShortDateTime(iso, locale),
    long: (iso: string | Date) => formatLongDate(iso, locale),
    time: (iso: string) => timeBrasilia(iso),
  }
}

/** Abas em botões (aria-pressed), como os filtros dos apartamentos. */
export function Tabs<T extends string>({
  label,
  options,
  value,
  onChange,
  labelOf,
}: {
  label: string
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  labelOf: (v: T) => string
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`min-h-11 rounded-xl border px-4 font-medium ${
            value === o
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border bg-card text-card-foreground"
          }`}
        >
          {labelOf(o)}
        </button>
      ))}
    </div>
  )
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode
  tone?: "muted" | "primary" | "warning" | "success"
}) {
  const cls = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary text-primary-foreground",
    warning: "bg-warning-background text-warning",
    success: "bg-secondary text-secondary-foreground",
  }[tone]
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {children}
    </span>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
      {/* Mascote da marca (sabiá) no estado vazio. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon-192.png"
        alt=""
        width={48}
        height={48}
        className="size-12 rounded-xl opacity-80"
      />
      <p>{children}</p>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg">{title}</h2>
      {children}
    </section>
  )
}

/** Área de texto com rótulo, contador e erro. */
export function TextArea({
  label,
  value,
  onChange,
  max,
  rows = 5,
  counter,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  max: number
  rows?: number
  counter?: string
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={counter ? `${id}-c` : undefined}
        className="rounded-xl border border-input bg-card px-4 py-3 text-card-foreground"
      />
      {counter && (
        <p id={`${id}-c`} className="self-end text-xs text-muted-foreground">
          {counter}
        </p>
      )}
    </div>
  )
}

/** Campo de data ou hora nativo (bom no celular). */
export function DateTimeField({
  label,
  type,
  value,
  onChange,
  min,
}: {
  label: string
  type: "date" | "time" | "number"
  value: string
  onChange: (v: string) => void
  min?: string
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        min={min}
        inputMode={type === "number" ? "numeric" : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-12 rounded-xl border border-input bg-card px-4 text-card-foreground"
      />
    </div>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm font-medium text-destructive">
      {children}
    </p>
  )
}
