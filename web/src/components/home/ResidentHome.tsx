"use client"

import { ChevronRight, LayoutGrid } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { EmptyScreen } from "@/components/layout/EmptyScreen"
import { ScreenPage } from "@/components/layout/ScreenPage"
import { ResidentHighlights } from "./CommHighlights"
import { GeneralAlertBanner } from "@/components/security/GeneralAlertOverlay"
import { ResidentSafetyShortcuts } from "@/components/security/HomeShortcuts"

/** Início do morador: leva a "Todos os serviços" (História 1 da 001) e destaca avisos e reunião (spec 003). */
export function ResidentHome() {
  const t = useTranslations("nav")
  return (
    <ScreenPage profile="resident" slug="">
      <GeneralAlertBanner />
      <ResidentSafetyShortcuts />
      <div className="mx-auto max-w-xl px-4 pt-4">
        <Link
          href="/resident/services/"
          className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground hover:bg-muted"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <LayoutGrid aria-hidden className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">{t("allServices")}</span>
            <span className="block text-sm text-muted-foreground">{t("allServicesHint")}</span>
          </span>
          <ChevronRight aria-hidden className="size-5" />
        </Link>
      </div>
      <ResidentHighlights />
      <EmptyScreen />
    </ScreenPage>
  )
}
