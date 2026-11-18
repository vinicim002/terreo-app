"use client"

import { Clock } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge, Section, useDates } from "@/components/comm/shared"
import { Avatar } from "@/components/profile/Avatar"
import { dayKeyBrasilia } from "@/i18n/datetime"
import { useStaffBoard } from "@/hooks/data"
import type { ShiftView } from "@/services/contracts"

function Row({ s, now }: { s: ShiftView; now: boolean }) {
  const t = useTranslations("fd.onDuty")
  const dates = useDates()
  const today = dayKeyBrasilia(new Date())
  const when =
    dayKeyBrasilia(s.startsAt) === today
      ? t("at", { time: dates.time(s.startsAt) })
      : t("tomorrow", { time: dates.time(s.startsAt) })
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground">
      <Avatar name={s.name} photo={s.photoUrl} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{s.name}</span>
        <span className="block text-sm text-muted-foreground">
          {t(s.role)} · {t("range", { from: dates.time(s.startsAt), to: dates.time(s.endsAt) })}
        </span>
      </span>
      {now ? <Badge tone="success">{t("onDuty")}</Badge> : <Badge>{when}</Badge>}
    </li>
  )
}

/** Equipe de plantão (mockup 14, RF-020): automática pela escala, sem marcar ponto. */
export function OnDuty() {
  const t = useTranslations("fd.onDuty")
  const { data } = useStaffBoard()
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <Section title={t("now")}>
        {data?.now.length === 0 && <p className="text-muted-foreground">{t("nobody")}</p>}
        <ul className="flex flex-col gap-2" data-testid="on-duty-now">
          {data?.now.map((s) => (
            <Row key={`${s.staffId}-${s.startsAt}`} s={s} now />
          ))}
        </ul>
      </Section>
      <Section title={t("next")}>
        <ul className="flex flex-col gap-2">
          {data?.next.slice(0, 6).map((s) => (
            <Row key={`${s.staffId}-${s.startsAt}`} s={s} now={false} />
          ))}
        </ul>
      </Section>
      <p className="flex gap-2 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
        <Clock aria-hidden className="size-5 shrink-0" />
        {t("note")}
      </p>
    </div>
  )
}
