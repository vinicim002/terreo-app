"use client"

import { BookOpen, Lightbulb, Megaphone, Package, Siren } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { useResidency } from "@/hooks/data"
import { getServiceContext, getServices } from "@/services"
import { refreshSession, roleHome, useSession } from "@/auth/session"

const FEATURES = [
  { key: "notices", icon: Megaphone },
  { key: "deliveries", icon: Package },
  { key: "suggestions", icon: Lightbulb },
  { key: "emergency", icon: Siren },
  { key: "rules", icon: BookOpen },
] as const

/**
 * Boas-vindas do morador (História 2): 3 passos, com "Pular". No primeiro acesso, termina nas regras;
 * revendo pelo menu (`review`), só fecha.
 */
export function Welcome({ review = false }: { review?: boolean }) {
  const t = useTranslations("onboarding")
  const tk = useTranslations("kinds")
  const router = useRouter()
  const queryClient = useQueryClient()
  const state = useSession()
  const session = state.status === "ready" ? state.session : null
  const role = session?.activeRole
  const residency = useResidency(role?.kind === "resident" ? role.residencyId : undefined)
  const [step, setStep] = useState(1)
  const total = 3

  useEffect(() => {
    if (state.status === "ready" && !session) router.replace("/login/")
  }, [state.status, session, router])

  if (!session || !role) return null

  async function done() {
    if (review) return router.push(roleHome(role!))
    await getServices().onboarding.markWelcomeSeen(getServiceContext())
    await refreshSession()
    await queryClient.invalidateQueries()
    router.replace(session!.needsRulesAcceptance ? "/rules-accept/" : roleHome(role!))
  }

  const number = role.kind === "resident" ? session.apartmentNumbers[role.apartmentId] : ""
  return (
    <AuthLayout title={t("welcomeTitle", { building: "Edifício Taquaretinga" })}>
      <p className="text-center text-sm font-semibold text-muted-foreground" aria-live="polite">
        {t("step", { current: step, total })}
      </p>
      {step === 1 && (
        // Mascote colorido sobre o creme, como pede o kit da marca para telas grandes.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/mascote-colorido.svg"
          alt=""
          width={200}
          height={160}
          className="mx-auto h-40 w-auto rounded-2xl bg-secondary p-4"
        />
      )}
      {step === 1 && (
        <p className="text-center text-lg">
          {t("welcomeText", { kind: residency.data ? tk(residency.data.kind) : "", number })}
        </p>
      )}
      {step === 2 && (
        <section aria-labelledby="features" className="flex flex-col gap-3">
          <h2 id="features" className="text-xl">
            {t("featuresTitle")}
          </h2>
          <ul className="flex flex-col gap-3">
            {FEATURES.map(({ key, icon: Icon }) => (
              <li
                key={key}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground">
                  <Icon aria-hidden className="size-5" />
                </span>
                {t(`features.${key}`)}
              </li>
            ))}
          </ul>
        </section>
      )}
      {step === 3 && (
        <section className="flex flex-col gap-2 text-center">
          <h2 className="text-xl">{t("rulesStepTitle")}</h2>
          <p>{t("rulesStepText")}</p>
        </section>
      )}
      <div className="flex flex-col gap-2">
        {step < total ? (
          <button
            type="button"
            className="btn-primary min-h-14 text-lg"
            onClick={() => setStep(step + 1)}
          >
            {t("next")}
          </button>
        ) : (
          <button type="button" className="btn-primary min-h-14 text-lg" onClick={done}>
            {review ? t("finish") : t("start")}
          </button>
        )}
        {step < total && (
          <button type="button" className="btn-outline" onClick={done}>
            {t("skip")}
          </button>
        )}
      </div>
    </AuthLayout>
  )
}
