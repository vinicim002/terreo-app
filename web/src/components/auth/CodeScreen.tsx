"use client"

import { MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState, type FormEvent } from "react"
import { HAS_PROFILE_PICKER } from "@/config/app-mode"
import { useOnline } from "@/hooks/useOnline"
import { formatPhone } from "@/phone/phone"
import { getServices, ServiceError } from "@/services"
import type { OutboxMessage } from "@/services/schemas"
import {
  clearPendingLogin,
  readPendingLogin,
  savePendingLogin,
  takeAfterLogin,
  type PendingLogin,
} from "@/auth/login-state"
import { applySession, getDeviceId, roleHome } from "@/auth/session"
import { AuthLayout } from "./AuthLayout"

/** Confirmação do código de 6 dígitos (História 1 da spec 002). */
export function CodeScreen() {
  const t = useTranslations("auth")
  const router = useRouter()
  const online = useOnline()
  const [pending, setPending] = useState<PendingLogin | null>(null)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [message, setMessage] = useState<OutboxMessage | null>(null)

  useEffect(() => {
    const value = readPendingLogin()
    if (!value) {
      router.replace("/login/")
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o sessionStorage só no navegador
    setPending(value)
  }, [router])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  // Envio simulado (RF-008): mostra a mensagem "recebida" no WhatsApp, só em dev e demo.
  useEffect(() => {
    if (!pending || !HAS_PROFILE_PICKER) return
    void getServices().outbox?.latestTo(pending.phone).then(setMessage)
  }, [pending])

  if (!pending) return null
  const wait = Math.max(0, Math.ceil((new Date(pending.resendAt).getTime() - now) / 1000))

  async function confirm(e: FormEvent) {
    e.preventDefault()
    if (!pending) return
    setError(undefined)
    if (!online) return setError(t("offline"))
    setBusy(true)
    try {
      const result = await getServices().auth.verifyCode(pending.phone, code, getDeviceId())
      if (result.status === "wrong") {
        setError(
          result.attemptsLeft > 0 ? t("wrong", { count: result.attemptsLeft }) : t("expired"),
        )
        return
      }
      if (result.status === "expired") return setError(t("expired"))
      clearPendingLogin()
      applySession(result.session)
      const role = result.session.activeRole
      router.replace(role ? takeAfterLogin(roleHome(role)) : "/choose-role/")
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    if (!pending) return
    setError(undefined)
    if (!online) return setError(t("offline"))
    try {
      const result = await getServices().auth.requestCode(pending.phone)
      if (result.status === "sent") {
        const next = { phone: result.phone, resendAt: result.resendAt }
        savePendingLogin(next)
        setPending(next)
        setCode("")
      }
    } catch (e) {
      setError(
        e instanceof ServiceError && e.code === "rate_limited" ? t("rateLimited") : t("expired"),
      )
    }
  }

  const mm = Math.floor(wait / 60)
  const ss = String(wait % 60).padStart(2, "0")

  return (
    <AuthLayout
      title={t("codeTitle")}
      subtitle={t("codeHint", { phone: formatPhone(pending.phone) })}
    >
      <form onSubmit={confirm} className="flex flex-col gap-4">
        <label htmlFor="otp" className="text-sm font-semibold">
          {t("codeLabel")}
        </label>
        <input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          aria-invalid={!!error}
          aria-describedby={error ? "otp-error" : undefined}
          className="min-h-16 rounded-xl border border-input bg-card text-center font-mono text-3xl tracking-[0.5em] text-card-foreground"
        />
        {error && (
          <p id="otp-error" role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="btn-primary min-h-14 text-lg"
          disabled={busy || code.length !== 6 || !online}
        >
          {t("confirm")}
        </button>
        {!online && (
          <p role="status" className="text-center text-sm font-medium text-warning">
            {t("offline")}
          </p>
        )}
        <div className="flex flex-wrap justify-between gap-2">
          <button type="button" className="btn-outline" onClick={resend} disabled={wait > 0}>
            {wait > 0 ? t("resendIn", { time: `${mm}:${ss}` }) : t("resend")}
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              clearPendingLogin()
              router.replace("/login/")
            }}
          >
            {t("changeNumber")}
          </button>
        </div>
      </form>

      {message && (
        <aside
          aria-label={t("simulated")}
          className="flex gap-3 rounded-xl border-2 border-dashed border-border bg-card p-4"
        >
          <MessageCircle aria-hidden className="size-6 shrink-0 text-link" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("simulated")}
            </p>
            <p className="mt-1 text-card-foreground" data-testid="simulated-message">
              {message.body}
            </p>
          </div>
        </aside>
      )}
    </AuthLayout>
  )
}
