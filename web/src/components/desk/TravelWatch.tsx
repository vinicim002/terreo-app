"use client"

import { Plane } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Empty, useDates } from "@/components/comm/shared"
import { fromDayKey } from "@/i18n/datetime"
import { useActiveTravel } from "@/hooks/data"

/** Apartamentos em viagem, para a portaria (História 5). */
export function TravelWatch() {
  const t = useTranslations("fd.travel")
  const dates = useDates()
  const { data } = useActiveTravel()
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-2 px-4 py-4">
      {data?.length === 0 && <Empty>{t("watchEmpty")}</Empty>}
      <ul className="flex flex-col gap-2">
        {data?.map((x) => (
          <li key={x.apartment}>
            <Link
              href={`/front-desk/apartment/?n=${x.apartment}`}
              className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground"
            >
              <Plane aria-hidden className="size-6" />
              <span className="text-2xl font-extrabold">{x.apartment}</span>
              <span className="text-muted-foreground">
                {t("until", { date: dates.long(fromDayKey(x.to)) })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
