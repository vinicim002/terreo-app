"use client"

import { Check, Phone, TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { DictateButton } from "@/voice/DictateButton"
import { serviceContext, useServiceMutation } from "@/hooks/data"
import { getServices } from "@/services"
import type { EmergencyView } from "@/services/contracts"
import { displayPhone, telLink } from "@/services/dialable"
import { alarm } from "./alarm"
import { elapsed } from "./AlertHistory"

/** "há 20 s" que anda sozinho. */
function useSince(iso: string) {
  const [now, setNow] = useState(() => new Date().toISOString())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toISOString()), 1000)
    return () => clearInterval(id)
  }, [])
  return elapsed(iso, now)
}

/**
 * Conteúdo do alerta para a portaria (mockup 34): apartamento grande, andar, tipo, quem pediu, há quanto tempo, contato
 * de emergência, "Estou indo" e, depois, "Resolvido" com nota. Usado na tela cheia e na lista de alertas.
 */
export function EmergencyPanel({
  alert,
  canRespond,
  onMinimize,
}: {
  alert: EmergencyView
  canRespond: boolean
  onMinimize?: () => void
}) {
  const t = useTranslations("security.desk")
  const tk = useTranslations("security")
  const since = useSince(alert.createdAt)
  const [note, setNote] = useState("")
  const ack = useServiceMutation(() =>
    getServices().emergency.acknowledge(serviceContext(), alert.id),
  )
  const resolve = useServiceMutation(() =>
    getServices().emergency.resolve(serviceContext(), alert.id, note.trim() || null),
  )
  const contact = alert.emergencyContact

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="inline-flex size-24 items-center justify-center rounded-full bg-destructive-foreground text-destructive ring-8 ring-destructive-foreground/25">
        <TriangleAlert aria-hidden className="size-12" />
      </span>
      <p className="text-sm font-bold tracking-[0.3em] uppercase">{t("label")}</p>
      <h2 className="font-heading text-5xl leading-none font-extrabold">
        {t("apartment", { n: alert.apartment })}
      </h2>
      <p className="text-lg">
        {t("floor", { floor: alert.floor })} · {tk(`kind.${alert.kind}`)}
      </p>
      <p>
        {alert.createdBy} · {t("since", { time: since })}
        {alert.origin === "whatsapp" ? ` · ${t("byWhatsapp")}` : ""}
      </p>
      {alert.repeated && alert.status === "open" && (
        <p className="rounded-xl bg-destructive-foreground/15 px-3 py-2 font-bold">
          {t("repeated")}
        </p>
      )}

      <div className="flex w-full flex-col gap-3">
        {alert.status === "open" && canRespond && (
          <button
            type="button"
            onClick={() => ack.mutate(undefined)}
            disabled={ack.isPending}
            className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-destructive-foreground px-4 text-xl font-extrabold text-destructive"
          >
            <Check aria-hidden className="size-6" />
            {t("going")}
          </button>
        )}
        {alert.status === "acknowledged" && (
          <p
            role="status"
            className="rounded-xl bg-destructive-foreground/15 px-3 py-3 text-lg font-bold"
          >
            {t("goingBy", { name: alert.acknowledgedBy ?? "" })}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={telLink("192")}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-destructive-foreground/70 px-3 text-lg font-bold"
          >
            <Phone aria-hidden className="size-5" />
            {t("samu")}
          </a>
          {contact ? (
            <a
              href={telLink(contact.phone)}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-destructive-foreground/70 px-3 text-lg font-bold"
            >
              <Phone aria-hidden className="size-5" />
              {t("callContact")}
            </a>
          ) : (
            <a
              href={telLink("193")}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-destructive-foreground/70 px-3 text-lg font-bold"
            >
              <Phone aria-hidden className="size-5" />
              {t("firefighters")}
            </a>
          )}
        </div>
        <p className="text-sm [overflow-wrap:anywhere]">
          {contact
            ? t("contact", {
                name: contact.name,
                relationship: contact.relationship,
                phone: displayPhone(contact.phone),
              })
            : t("noContact")}
        </p>

        {alert.status === "acknowledged" && canRespond && (
          <form
            className="flex flex-col gap-2 rounded-2xl bg-destructive-foreground/15 p-3 text-left"
            onSubmit={(e) => {
              e.preventDefault()
              resolve.mutate(undefined)
            }}
          >
            <label htmlFor={`note-${alert.id}`} className="font-semibold">
              {t("note")}
            </label>
            <textarea
              id={`note-${alert.id}`}
              rows={2}
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl border-2 border-input bg-card px-3 py-2 text-card-foreground"
            />
            <DictateButton value={note} onChange={setNote} />
            <button
              type="submit"
              disabled={resolve.isPending}
              className="inline-flex min-h-14 items-center justify-center rounded-xl bg-destructive-foreground px-4 text-lg font-extrabold text-destructive"
            >
              {t("resolve")}
            </button>
          </form>
        )}
        {(ack.isError || resolve.isError) && <p role="alert">{tk("error")}</p>}
        {onMinimize && alert.status === "acknowledged" && (
          <button type="button" onClick={onMinimize} className="min-h-12 font-semibold underline">
            {t("minimize")}
          </button>
        )}
      </div>
    </div>
  )
}

/** Tela cheia por cima de tudo na portaria de plantão (RF-003), com som e vibração quando o aparelho deixa. */
export function DeskEmergencyOverlay({
  alert,
  onMinimize,
}: {
  alert: EmergencyView
  onMinimize: () => void
}) {
  const t = useTranslations("security.desk")
  useEffect(() => {
    if (alert.status !== "open") return
    return alarm()
  }, [alert.id, alert.status, alert.repeated])

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`emergency-${alert.id}`}
      className="fixed inset-0 z-50 overflow-y-auto bg-destructive px-4 pt-[calc(2rem+env(safe-area-inset-top))] pb-8 text-destructive-foreground"
    >
      <span id={`emergency-${alert.id}`} className="sr-only">
        {t("dialog", { n: alert.apartment })}
      </span>
      <div className="mx-auto max-w-md">
        <EmergencyPanel alert={alert} canRespond onMinimize={onMinimize} />
      </div>
    </div>
  )
}
