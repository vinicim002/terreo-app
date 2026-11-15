"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { PROFILES_DEF, findScreen, screenHref, titleKey } from "@/navigation/screens"
import type { Profile } from "@/preferences/types"

/** Rótulo curto da barra: o início usa o nome curto do perfil (ex.: "Painel"). */
const SHORT_HOME: Record<Profile, string> = {
  resident: "home.resident",
  "front-desk": "home.front-desk",
  manager: "nav.dashboard",
}

export function BottomNav({ profile }: { profile: Profile }) {
  const t = useTranslations()
  const pathname = usePathname()
  const def = PROFILES_DEF[profile]
  const items = def.nav.map((slug) => {
    const screen = findScreen(profile, slug)!
    return { slug, screen, href: screenHref(def, screen) }
  })
  // Seção ativa = a de prefixo mais longo que casa com a rota (contracts/rotas.md, regra 4).
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`
  const active = items
    .filter((i) => normalized.startsWith(i.href))
    .sort((a, b) => b.href.length - a.href.length)[0]

  return (
    <nav
      aria-label={t("nav.main")}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-nav pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {items.map(({ slug, screen, href }) => {
          const Icon = screen.icon
          const isActive = active?.href === href
          const label =
            slug === "" ? t(SHORT_HOME[profile]) : t(`screens.${titleKey(profile, slug)}`)
          return (
            <li key={slug}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`m-1 flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-center text-xs leading-tight ${
                  isActive
                    ? "bg-nav-pill font-bold text-nav-active"
                    : "font-medium text-nav-foreground"
                }`}
              >
                <Icon aria-hidden className="size-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className="line-clamp-2 break-words">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
