"use client"

import { Check, ChevronDown, Phone, Search } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useHydrated } from "@/hooks/useHydrated"
import { Flag } from "./Flag"
import { countryOptions, type CountryCode } from "./phone"

export interface PhoneValue {
  country: CountryCode
  text: string
}

interface PhoneInputProps {
  label: string
  value: PhoneValue
  onChange: (value: PhoneValue) => void
  /** Mensagem de erro já traduzida. */
  error?: string
  autoFocus?: boolean
  disabled?: boolean
}

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

/**
 * Celular com país: Brasil (+55) primeiro e nomes no idioma do app (RF-001a). O país é escolhido num painel
 * com busca, no visual do Térreo (no lugar da lista do navegador).
 */
export function PhoneInput({
  label,
  value,
  onChange,
  error,
  autoFocus,
  disabled,
}: PhoneInputProps) {
  const t = useTranslations("phone")
  const locale = useLocale()
  const id = useId()
  const hydrated = useHydrated()
  // Os nomes dos países (Intl.DisplayNames) diferem entre o servidor e o navegador; montar a lista só no
  // navegador evita erro de hidratação. Antes disso, só o país escolhido aparece.
  const all = useMemo(() => countryOptions(locale), [locale])
  const countries = hydrated ? all : all.filter((c) => c.code === value.country)
  const current = all.find((c) => c.code === value.country)
  const dial = current?.dial ?? "+55"
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const numberRef = useRef<HTMLInputElement>(null)
  const filtered = useMemo(() => {
    const q = fold(search.trim())
    if (!q) return countries
    return countries.filter(
      (c) => fold(c.name).includes(q) || c.dial.includes(q) || c.code.toLowerCase() === q,
    )
  }, [countries, search])

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const pick = (code: CountryCode) => {
    onChange({ ...value, country: code })
    setOpen(false)
    setSearch("")
    numberRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`${id}-number`} className="text-sm font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label={`${t("country")}: ${current?.name ?? ""} ${dial}`}
          aria-expanded={open}
          aria-controls={`${id}-countries`}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={`inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl border bg-card px-3 text-card-foreground disabled:opacity-60 ${
            open ? "border-primary ring-2 ring-ring" : "border-input"
          }`}
        >
          <Flag code={value.country} className="text-xl" />
          <span className="font-semibold">{dial}</span>
          <ChevronDown
            aria-hidden
            className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        <div className="relative flex-1">
          <input
            id={`${id}-number`}
            ref={numberRef}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            autoFocus={autoFocus}
            disabled={disabled}
            value={value.text}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
            placeholder={value.country === "BR" ? "(21) 98765-4321" : dial}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className="min-h-12 w-full rounded-xl border border-input bg-card px-4 pr-11 text-lg text-card-foreground"
          />
          <Phone
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </div>
      {open && (
        <div
          id={`${id}-countries`}
          role="group"
          aria-label={t("country")}
          className="mt-1 flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-lg"
        >
          <label className="relative block">
            <span className="sr-only">{t("search")}</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="min-h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-card-foreground"
            />
          </label>
          <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto overscroll-contain">
            {filtered.length === 0 && (
              <li className="p-2 text-muted-foreground">{t("noResults")}</li>
            )}
            {filtered.map((c) => {
              const selected = c.code === value.country
              return (
                <li key={c.code}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => pick(c.code)}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left ${
                      selected ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <Flag code={c.code} className="text-xl" />
                    <span className="flex-1">{c.name}</span>
                    <span className="text-muted-foreground">{c.dial}</span>
                    {selected && <Check aria-hidden className="size-5 text-primary" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
