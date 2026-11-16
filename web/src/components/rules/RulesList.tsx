"use client"

import { Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useRules } from "@/hooks/data"

/** Regras do condomínio agrupadas por tema, com busca (RF-012). */
export function RulesList() {
  const t = useTranslations("rules")
  const [search, setSearch] = useState("")
  const { data } = useRules(search)

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <label className="relative block">
        <span className="sr-only">{t("search")}</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          className="min-h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-card-foreground"
        />
      </label>
      {data && data.length === 0 && <p className="text-muted-foreground">{t("empty")}</p>}
      {data?.map((group) => (
        <section
          key={group.topic}
          aria-labelledby={`topic-${group.topic}`}
          className="flex flex-col gap-2"
        >
          <h2 id={`topic-${group.topic}`} className="text-lg">
            {t(`topics.${group.topic}`)}
          </h2>
          <ul className="flex flex-col gap-2">
            {group.rules.map((rule) => (
              <li
                key={rule.id}
                className="rounded-xl border border-border bg-card p-4 text-card-foreground"
              >
                <h3 className="font-semibold">{rule.title}</h3>
                <p className="mt-1 text-sm leading-relaxed">{rule.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
