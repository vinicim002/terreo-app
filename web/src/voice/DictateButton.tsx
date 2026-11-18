"use client"

import { Mic, MicOff, Square } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useRef, useState } from "react"
import type { Locale } from "@/preferences/types"
import { listen } from "./speech"

/**
 * Botão de ditar (spec 004, RF-017): fala → texto no campo, para conferir antes de salvar.
 * `mode="append"` junta ao que já foi escrito; `"replace"` troca.
 */
export function DictateButton({
  value,
  onChange,
  mode = "append",
  large = false,
}: {
  value: string
  onChange: (text: string) => void
  mode?: "append" | "replace"
  large?: boolean
}) {
  const t = useTranslations("fd.voice")
  const locale = useLocale() as Locale
  const [listening, setListening] = useState(false)
  const [problem, setProblem] = useState<"unavailable" | "denied" | null>(null)
  const session = useRef<{ stop: () => void } | null>(null)
  const base = useRef("")

  const toggle = () => {
    if (listening) {
      session.current?.stop()
      return
    }
    base.current = mode === "append" && value.trim() ? `${value.trim()} ` : ""
    const s = listen(
      locale,
      (text) => onChange(`${base.current}${text}`),
      (error) => {
        setListening(false)
        if (error === "not-allowed" || error === "service-not-allowed") setProblem("denied")
      },
    )
    if (!s) {
      setProblem("unavailable")
      return
    }
    setProblem(null)
    session.current = s
    setListening(true)
  }

  const size = large ? "size-24" : "size-14"
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={listening}
        aria-label={listening ? t("listening") : t("dictate")}
        className={`inline-flex ${size} shrink-0 items-center justify-center rounded-full ${
          listening
            ? "bg-destructive text-destructive-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {listening ? (
          <Square aria-hidden className={large ? "size-10" : "size-6"} />
        ) : problem ? (
          <MicOff aria-hidden className={large ? "size-10" : "size-6"} />
        ) : (
          <Mic aria-hidden className={large ? "size-10" : "size-6"} />
        )}
      </button>
      {listening && (
        <span className="text-sm font-semibold text-destructive">{t("listening")}</span>
      )}
      {problem && (
        <p role="alert" className="max-w-xs text-center text-sm text-muted-foreground">
          {t(problem)}
        </p>
      )}
    </div>
  )
}

/** Campo de texto da portaria com microfone ao lado (RF-017). */
export function DictateField({
  label,
  value,
  onChange,
  max,
  rows = 1,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  max: number
  rows?: number
}) {
  const id = `f-${label.replace(/\W+/g, "-")}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="flex items-start gap-2">
        {rows > 1 ? (
          <textarea
            id={id}
            value={value}
            rows={rows}
            maxLength={max}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-14 flex-1 rounded-xl border border-input bg-card px-4 py-3 text-lg text-card-foreground"
          />
        ) : (
          <input
            id={id}
            value={value}
            maxLength={max}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-14 flex-1 rounded-xl border border-input bg-card px-4 text-lg text-card-foreground"
          />
        )}
        <DictateButton value={value} onChange={onChange} />
      </div>
    </div>
  )
}
