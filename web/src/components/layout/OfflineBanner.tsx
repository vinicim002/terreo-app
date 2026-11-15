"use client"

import { WifiOff } from "lucide-react"
import { useTranslations } from "next-intl"
import { useOnline } from "@/hooks/useOnline"

/** Aviso discreto de sem internet; some ao reconectar (RF-023). */
export function OfflineBanner() {
  const t = useTranslations("common")
  const online = useOnline()
  if (online) return null
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-warning-background px-4 py-1.5 text-center text-sm font-medium text-warning"
    >
      <WifiOff aria-hidden className="size-4" />
      {t("offline")}
    </div>
  )
}
