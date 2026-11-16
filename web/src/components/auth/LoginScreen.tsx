"use client"

import { ChevronRight, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState, type FormEvent } from "react"
import { Notice } from "@/components/layout/Notice"
import { HAS_PROFILE_PICKER } from "@/config/app-mode"
import { useHydrated } from "@/hooks/useHydrated"
import { useOnline } from "@/hooks/useOnline"
import { PhoneInput, type PhoneValue } from "@/phone/PhoneInput"
import { formatPhone, normalizePhone } from "@/phone/phone"
import { getServices, ServiceError } from "@/services"
import { EXAMPLE_ACCOUNTS } from "@/services/local/seed"
import { savePendingLogin } from "@/auth/login-state"
import { roleHome, useSession } from "@/auth/session"
import { AuthLayout } from "./AuthLayout"
import { WhatsAppIcon } from "./WhatsAppIcon"

/** Entrada com o celular (História 1 da spec 002). */
export function LoginScreen() {
  const t = useTranslations("auth")
  const tp = useTranslations("phone")
  const tc = useTranslations()
  const router = useRouter()
  const online = useOnline()
  // Até a página assumir no navegador, o que for digitado seria perdido: campo e botões esperam.
  const hydrated = useHydrated()
  const state = useSession()
  const [value, setValue] = useState<PhoneValue>({ country: "BR", text: "" })
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  // Já conectado: vai direto para o app.
  const session = state.status === "ready" ? state.session : null
  useEffect(() => {
    if (session) router.replace(session.activeRole ? roleHome(session.activeRole) : "/choose-role/")
  }, [session, router])

  if (!HAS_PROFILE_PICKER) {
    return <Notice title={tc("errors.entrySoonTitle")} text={tc("errors.entrySoon")} />
  }
  if (session) return null

  async function send(phoneValue: PhoneValue) {
    setError(undefined)
    if (!online) return setError(t("offline"))
    const normalized = normalizePhone(phoneValue.text, phoneValue.country)
    if (!normalized.ok) return setError(tp(normalized.reason))
    setBusy(true)
    try {
      const result = await getServices().auth.requestCode(normalized.e164)
      if (result.status === "unknown") return setError(t("unknown"))
      savePendingLogin({ phone: result.phone, resendAt: result.resendAt })
      router.push("/login/code/")
    } catch (e) {
      // Pediu de novo antes de 1 minuto: o código anterior continua valendo.
      if (e instanceof ServiceError && e.code === "rate_limited" && e.details?.resendAt) {
        savePendingLogin({ phone: normalized.e164, resendAt: e.details.resendAt })
        router.push("/login/code/")
      } else if (e instanceof ServiceError && e.code === "rate_limited") setError(t("rateLimited"))
      else setError(tp("invalid"))
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(value)
  }

  return (
    <AuthLayout title={t("title")} subtitle={t("subtitle")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <PhoneInput
          label={t("phoneLabel")}
          value={value}
          onChange={setValue}
          error={error}
          autoFocus
          disabled={!hydrated}
        />
        <button
          type="submit"
          className="btn-primary min-h-14 text-lg"
          disabled={!hydrated || busy || !online}
        >
          <WhatsAppIcon className="size-6" />
          {t("send")}
        </button>
        {!online && (
          <p role="status" className="text-center text-sm font-medium text-warning">
            {t("offline")}
          </p>
        )}
        <p className="flex gap-3 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
          <ShieldCheck aria-hidden className="size-5 shrink-0" />
          {t("noPassword")}
        </p>
      </form>

      <section aria-labelledby="examples" className="flex flex-col gap-2">
        <h2
          id="examples"
          className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {t("examples")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("examplesHint")}</p>
        <ul className="flex flex-col gap-2">
          {EXAMPLE_ACCOUNTS.map((account) => (
            <li key={account.key}>
              <button
                type="button"
                disabled={!hydrated || busy || !online}
                onClick={() => {
                  const next = { country: "BR" as const, text: formatPhone(account.phone) }
                  setValue(next)
                  void send(next)
                }}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-card px-4 text-left text-card-foreground hover:bg-muted"
              >
                <span className="flex-1">
                  <span className="block font-semibold">{t(`accounts.${account.key}`)}</span>
                  <span className="block text-sm text-muted-foreground">
                    {account.name} · {formatPhone(account.phone)}
                  </span>
                </span>
                <ChevronRight aria-hidden className="size-5" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </AuthLayout>
  )
}
