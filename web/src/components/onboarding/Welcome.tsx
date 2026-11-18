"use client"

import { BookOpen, Lightbulb, Megaphone, Package, Siren } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Preloader } from "@/components/brand/Preloader"
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

  if (!session || !role) return <Preloader />

  async function done() {
    if (review) return router.push(roleHome(role!))
    await getServices().onboarding.markWelcomeSeen(getServiceContext())
    await refreshSession()
    await queryClient.invalidateQueries()
    router.replace(session!.needsRulesAcceptance ? "/rules-accept/" : roleHome(role!))
  }

  const number = role.kind === "resident" ? session.apartmentNumbers[role.apartmentId] : ""
  const title =
    step === 1
      ? t("welcomeTitle", { building: "Edifício Taquaretinga" })
      : step === 2
        ? t("featuresTitle")
        : t("rulesStepTitle")

  return (
    // Dicas do primeiro acesso no estilo "ilustração em cima, cartão arredondado embaixo" (pedido do usuário).
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-brand">
      <span aria-hidden className="absolute -right-20 -top-16 size-64 rounded-full bg-white/10" />
      <span aria-hidden className="absolute -left-24 top-28 size-56 rounded-full bg-white/10" />
      <div className="relative flex h-[40dvh] min-h-56 items-center justify-center pt-[env(safe-area-inset-top)]">
        {step === 1 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/mascote-branco.png"
            alt=""
            width={180}
            height={202}
            className="h-44 w-auto drop-shadow-xl"
          />
        )}
        {step === 2 && (
          <div aria-hidden className="grid grid-cols-3 gap-3">
            {FEATURES.map(({ key, icon: Icon }, i) => (
              <span
                key={key}
                className={`inline-flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary shadow-xl ${
                  i === 3 ? "col-start-1 translate-x-1/2" : i === 4 ? "translate-x-1/2" : ""
                }`}
              >
                <Icon className="size-8" />
              </span>
            ))}
          </div>
        )}
        {step === 3 && (
          <span
            aria-hidden
            className="inline-flex size-36 items-center justify-center rounded-[2rem] bg-secondary text-primary shadow-2xl"
          >
            <BookOpen className="size-20" />
          </span>
        )}
      </div>

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col gap-4 rounded-t-[2rem] bg-background px-6 pb-8 pt-6 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        <div className="flex items-center gap-3" aria-live="polite">
          <span aria-hidden className="flex gap-1.5">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${i + 1 === step ? "w-7 bg-primary" : "w-2 bg-border"}`}
              />
            ))}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            {t("step", { current: step, total })}
          </span>
        </div>

        <h1 className="text-2xl leading-tight font-extrabold">{title}</h1>

        {step === 1 && (
          <p className="text-muted-foreground">
            {t("welcomeText", { kind: residency.data ? tk(residency.data.kind) : "", number })}
          </p>
        )}
        {step === 2 && (
          <ul className="flex flex-col gap-2">
            {FEATURES.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-center gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span>{t(`features.${key}`)}</span>
              </li>
            ))}
          </ul>
        )}
        {step === 3 && <p className="text-muted-foreground">{t("rulesStepText")}</p>}

        <div className="mt-auto flex flex-col items-center gap-3 pt-4">
          <button
            type="button"
            className="btn-primary min-h-14 w-full max-w-xs rounded-full text-lg"
            onClick={() => (step < total ? setStep(step + 1) : done())}
          >
            {step < total ? t("next") : review ? t("finish") : t("start")}
          </button>
          {step < total && (
            <button
              type="button"
              onClick={done}
              className="min-h-11 px-4 font-semibold text-link underline-offset-4 hover:underline"
            >
              {t("skip")}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
