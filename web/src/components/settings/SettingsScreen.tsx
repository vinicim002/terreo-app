"use client"

import { Check } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, type ReactNode } from "react"
import { LibrasStatus } from "@/components/accessibility/LibrasStatus"
import { Header } from "@/components/layout/Header"
import { AccountSection } from "@/components/settings/AccountSection"
import { roleHome, useSession } from "@/auth/session"
import { usePreferences } from "@/preferences/store"
import { FONT_SCALES, LOCALES, THEMES, type FontScale, type Locale } from "@/preferences/types"
import { Flag } from "@/phone/Flag"

/** Bandeira de cada idioma do app. */
const LOCALE_FLAG: Record<Locale, string> = { pt: "BR", en: "US", es: "ES" }

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Choice<T extends string | number>({
  legend,
  options,
  value,
  onChange,
  label,
  icon,
}: {
  legend: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  label: (value: T) => string
  icon?: (value: T) => ReactNode
}) {
  const name = useId()
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => {
        const checked = option === value
        return (
          <label
            key={option}
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 ${
              checked
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-card-foreground"
            }`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={checked}
              onChange={() => onChange(option)}
            />
            {icon?.(option)}
            <span className="flex-1 font-medium">{label(option)}</span>
            {checked && <Check aria-hidden className="size-5 text-link" />}
          </label>
        )
      })}
    </fieldset>
  )
}

export function SettingsScreen() {
  const t = useTranslations("settings")
  const [prefs, update] = usePreferences()
  const state = useSession()
  const role = state.status === "ready" ? state.session?.activeRole : null
  const backHref = role ? roleHome(role) : "/"

  return (
    <>
      <Header title={t("title")} showBack backHref={backHref} />
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-4 pb-12">
        <Section title={t("language")}>
          <Choice
            legend={t("language")}
            options={LOCALES}
            value={prefs.locale}
            onChange={(locale) => update({ locale })}
            label={(l) => t(`languages.${l}`)}
            icon={(l) => <Flag code={LOCALE_FLAG[l]} className="text-2xl" />}
          />
        </Section>

        <Section title={t("theme")}>
          <Choice
            legend={t("theme")}
            options={THEMES}
            value={prefs.theme}
            onChange={(theme) => update({ theme })}
            label={(theme) => t(`themes.${theme}`)}
          />
          <button
            type="button"
            role="switch"
            aria-checked={prefs.highContrast}
            onClick={() => update({ highContrast: !prefs.highContrast })}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 py-2 text-left text-card-foreground"
          >
            <span className="flex-1">
              <span className="block font-medium">{t("highContrast")}</span>
              <span className="block text-sm text-muted-foreground">{t("highContrastHint")}</span>
            </span>
            <span
              aria-hidden
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 ${
                prefs.highContrast ? "border-primary bg-primary" : "border-input bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full transition-transform ${
                  prefs.highContrast
                    ? "translate-x-5 bg-primary-foreground"
                    : "translate-x-0.5 bg-foreground"
                }`}
              />
            </span>
          </button>
        </Section>

        <Section title={t("fontSize")}>
          <Choice<FontScale>
            legend={t("fontSize")}
            options={FONT_SCALES}
            value={prefs.fontScale}
            onChange={(fontScale) => update({ fontScale })}
            label={(f) => t(`fontSizes.${f}`)}
          />
        </Section>

        <Section title={t("libras")}>
          <LibrasStatus />
        </Section>

        <AccountSection />
        <p className="text-xs text-muted-foreground">{t("credits")}</p>
      </main>
    </>
  )
}
