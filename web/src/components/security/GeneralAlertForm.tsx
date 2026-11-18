"use client"

import { BellRing, Flame, ShieldAlert, Wind, Zap, type LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { ErrorText } from "@/components/comm/shared"
import { DictateButton } from "@/voice/DictateButton"
import { serviceContext, useGeneralAlert, useServiceMutation } from "@/hooks/data"
import { timeBrasilia } from "@/i18n/datetime"
import { getServices } from "@/services"
import type { GeneralAlertKind } from "@/services/schemas"
import { AlertHistory } from "./AlertHistory"

const KINDS: { kind: GeneralAlertKind; icon: LucideIcon }[] = [
  { kind: "fire", icon: Flame },
  { kind: "gas", icon: Wind },
  { kind: "power", icon: Zap },
  { kind: "security", icon: ShieldAlert },
  { kind: "other", icon: BellRing },
]

/**
 * Alerta geral da portaria e do síndico (História 2): tipo em botões grandes, mensagens prontas, ditar e confirmar
 * antes de enviar. Com um em aberto, mostra o alerta e "Encerrar".
 */
export function GeneralAlertForm() {
  const t = useTranslations("security.general")
  const tk = useTranslations("security")
  const { data: current, isLoading } = useGeneralAlert()
  const [kind, setKind] = useState<GeneralAlertKind>("fire")
  const [message, setMessage] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [closing, setClosing] = useState("")
  const send = useServiceMutation(() =>
    getServices().generalAlert.send(serviceContext(), { kind, message }),
  )
  const close = useServiceMutation(() =>
    getServices().generalAlert.close(serviceContext(), current!.id, closing.trim() || null),
  )
  const ready = Object.values(t.raw(`ready.${kind}`) as Record<string, string>)
  const valid = message.trim().length >= 5 && message.trim().length <= 280

  if (isLoading) return <p className="px-4 py-6 text-muted-foreground">{tk("loading")}</p>

  if (current)
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-6">
        <section
          aria-labelledby="open-alert"
          className="flex flex-col gap-2 rounded-2xl bg-destructive p-4 text-destructive-foreground"
        >
          <h2 id="open-alert" className="text-xl">
            {t("openTitle", { kind: tk(`generalKind.${current.kind}`) })}
          </h2>
          <p className="text-lg [overflow-wrap:anywhere]">{current.message}</p>
          <p className="text-sm">
            {t("by", { name: current.createdBy, time: timeBrasilia(current.createdAt) })}
          </p>
        </section>
        {current.canClose ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              close.mutate(undefined, { onSuccess: () => setClosing("") })
            }}
          >
            <label htmlFor="closing" className="font-semibold">
              {t("closingLabel")}
            </label>
            <textarea
              id="closing"
              rows={2}
              maxLength={280}
              value={closing}
              placeholder={t("closingPlaceholder")}
              onChange={(e) => setClosing(e.target.value)}
              className="rounded-xl border-2 border-input bg-card px-4 py-3 text-lg text-card-foreground"
            />
            <DictateButton value={closing} onChange={setClosing} />
            {close.isError && <ErrorText>{tk("error")}</ErrorText>}
            <button
              type="submit"
              className="btn-primary min-h-14 text-lg"
              disabled={close.isPending}
            >
              {t("close")}
            </button>
          </form>
        ) : (
          <p className="text-muted-foreground">{t("onlySender")}</p>
        )}
        <AlertHistory />
      </div>
    )

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-6">
      <p className="text-muted-foreground">{t("hint")}</p>
      {send.isSuccess && (
        <p role="status" className="font-semibold">
          {t("sent")}
        </p>
      )}
      <fieldset>
        <legend className="mb-2 font-semibold">{t("kindLabel")}</legend>
        <div className="grid auto-rows-fr grid-cols-2 gap-2 min-[480px]:grid-cols-3">
          {KINDS.map(({ kind: k, icon: Icon }) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => {
                setKind(k)
                setConfirming(false)
              }}
              className="flex min-h-20 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-border bg-card p-2 text-center font-bold text-card-foreground [overflow-wrap:anywhere] aria-pressed:border-destructive aria-pressed:bg-destructive aria-pressed:text-destructive-foreground"
            >
              <Icon aria-hidden className="size-6" />
              {tk(`generalKind.${k}`)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">{t("readyLabel")}</legend>
        <ul className="flex flex-col gap-2">
          {ready.map((text) => (
            <li key={text}>
              <button
                type="button"
                onClick={() => {
                  setMessage(text)
                  setConfirming(false)
                }}
                className="min-h-12 w-full rounded-xl border border-border bg-card px-4 py-2 text-left text-card-foreground hover:bg-muted"
              >
                {text}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>
      <label htmlFor="general-message" className="font-semibold">
        {t("messageLabel")}
      </label>
      <textarea
        id="general-message"
        rows={3}
        maxLength={280}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value)
          setConfirming(false)
        }}
        className="rounded-xl border-2 border-input bg-card px-4 py-3 text-lg text-card-foreground"
      />
      <p className="text-right text-sm text-muted-foreground">{message.length}/280</p>
      <DictateButton value={message} onChange={setMessage} mode="replace" />
      {send.isError && <ErrorText>{tk("error")}</ErrorText>}
      {confirming ? (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-destructive p-3">
          <p className="font-bold">{t("confirm")}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn-outline min-h-14"
              onClick={() => setConfirming(false)}
            >
              {t("back")}
            </button>
            <button
              type="button"
              disabled={send.isPending}
              onClick={() =>
                send.mutate(undefined, {
                  onSuccess: () => {
                    setMessage("")
                    setConfirming(false)
                  },
                })
              }
              className="min-h-14 rounded-xl bg-destructive px-4 text-lg font-bold text-destructive-foreground"
            >
              {t("sendNow")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={!valid}
          onClick={() => setConfirming(true)}
          className="min-h-14 rounded-xl bg-destructive px-4 text-lg font-bold text-destructive-foreground disabled:opacity-50"
        >
          {t("send")}
        </button>
      )}
      <AlertHistory />
    </div>
  )
}
