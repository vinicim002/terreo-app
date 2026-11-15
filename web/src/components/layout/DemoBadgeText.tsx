"use client"

import { useTranslations } from "next-intl"

export function DemoBadgeText() {
  const t = useTranslations("common")
  return (
    <>
      {t("demo")} · {t("demoHint")}
    </>
  )
}
