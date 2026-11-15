"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, type ReactNode } from "react"
import { useHydrated } from "@/hooks/useHydrated"
import { HAS_PROFILE_PICKER } from "@/config/app-mode"
import { PROFILES_DEF } from "@/navigation/screens"
import { usePreferences } from "@/preferences/store"
import type { Profile } from "@/preferences/types"
import { Notice } from "@/components/layout/Notice"

/**
 * Confere o perfil escolhido (contracts/rotas.md, regras 1 a 3):
 * sem perfil → escolha de perfil; perfil diferente → aviso; modo real → entrada em breve.
 */
export function ProfileGuard({ profile, children }: { profile: Profile; children: ReactNode }) {
  const t = useTranslations()
  const router = useRouter()
  const [prefs] = usePreferences()
  // Até hidratar, as preferências ainda são os padrões do build estático.
  const mounted = useHydrated()

  const missing = mounted && HAS_PROFILE_PICKER && prefs.profile === null
  useEffect(() => {
    if (missing) router.replace("/")
  }, [missing, router])

  if (!HAS_PROFILE_PICKER) {
    return <Notice title={t("errors.entrySoonTitle")} text={t("errors.entrySoon")} />
  }
  if (!mounted || missing) return null
  if (prefs.profile !== profile) {
    const current = prefs.profile as Profile
    return (
      <Notice
        title={t("errors.otherProfileTitle")}
        text={t("errors.otherProfile", { profile: t(`profiles.${current}`) })}
        action={
          <Link href={`${PROFILES_DEF[current].basePath}/`} className="btn-primary">
            {t("common.backHome")}
          </Link>
        }
      />
    )
  }
  return children
}
