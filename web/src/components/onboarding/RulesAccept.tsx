"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { RulesList } from "@/components/rules/RulesList"
import { getServiceContext, getServices } from "@/services"
import { refreshSession, roleHome, useSession } from "@/auth/session"

/** Regras com confirmação obrigatória no primeiro acesso do morador (RF-010, RF-011). */
export function RulesAccept() {
  const t = useTranslations("rules")
  const router = useRouter()
  const queryClient = useQueryClient()
  const state = useSession()
  const session = state.status === "ready" ? state.session : null
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (state.status === "ready" && !session) router.replace("/login/")
  }, [state.status, session, router])

  if (!session?.activeRole) return null

  async function accept() {
    setBusy(true)
    await getServices().onboarding.acceptRules(getServiceContext())
    await refreshSession()
    await queryClient.invalidateQueries()
    router.replace(roleHome(session!.activeRole!))
  }

  return (
    <>
      <header className="mx-auto max-w-xl px-4 pt-6">
        <h1 className="text-2xl">{t("acceptTitle")}</h1>
        <p className="mt-1 text-muted-foreground">{t("acceptHint")}</p>
      </header>
      <main className="pb-28">
        <RulesList />
      </main>
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            className="btn-primary min-h-14 w-full text-lg"
            onClick={accept}
            disabled={busy}
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </>
  )
}
