"use client"

import { BellRing } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { serviceContext, useGeneralAlert, useServiceMutation } from "@/hooks/data"
import { timeBrasilia } from "@/i18n/datetime"
import { getServices } from "@/services"
import type { GeneralAlertView } from "@/services/contracts"
import { alarm } from "./alarm"

/** Tela cheia do alerta geral para todos (RF-011): tipo, mensagem, quem enviou, hora e "Entendi". */
export function GeneralAlertOverlay({ alert }: { alert: GeneralAlertView }) {
  const t = useTranslations("security.general")
  const tk = useTranslations("security")
  const seen = useServiceMutation(() =>
    getServices().generalAlert.markSeen(serviceContext(), alert.id),
  )
  useEffect(() => alarm(), [alert.id])
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`general-${alert.id}`}
      aria-describedby={`general-msg-${alert.id}`}
      className="fixed inset-0 z-50 overflow-y-auto bg-destructive px-4 pt-[calc(2rem+env(safe-area-inset-top))] pb-8 text-destructive-foreground"
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
        <span className="inline-flex size-24 items-center justify-center rounded-full bg-destructive-foreground text-destructive ring-8 ring-destructive-foreground/25">
          <BellRing aria-hidden className="size-12" />
        </span>
        <p className="text-sm font-bold tracking-[0.3em] uppercase">{t("label")}</p>
        <h2
          id={`general-${alert.id}`}
          className="font-heading text-4xl leading-tight font-extrabold"
        >
          {tk(`generalKind.${alert.kind}`)}
        </h2>
        <p
          id={`general-msg-${alert.id}`}
          className="text-2xl font-semibold [overflow-wrap:anywhere]"
        >
          {alert.message}
        </p>
        <p>{t("by", { name: alert.createdBy, time: timeBrasilia(alert.createdAt) })}</p>
        <button
          type="button"
          onClick={() => seen.mutate(undefined)}
          disabled={seen.isPending}
          className="min-h-16 w-full rounded-2xl bg-destructive-foreground px-4 text-xl font-extrabold text-destructive"
        >
          {t("understood")}
        </button>
      </div>
    </div>
  )
}

/** Faixa do alerta geral em aberto no topo do início dos três perfis (RF-013). */
export function GeneralAlertBanner({ manageHref }: { manageHref?: string }) {
  const t = useTranslations("security.general")
  const tk = useTranslations("security")
  const { data: alert } = useGeneralAlert()
  if (!alert) return null
  return (
    <div className="mx-auto max-w-xl px-4 pt-4">
      <section
        aria-labelledby="general-banner"
        className="flex gap-3 rounded-2xl bg-destructive p-4 text-destructive-foreground"
      >
        <BellRing aria-hidden className="mt-1 size-6 shrink-0" />
        <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
          <h2 id="general-banner" className="text-lg">
            {t("banner", { kind: tk(`generalKind.${alert.kind}`) })}
          </h2>
          <p>{alert.message}</p>
          <p className="text-sm">
            {t("by", { name: alert.createdBy, time: timeBrasilia(alert.createdAt) })}
          </p>
          {manageHref && (
            <Link
              href={manageHref}
              className="mt-2 inline-flex min-h-12 items-center font-bold underline"
            >
              {alert.canClose ? t("manage") : t("open")}
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
