"use client"

import { Phone } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useId, useMemo } from "react"
import { useHydrated } from "@/hooks/useHydrated"
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

/** Celular com país: Brasil (+55) primeiro e nomes no idioma do app (RF-001a). */
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
  const dial = all.find((c) => c.code === value.country)?.dial ?? "+55"

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`${id}-number`} className="text-sm font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <select
          aria-label={t("country")}
          disabled={disabled}
          value={value.country}
          onChange={(e) => onChange({ ...value, country: e.target.value as CountryCode })}
          className="min-h-12 w-24 shrink-0 rounded-xl border border-input bg-card px-2 text-card-foreground"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code === value.country ? c.dial : `${c.name} (${c.dial})`}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <input
            id={`${id}-number`}
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
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
