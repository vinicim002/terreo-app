"use client"

import { useTranslations } from "next-intl"
import { useHydrated } from "@/hooks/useHydrated"
import { useStorageAvailable } from "./store"

/** Avisa quando o navegador não deixa salvar (modo anônimo, cota cheia) — caso-limite da spec. */
export function StorageWarning() {
  const t = useTranslations("settings")
  const hydrated = useHydrated()
  const ok = useStorageAvailable()
  if (!hydrated || ok) return null
  return (
    <div
      role="status"
      className="bg-warning-background px-4 py-1.5 text-center text-sm text-warning"
    >
      {t("storageWarning")}
    </div>
  )
}
