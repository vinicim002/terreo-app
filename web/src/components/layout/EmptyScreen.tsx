"use client"

import { Construction } from "lucide-react"
import { useTranslations } from "next-intl"

/** Tela ainda sem conteúdo (RF-007). */
export function EmptyScreen() {
  const t = useTranslations("common")
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <Construction aria-hidden className="size-8" />
      </span>
      <h2 className="text-lg font-extrabold">{t("comingSoonTitle")}</h2>
      <p className="max-w-sm text-muted-foreground">{t("comingSoon")}</p>
    </section>
  )
}
