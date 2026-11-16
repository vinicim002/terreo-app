"use client"

import { Car } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { ScreenPage } from "@/components/layout/ScreenPage"
import { Avatar } from "@/components/profile/Avatar"
import { formatPlate } from "@/domain/plate"
import { useApartments, useDirectory } from "@/hooks/data"

/**
 * Consulta da portaria (RF-029a): grade de apartamentos com busca e, do escolhido, só nome, foto, tipo e
 * carros. Botões grandes (RF-010 da spec 001).
 */
export function DirectoryScreen() {
  const t = useTranslations("directory")
  const tk = useTranslations("kindLabels")
  const apartments = useApartments()
  const [search, setSearch] = useState("")
  const [number, setNumber] = useState<string>()
  const entry = useDirectory(number)
  const list = apartments.data?.filter((a) => a.number.startsWith(search.trim())) ?? []

  return (
    <ScreenPage profile="front-desk" slug="residents">
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
        <p className="text-muted-foreground">{t("hint")}</p>
        <input
          type="search"
          inputMode="numeric"
          aria-label={t("search")}
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value.replace(/\D/g, ""))}
          className="min-h-14 rounded-xl border border-input bg-card px-4 text-xl text-card-foreground"
        />
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
          {list.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                aria-pressed={number === a.number}
                onClick={() => setNumber(a.number)}
                className={`min-h-14 w-full rounded-xl border text-lg font-extrabold ${
                  number === a.number
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-card-foreground"
                }`}
              >
                {a.number}
              </button>
            </li>
          ))}
        </ul>
        {!number && <p className="text-muted-foreground">{t("choose")}</p>}
        {entry.data && (
          <section
            aria-labelledby="dir-apt"
            className="flex flex-col gap-3 rounded-2xl border-2 border-primary bg-card p-4 text-card-foreground"
          >
            <h2 id="dir-apt" className="text-2xl">
              {entry.data.number}
            </h2>
            <h3 className="font-semibold">{t("people")}</h3>
            {entry.data.people.length === 0 && (
              <p className="text-muted-foreground">{t("noPeople")}</p>
            )}
            <ul className="flex flex-col gap-2">
              {entry.data.people.map((p, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Avatar name={p.name} photo={p.photo} />
                  <span>
                    <span className="block font-semibold">{p.name}</span>
                    <span className="block text-sm text-muted-foreground">{tk(p.kind)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <h3 className="font-semibold">{t("cars")}</h3>
            {entry.data.vehicles.length === 0 && (
              <p className="text-muted-foreground">{t("noCars")}</p>
            )}
            {entry.data.vehicles.map((v) => (
              <p key={v.plate} className="flex items-center gap-2">
                <Car aria-hidden className="size-5 text-link" />
                {v.model} {v.color.toLowerCase()} ·{" "}
                <span className="font-mono">{formatPlate(v.plate)}</span>
              </p>
            ))}
          </section>
        )}
      </div>
    </ScreenPage>
  )
}
