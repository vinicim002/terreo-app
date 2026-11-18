"use client"

import { Check, ChevronDown, LogIn, ShieldCheck } from "lucide-react"
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

      <DemoAccounts
        disabled={!hydrated || busy || !online}
        onEnter={(phone) => {
          const next = { country: "BR" as const, text: formatPhone(phone) }
          setValue(next)
          void send(next)
        }}
      />
    </AuthLayout>
  )
}

type Account = (typeof EXAMPLE_ACCOUNTS)[number]

/**
 * Contas de exemplo (só desenvolvimento e demonstração): mostra uma conta escolhida; tocar nela abre as outras, e
 * "Entrar como…" entra com o código simulado.
 */
function DemoAccounts({
  disabled,
  onEnter,
}: {
  disabled: boolean
  onEnter: (phone: string) => void
}) {
  const t = useTranslations("auth")
  const [selected, setSelected] = useState<Account["key"]>("responsible")
  const [open, setOpen] = useState(false)
  const current = EXAMPLE_ACCOUNTS.find((a) => a.key === selected)!
  const initials = (name?: string) =>
    (name ?? "?")
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")

  return (
    <section
      aria-labelledby="examples"
      className="flex flex-col gap-2 rounded-2xl border border-dashed border-border p-4"
    >
      <h2
        id="examples"
        className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {t("examples")}
      </h2>
      <p className="text-sm text-muted-foreground">{t("examplesHint")}</p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="example-list"
        onClick={() => setOpen((o) => !o)}
        className={`flex min-h-16 w-full items-center gap-3 rounded-xl border bg-card px-3 text-left text-card-foreground ${
          open ? "border-primary ring-2 ring-ring" : "border-border"
        }`}
      >
        <span
          aria-hidden
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary font-extrabold text-secondary-foreground"
        >
          {initials(current.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t(`accounts.${current.key}`)}</span>
          <span className="sr-only"> — {t("switchAccount")}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {current.name} · {formatPhone(current.phone)}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={`size-5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          id="example-list"
          className="flex flex-col gap-1 rounded-xl border border-border bg-card p-1"
        >
          {EXAMPLE_ACCOUNTS.map((a) => (
            <li key={a.key}>
              <button
                type="button"
                aria-pressed={a.key === selected}
                onClick={() => {
                  setSelected(a.key)
                  setOpen(false)
                }}
                className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left ${
                  a.key === selected
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <span className="flex-1">
                  {t(`accounts.${a.key}`)}
                  <span className="block text-sm font-normal text-muted-foreground">{a.name}</span>
                </span>
                {a.key === selected && <Check aria-hidden className="size-5 text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="btn-outline min-h-12"
        disabled={disabled}
        onClick={() => onEnter(current.phone)}
      >
        <LogIn aria-hidden className="size-5" />
        {t("enterAs")}
      </button>
    </section>
  )
}
