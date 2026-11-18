"use client"

import { Preloader } from "@/components/brand/Preloader"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, type ReactNode } from "react"
import { Notice } from "@/components/layout/Notice"
import { HAS_PROFILE_PICKER } from "@/config/app-mode"
import { useHydrated } from "@/hooks/useHydrated"
import type { Profile } from "@/preferences/types"
import { roleHome, useSession } from "./session"

export const AFTER_LOGIN_KEY = "terreo:after-login"

const ROLE_PROFILE: Record<string, Profile> = {
  resident: "resident",
  "front-desk": "front-desk",
  manager: "manager",
}

/**
 * Guarda de acesso (contracts/rotas.md da spec 002), no lugar da escolha de perfil da spec 001:
 * sem sessão → entrada; vários papéis → escolher; morador no primeiro acesso → boas-vindas e regras;
 * prefixo de outro papel → aviso; versão real → "Entrada em breve" até a Etapa 3.
 */
export function AccessGuard({ profile, children }: { profile: Profile; children: ReactNode }) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const hydrated = useHydrated()
  const state = useSession()
  const session = state.status === "ready" ? state.session : null

  const redirect =
    !hydrated || state.status === "loading" || !HAS_PROFILE_PICKER
      ? null
      : !session
        ? "/login/"
        : !session.activeRole
          ? "/choose-role/"
          : session.needsWelcome
            ? "/welcome/"
            : session.needsRulesAcceptance
              ? "/rules-accept/"
              : null

  useEffect(() => {
    if (!redirect) return
    if (redirect === "/login/") {
      try {
        sessionStorage.setItem(AFTER_LOGIN_KEY, pathname)
      } catch {}
    }
    router.replace(redirect)
  }, [redirect, router, pathname])

  if (!HAS_PROFILE_PICKER) {
    return <Notice title={t("errors.entrySoonTitle")} text={t("errors.entrySoon")} />
  }
  if (!hydrated || state.status === "loading" || redirect) return <Preloader />
  const active = session!.activeRole!
  if (ROLE_PROFILE[active.kind] !== profile) {
    return (
      <Notice
        title={t("errors.otherProfileTitle")}
        text={t("errors.otherProfile", { profile: t(`profiles.${ROLE_PROFILE[active.kind]}`) })}
        action={
          <Link href={roleHome(active)} className="btn-primary">
            {t("common.backHome")}
          </Link>
        }
      />
    )
  }
  return children
}
