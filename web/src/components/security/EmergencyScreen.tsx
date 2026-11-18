"use client"

import { Check, Phone } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { ErrorText } from "@/components/comm/shared"
import { serviceContext, useContacts, useMyEmergency, useServiceMutation } from "@/hooks/data"
import { timeBrasilia } from "@/i18n/datetime"
import { getServices } from "@/services"
import type { EmergencyView } from "@/services/contracts"
import { telLink } from "@/services/dialable"
import type { EmergencyKind } from "@/services/schemas"
import { AlertHistory } from "./AlertHistory"
import { HoldButton } from "./HoldButton"

const KINDS: EmergencyKind[] = ["health", "fire", "intrusion", "leak", "other"]
export const PUBLIC_NUMBERS = [
  { key: "samu", tel: "192" },
  { key: "firefighters", tel: "193" },
  { key: "police", tel: "190" },
] as const

/** Número da portaria (contato marcado como portaria pelo síndico). */
export function useFrontDeskPhone() {
  const { data } = useContacts("")
  return data?.building.find((c) => c.frontDesk)?.phone ?? null
}

/** Botão de emergência do morador (mockup 12) e acompanhamento do alerta (mockup 13). */
export function EmergencyScreen() {
  const t = useTranslations("security")
  const { data, isLoading } = useMyEmergency()
  const [kind, setKind] = useState<EmergencyKind | null>(null)
  const raise = useServiceMutation(() =>
    getServices().emergency.raise(serviceContext(), kind ?? "unknown"),
  )

  if (isLoading || !data) return <p className="px-4 py-6 text-muted-foreground">{t("loading")}</p>
  if (data.current) return <Tracking alert={data.current} history={data.history} />

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6">
      <div className="text-center">
        <h2 className="text-3xl">{t("raise.title")}</h2>
        <p className="mt-2 text-muted-foreground">{t("raise.hint")}</p>
      </div>
      <HoldButton onComplete={() => raise.mutate(undefined)} disabled={raise.isPending} />
      {raise.isError && <ErrorText>{t("error")}</ErrorText>}
      <fieldset>
        <legend className="mb-2 font-semibold">{t("raise.what")}</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(kind === k ? null : k)}
              className="min-h-12 rounded-xl border-2 border-border bg-card px-4 font-semibold text-card-foreground aria-pressed:border-destructive aria-pressed:bg-destructive aria-pressed:text-destructive-foreground"
            >
              {t(`kind.${k}`)}
            </button>
          ))}
        </div>
      </fieldset>
      <CallDirect />
      <AlertHistory own={data.history} />
    </div>
  )
}

export function CallDirect() {
  const t = useTranslations("security")
  return (
    <section aria-labelledby="call-direct">
      <h2 id="call-direct" className="mb-2 text-lg">
        {t("call.title")}
      </h2>
      <ul className="grid grid-cols-3 gap-2">
        {PUBLIC_NUMBERS.map(({ key, tel }) => (
          <li key={key} className="min-w-0">
            <a
              href={telLink(tel)}
              className="flex h-full min-h-20 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card p-2 text-center text-sm font-semibold text-card-foreground [overflow-wrap:anywhere] hover:bg-muted"
            >
              <Phone aria-hidden className="size-6 text-destructive" />
              {t(`call.${key}`, { tel })}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Tracking({ alert, history }: { alert: EmergencyView; history: EmergencyView[] }) {
  const t = useTranslations("security")
  const frontDesk = useFrontDeskPhone()
  const [confirming, setConfirming] = useState(false)
  const cancel = useServiceMutation(() =>
    getServices().emergency.cancel(serviceContext(), alert.id),
  )
  const initials = (alert.acknowledgedBy ?? "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6">
      <section
        aria-labelledby="alert-sent"
        className="flex flex-col items-center gap-4 rounded-3xl bg-destructive p-6 text-center text-destructive-foreground"
      >
        <span className="inline-flex size-20 items-center justify-center rounded-full bg-destructive-foreground/15">
          <Check aria-hidden className="size-10" />
        </span>
        <h2 id="alert-sent" className="text-3xl">
          {t("sent.title")}
        </h2>
        <p>{t("sent.at", { time: timeBrasilia(alert.createdAt) })}</p>
        <div
          role="status"
          className="flex w-full items-center gap-3 rounded-2xl bg-destructive-foreground/15 p-4 text-left"
        >
          {alert.acknowledgedBy ? (
            <>
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-destructive-foreground font-bold text-destructive">
                {initials}
              </span>
              <span className="min-w-0 [overflow-wrap:anywhere]">
                <span className="block text-lg font-bold">
                  {t("sent.seen", { name: alert.acknowledgedBy })}
                </span>
                <span className="block text-sm">{t("sent.onTheWay")}</span>
              </span>
            </>
          ) : (
            <span className="font-semibold">{t("sent.waiting")}</span>
          )}
        </div>
        {alert.noDoormanOnDuty && <p className="font-semibold">{t("sent.noDoorman")}</p>}
        <div className="flex w-full flex-col gap-3">
          {frontDesk && (
            <a
              href={telLink(frontDesk)}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-destructive-foreground px-4 text-lg font-bold text-destructive"
            >
              <Phone aria-hidden className="size-5" />
              {t("sent.callDesk")}
            </a>
          )}
          <a
            href={telLink("192")}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-destructive-foreground/70 px-4 text-lg font-bold"
          >
            <Phone aria-hidden className="size-5" />
            {t("sent.callSamu")}
          </a>
          {alert.canCancel &&
            (confirming ? (
              <div className="flex flex-col gap-2 rounded-xl bg-destructive-foreground/15 p-3">
                <p className="font-semibold">{t("sent.confirmCancel")}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="min-h-12 rounded-xl border-2 border-destructive-foreground/70 font-semibold"
                  >
                    {t("sent.keep")}
                  </button>
                  <button
                    type="button"
                    onClick={() => cancel.mutate(undefined)}
                    disabled={cancel.isPending}
                    className="min-h-12 rounded-xl bg-destructive-foreground font-bold text-destructive"
                  >
                    {t("sent.yesCancel")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="min-h-12 font-semibold underline underline-offset-4"
              >
                {t("sent.cancel")}
              </button>
            ))}
          {cancel.isError && <p role="alert">{t("error")}</p>}
        </div>
      </section>
      <AlertHistory own={history} />
    </div>
  )
}
