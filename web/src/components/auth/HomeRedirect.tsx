"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { Notice } from "@/components/layout/Notice"
import { HAS_PROFILE_PICKER } from "@/config/app-mode"
import { roleHome, useSession } from "@/auth/session"

/** Página inicial: sem sessão → entrada; com sessão → início do papel (contracts/rotas.md da 002). */
export function HomeRedirect() {
  const t = useTranslations("errors")
  const router = useRouter()
  const state = useSession()

  useEffect(() => {
    if (!HAS_PROFILE_PICKER || state.status !== "ready") return
    const session = state.session
    router.replace(
      !session ? "/login/" : session.activeRole ? roleHome(session.activeRole) : "/choose-role/",
    )
  }, [state, router])

  if (!HAS_PROFILE_PICKER) return <Notice title={t("entrySoonTitle")} text={t("entrySoon")} />
  return null
}
