"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

/** Tempo segurando para enviar (RF-001): evita disparo com um toque sem querer. */
export const HOLD_MS = 3_000

/**
 * Botão redondo de "segure 3 s" (mockup 12). Funciona com dedo, mouse e teclado (Espaço ou Enter seguros); soltar
 * antes cancela. O anel mostra o progresso e o leitor de tela anuncia o fim.
 */
export function HoldButton({
  onComplete,
  disabled,
}: {
  onComplete: () => void
  disabled?: boolean
}) {
  const t = useTranslations("security.hold")
  const [progress, setProgress] = useState(0)
  /** null = solto; -1 = começou, esperando o primeiro quadro; senão, o instante do primeiro quadro. */
  const start = useRef<number | null>(null)
  const frame = useRef<number | null>(null)
  const done = useRef(false)

  const stop = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    start.current = null
    if (!done.current) setProgress(0)
  }

  // O tempo vem do próprio quadro de animação (o relógio do navegador), não de chamadas durante a renderização.
  const tick = (ts: number) => {
    if (start.current === null) return
    if (start.current < 0) start.current = ts
    const p = Math.min(1, (ts - start.current) / HOLD_MS)
    setProgress(p)
    if (p >= 1) {
      done.current = true
      stop()
      onComplete()
      return
    }
    frame.current = requestAnimationFrame(tick)
  }

  const begin = () => {
    if (disabled || start.current !== null) return
    done.current = false
    start.current = -1
    frame.current = requestAnimationFrame(tick)
  }

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    },
    [],
  )

  const seconds = Math.ceil(((1 - progress) * HOLD_MS) / 1000)
  const R = 46
  const C = 2 * Math.PI * R

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        aria-describedby="hold-hint"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId)
          begin()
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerLeave={stop}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault()
            begin()
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") stop()
        }}
        onContextMenu={(e) => e.preventDefault()}
        className="relative flex size-56 touch-none select-none items-center justify-center rounded-full bg-destructive/10 p-4 disabled:opacity-60 [-webkit-touch-callout:none]"
      >
        <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            strokeWidth="6"
            className="stroke-destructive/20"
          />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            className="stroke-destructive"
          />
        </svg>
        <span className="flex size-44 flex-col items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg">
          <span className="font-heading text-3xl font-extrabold leading-tight">{t("label")}</span>
          <span className="font-heading text-3xl font-extrabold" aria-hidden>
            {progress > 0 ? `${seconds}s` : "3s"}
          </span>
        </span>
      </button>
      <span id="hold-hint" className="sr-only">
        {t("hint")}
      </span>
      <span role="status" className="sr-only">
        {progress > 0 && progress < 1 ? t("holding") : ""}
      </span>
    </div>
  )
}
