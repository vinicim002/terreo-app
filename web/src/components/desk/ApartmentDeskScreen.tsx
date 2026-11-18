"use client"

import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { ScreenPage } from "@/components/layout/ScreenPage"
import { ApartmentDesk } from "./ApartmentDesk"

/** Página do painel do apartamento: título "Apartamento N". */
export function ApartmentDeskScreen() {
  const t = useTranslations("screens")
  const number = useSearchParams().get("n") ?? ""
  return (
    <ScreenPage
      profile="front-desk"
      slug="apartmentDesk"
      title={t("apartmentDesk", { number })}
      backHref="/front-desk/deliveries/"
      inner
    >
      <ApartmentDesk />
    </ScreenPage>
  )
}
