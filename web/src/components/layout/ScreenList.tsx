"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { PROFILES_DEF, hubGroups, screenHref } from "@/navigation/screens"
import type { Profile } from "@/preferences/types"

/** Lista agrupada de "Mais" e "Todos os serviços". Na portaria, botões maiores (RF-010). */
export function ScreenList({ profile }: { profile: Profile }) {
  const t = useTranslations()
  const def = PROFILES_DEF[profile]
  const big = profile === "front-desk"
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-4">
      {hubGroups(profile).map(({ group, screens }) => (
        <section key={group} aria-labelledby={`group-${group}`}>
          <h2
            id={`group-${group}`}
            className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {t(`groups.${group}`)}
          </h2>
          <ul
            className={
              // Colunas pelo tamanho em rem: com letra maior, cabem menos colunas (RF-016).
              big
                ? "grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3"
                : "grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2"
            }
          >
            {screens.map((screen) => {
              const Icon = screen.icon
              return (
                <li key={screen.slug}>
                  <Link
                    href={screenHref(def, screen)}
                    className={`flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center font-medium text-card-foreground hover:bg-muted ${
                      big ? "min-h-28 text-base" : "min-h-24 text-sm"
                    }`}
                  >
                    {/* Ícone no quadrado azul da marca, com branco (kit da marca). */}
                    <span
                      className={`inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground ${
                        big ? "size-14" : "size-10"
                      }`}
                    >
                      <Icon aria-hidden className={big ? "size-8" : "size-5"} />
                    </span>
                    <span className="min-w-0 break-words hyphens-auto leading-tight">
                      {t(`screens.${screen.slug}`)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
