"use client"

import { BellRing, Siren } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Section } from "@/components/comm/shared"
import { useEmergencyHistory, useGeneralAlertHistory } from "@/hooks/data"
import { formatShortDateTime } from "@/i18n/datetime"
import type { EmergencyView, GeneralAlertView } from "@/services/contracts"
import type { Locale } from "@/preferences/types"

type Item =
  | { type: "apartment"; at: string; alert: EmergencyView }
  | { type: "general"; at: string; alert: GeneralAlertView }

/** Minutos e segundos entre dois instantes, para "atendido em". */
export function elapsed(from: string, to: string) {
  const s = Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 1000))
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ""}`
}

/**
 * Histórico de alertas dos últimos 90 dias (História 4). Com `own`, é o do morador: os do próprio apartamento e os
 * gerais; sem `own`, o da portaria e do síndico: todos.
 */
export function AlertHistory({ own }: { own?: EmergencyView[] }) {
  const t = useTranslations("security.history")
  const tk = useTranslations("security")
  const locale = useLocale() as Locale
  const staff = useEmergencyHistory(own === undefined)
  const general = useGeneralAlertHistory()
  const apartment = own ?? staff.data ?? []
  const items: Item[] = [
    ...apartment.map((a) => ({ type: "apartment" as const, at: a.createdAt, alert: a })),
    ...(general.data ?? []).map((a) => ({ type: "general" as const, at: a.createdAt, alert: a })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  return (
    <Section title={t("title")}>
      {items.length === 0 && <p className="text-muted-foreground">{t("empty")}</p>}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={`${item.type}-${item.alert.id}`}
            className="flex gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground"
          >
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              {item.type === "general" ? (
                <BellRing aria-hidden className="size-5" />
              ) : (
                <Siren aria-hidden className="size-5" />
              )}
            </span>
            <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
              {item.type === "apartment" ? (
                <>
                  <p className="font-semibold">
                    {t("apartment", { n: item.alert.apartment })} · {tk(`kind.${item.alert.kind}`)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatShortDateTime(item.at, locale)} · {item.alert.createdBy}
                    {item.alert.origin === "whatsapp" ? ` · ${t("byWhatsapp")}` : ""}
                  </p>
                  <p className="text-sm">
                    {t(`status.${item.alert.status}`)}
                    {item.alert.acknowledgedBy && item.alert.acknowledgedAt
                      ? ` · ${t("answered", {
                          name: item.alert.acknowledgedBy,
                          time: elapsed(item.alert.createdAt, item.alert.acknowledgedAt),
                        })}`
                      : ""}
                  </p>
                  {item.alert.resolutionNote && (
                    <p className="text-sm text-muted-foreground">{item.alert.resolutionNote}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-semibold">
                    {t("general")} · {tk(`generalKind.${item.alert.kind}`)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatShortDateTime(item.at, locale)} · {item.alert.createdBy}
                  </p>
                  <p className="text-sm">{item.alert.message}</p>
                  <p className="text-sm">
                    {item.alert.status === "open"
                      ? t("status.open")
                      : t("closedIn", {
                          time: elapsed(item.alert.createdAt, item.alert.closedAt!),
                        })}
                  </p>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
