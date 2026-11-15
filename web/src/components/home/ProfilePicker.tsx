"use client"

import { Building2, ChartColumn, ChevronRight, House } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { useHydrated } from "@/hooks/useHydrated"
import { Notice } from "@/components/layout/Notice"
import { HAS_PROFILE_PICKER } from "@/config/app-mode"
import { PROFILES_DEF } from "@/navigation/screens"
import { setPreferences, usePreferences } from "@/preferences/store"
import { PROFILES, type Profile } from "@/preferences/types"

const ICONS: Record<Profile, typeof House> = {
  resident: House,
  "front-desk": Building2,
  manager: ChartColumn,
}

/** Escolha de perfil nos modos dev e demo; "entrada em breve" no modo real (RF-004). */
export function ProfilePicker() {
  const t = useTranslations()
  const router = useRouter()
  const [prefs] = usePreferences()
  const mounted = useHydrated()

  // Com perfil já escolhido, volta direto para ele (H1-7).
  const remembered = mounted && HAS_PROFILE_PICKER ? prefs.profile : null
  useEffect(() => {
    if (remembered) router.replace(`${PROFILES_DEF[remembered].basePath}/`)
  }, [remembered, router])

  if (!HAS_PROFILE_PICKER) {
    return <Notice title={t("errors.entrySoonTitle")} text={t("errors.entrySoon")} />
  }
  if (remembered) return null

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-10">
      <Image
        src="/logo-horizontal-azul.svg"
        alt={t("common.appName")}
        width={160}
        height={50}
        priority
        className="dark:hidden"
      />
      <Image
        src="/logo-horizontal-branco.svg"
        alt={t("common.appName")}
        width={160}
        height={50}
        priority
        className="hidden dark:block"
      />
      <div>
        <h1 className="text-2xl font-extrabold">{t("profiles.chooseTitle")}</h1>
        <p className="mt-1 text-muted-foreground">{t("profiles.chooseHint")}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {PROFILES.map((profile) => {
          const Icon = ICONS[profile]
          return (
            <li key={profile}>
              <Link
                href={`${PROFILES_DEF[profile].basePath}/`}
                onClick={() => setPreferences({ profile })}
                className="flex min-h-20 items-center gap-4 rounded-2xl border border-border bg-card p-4 text-card-foreground hover:bg-muted"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Icon aria-hidden className="size-6" />
                </span>
                <span className="flex-1">
                  <span className="block text-lg font-semibold">{t(`profiles.${profile}`)}</span>
                  <span className="block text-sm text-muted-foreground">
                    {t(`profiles.${profile}Hint`)}
                  </span>
                </span>
                <ChevronRight aria-hidden className="size-5" />
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
