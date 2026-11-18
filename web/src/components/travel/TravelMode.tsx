"use client"

import { DateField } from "@/components/comm/DateField"
import { Plane } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { ErrorText, useDates } from "@/components/comm/shared"
import { dayKeyBrasilia, fromDayKey } from "@/i18n/datetime"
import { serviceContext, useMyTravel, useServiceMutation } from "@/hooks/data"
import { getServices, ServiceError } from "@/services"

/** Modo viagem do morador (História 5, RF-019). */
export function TravelMode() {
  const t = useTranslations("fd.travel")
  const dates = useDates()
  const { data, isLoading } = useMyTravel()
  const [today] = useState(() => dayKeyBrasilia(new Date()))
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(() => dayKeyBrasilia(new Date(Date.now() + 7 * 86_400_000)))
  const start = useServiceMutation(() => getServices().travel.start(serviceContext(), { from, to }))
  const end = useServiceMutation(() => getServices().travel.end(serviceContext()))
  const forbidden = start.error instanceof ServiceError && start.error.code === "forbidden"
  if (isLoading) return null
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <p className="text-muted-foreground">{t("hint")}</p>
      {data ? (
        <>
          <p
            role="status"
            className="flex items-center gap-2 rounded-xl bg-secondary p-4 text-lg font-bold text-secondary-foreground"
          >
            <Plane aria-hidden className="size-6" />
            {t("active", {
              from: dates.long(fromDayKey(data.from)),
              to: dates.long(fromDayKey(data.to)),
            })}
          </p>
          <button
            type="button"
            className="btn-outline min-h-14"
            onClick={() => end.mutate(undefined)}
          >
            {t("end")}
          </button>
        </>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            start.mutate(undefined)
          }}
        >
          <DateField label={t("from")} value={from} onChange={setFrom} min={today} />
          <DateField label={t("to")} value={to} onChange={setTo} min={from} />
          {start.isError && <ErrorText>{forbidden ? t("noPermission") : t("invalid")}</ErrorText>}
          <button type="submit" className="btn-primary min-h-14 text-lg" disabled={start.isPending}>
            <Plane aria-hidden className="size-6" />
            {t("start")}
          </button>
        </form>
      )}
    </div>
  )
}
