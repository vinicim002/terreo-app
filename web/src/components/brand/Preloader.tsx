"use client"

import { useTranslations } from "next-intl"

/**
 * Abertura do Térreo enquanto o app carrega (sessão, dados do aparelho): fundo laranja da marca, mascote e três
 * pontinhos. Sem animação para quem pediu menos movimento no aparelho.
 */
export function Preloader() {
  const t = useTranslations("common")
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 overflow-hidden bg-brand"
    >
      <span aria-hidden className="absolute -right-24 -top-24 size-72 rounded-full bg-white/10" />
      <span aria-hidden className="absolute -bottom-32 -left-20 size-80 rounded-full bg-white/10" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascote-branco.png"
        alt=""
        width={120}
        height={135}
        className="relative h-32 w-auto drop-shadow-xl motion-safe:animate-[terreo-float_2.4s_ease-in-out_infinite]"
      />
      <span aria-hidden className="relative flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-3 rounded-full bg-white motion-safe:animate-[terreo-dot_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </span>
      <span className="sr-only">{t("loading")}</span>
    </div>
  )
}
