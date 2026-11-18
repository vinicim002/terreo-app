"use client"

import { useTranslations } from "next-intl"
import { Section } from "@/components/comm/shared"
import { useOpenEmergencies } from "@/hooks/data"
import { AlertHistory } from "./AlertHistory"
import { EmergencyPanel } from "./DeskEmergencyOverlay"

/** Alertas de emergência da portaria e do síndico (História 4): em aberto no topo e o histórico de 90 dias. */
export function EmergencyAlertsScreen({ canRespond }: { canRespond: boolean }) {
  const t = useTranslations("security.alerts")
  const { data: open } = useOpenEmergencies(true, canRespond ? 1_000 : 3_000)
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <Section title={t("open")}>
        {open?.length === 0 && <p className="text-muted-foreground">{t("none")}</p>}
        <ul className="flex flex-col gap-3">
          {open?.map((a) => (
            <li key={a.id} className="rounded-3xl bg-destructive p-5 text-destructive-foreground">
              <EmergencyPanel alert={a} canRespond={canRespond} />
            </li>
          ))}
        </ul>
      </Section>
      <AlertHistory />
    </div>
  )
}
