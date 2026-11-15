"use client"

import { useTranslations } from "next-intl"
import { useOnline } from "@/hooks/useOnline"

/** Texto sobre o VLibras em Ajustes; sem internet, avisa que está indisponível (research R3a). */
export function LibrasStatus() {
  const t = useTranslations("settings")
  const online = useOnline()
  return (
    <p
      role="status"
      className="rounded-xl border border-border bg-card p-3 text-sm text-card-foreground"
    >
      {online ? t("librasHint") : t("librasOffline")}
    </p>
  )
}
