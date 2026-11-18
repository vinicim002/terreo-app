"use client"

import { Plane } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useDeskOverview } from "@/hooks/data"

/** Entregas da portaria (mockup 31): apartamentos por andar com marcas de códigos, na portaria e viagem. */
export function ApartmentGrid() {
  const t = useTranslations("fd.desk")
  const { data } = useDeskOverview()
  const [search, setSearch] = useState("")
  const list = data?.apartments.filter((a) => a.number.startsWith(search)) ?? []
  const floors = [...new Set(list.map((a) => a.floor))].sort((a, b) => b - a)
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <input
        type="search"
        inputMode="numeric"
        aria-label={t("search")}
        placeholder={t("search")}
        value={search}
        onChange={(e) => setSearch(e.target.value.replace(/\D/g, ""))}
        className="min-h-14 rounded-xl border border-input bg-card px-4 text-xl text-card-foreground"
      />
      {floors.map((floor) => (
        <ul key={floor} className="grid grid-cols-4 gap-2">
          {list
            .filter((a) => a.floor === floor)
            .map((a) => {
              const busy = a.awaiting + a.atDesk > 0
              const parts = [
                a.awaiting ? t("codes", { count: a.awaiting }) : null,
                a.atDesk ? t("packages", { count: a.atDesk }) : null,
                a.travelUntil
                  ? t("travel", { date: a.travelUntil.split("-").reverse().slice(0, 2).join("/") })
                  : null,
              ].filter(Boolean)
              return (
                <li key={a.number}>
                  <Link
                    href={`/front-desk/apartment/?n=${a.number}`}
                    className={`relative flex min-h-16 flex-col items-center justify-center rounded-xl border-2 text-lg font-extrabold ${
                      busy
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border bg-card text-card-foreground"
                    }`}
                  >
                    {a.number}
                    {parts.length > 0 && <span className="sr-only">, {parts.join(", ")}</span>}
                    <span aria-hidden className="flex gap-1 text-xs font-bold">
                      {a.awaiting > 0 && <span>{a.awaiting}🔑</span>}
                      {a.atDesk > 0 && <span>{a.atDesk}📦</span>}
                      {a.travelUntil && <Plane className="size-3.5" />}
                    </span>
                  </Link>
                </li>
              )
            })}
        </ul>
      ))}
    </div>
  )
}
