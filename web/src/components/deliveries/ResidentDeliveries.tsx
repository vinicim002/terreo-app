"use client"

import { Check, Mail, MessageCircle, Package, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Empty, ErrorText, KindIcon, Section, useDates } from "@/components/comm/shared"
import { ConfirmBox } from "@/components/forms/fields"
import { serviceContext, useMyDeliveries, useServiceMutation } from "@/hooks/data"
import { getServices } from "@/services"
import type { DeliveryView } from "@/services/contracts"

export function storeName(
  t: (k: string) => string,
  d: Pick<DeliveryView, "store" | "storeName" | "origin">,
) {
  if (d.origin === "mail") return t("deliveries.mail")
  if (!d.store) return ""
  return d.store === "other" ? (d.storeName ?? t("stores.other")) : t(`stores.${d.store}`)
}

function DeliveryCard({ d }: { d: DeliveryView }) {
  const t = useTranslations("fd")
  const dates = useDates()
  const [cancelling, setCancelling] = useState(false)
  const cancel = useServiceMutation(() =>
    getServices().deliveries.cancelCode(serviceContext(), d.id),
  )
  const pickUp = useServiceMutation(() => getServices().deliveries.pickUp(serviceContext(), d.id))
  const icon =
    d.origin === "mail"
      ? Mail
      : d.status === "picked-up" || d.status === "delivered"
        ? Check
        : Package
  const name = storeName(t, d)

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground">
      <div className="flex items-start gap-3">
        {d.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={d.photo}
            alt={t("deliveries.photo")}
            className="size-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <KindIcon
            icon={icon}
            tone={d.status === "awaiting" || d.status === "at-desk" ? "brand" : "muted"}
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-tight">
            {name}
            {d.size && ` · ${t(`sizes.${d.size}`)}`}
          </h3>
          <p className="text-sm text-muted-foreground">
            {d.status === "awaiting" &&
              `${t("deliveries.registeredAt", { time: dates.time(d.createdAt), name: d.createdBy })}${
                d.origin === "whatsapp" ? ` · ${t("deliveries.byWhatsapp")}` : ""
              } · ${t(`arrival.${d.onArrival}`)}`}
            {d.status === "at-desk" && (
              <>
                {d.receivedBy &&
                  t("deliveries.receivedBy", {
                    name: d.receivedBy,
                    time: dates.short(d.arrivedAt!),
                  })}
                <br />
                <strong>{t("deliveries.days", { count: d.daysAtDesk ?? 0 })}</strong>
              </>
            )}
            {d.status === "picked-up" &&
              t("deliveries.pickedUpBy", {
                name: d.pickedUpBy ?? "",
                date: dates.short(d.pickedUpAt!),
              })}
            {(d.status === "delivered" || d.status === "not-arrived") && t(`status.${d.status}`)}
          </p>
          {d.note && <p className="text-sm">{d.note}</p>}
        </div>
        {d.code && d.status === "awaiting" && (
          <span className="rounded-xl bg-muted px-3 py-2 font-mono text-2xl font-extrabold tracking-wider">
            {d.code}
          </span>
        )}
      </div>
      {d.status === "at-desk" && (
        <button
          type="button"
          className="btn-primary"
          disabled={pickUp.isPending}
          onClick={() => pickUp.mutate(undefined)}
        >
          <Check aria-hidden className="size-5" />
          {t("deliveries.pickedUp")}
        </button>
      )}
      {d.status === "awaiting" &&
        (cancelling ? (
          <ConfirmBox
            text={t("deliveries.cancelConfirm")}
            yes={t("deliveries.yes")}
            no={t("deliveries.no")}
            onNo={() => setCancelling(false)}
            onYes={() => cancel.mutate(undefined)}
          />
        ) : (
          <button
            type="button"
            className="btn-outline self-start"
            onClick={() => setCancelling(true)}
          >
            <Trash2 aria-hidden className="size-4" />
            {t("deliveries.cancel")}
          </button>
        ))}
      {(cancel.isError || pickUp.isError) && <ErrorText>{t("error")}</ErrorText>}
    </article>
  )
}

/** Entregas do morador (mockup 08): Aguardando, Na portaria e Retiradas (Histórias 1 e 2). */
export function ResidentDeliveries() {
  const t = useTranslations("fd.deliveries")
  const { data } = useMyDeliveries()
  const empty = data && !data.awaiting.length && !data.atDesk.length && !data.done.length
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <Link href="/resident/delivery/new/" className="btn-primary min-h-14 text-lg">
        <Plus aria-hidden className="size-6" />
        {t("new")}
      </Link>
      <p className="flex gap-2 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
        <MessageCircle aria-hidden className="size-5 shrink-0" />
        {t("whatsappHint")}
      </p>
      {empty && <Empty>{t("empty")}</Empty>}
      {!!data?.awaiting.length && (
        <Section title={t("awaiting")}>
          {data.awaiting.map((d) => (
            <DeliveryCard key={d.id} d={d} />
          ))}
        </Section>
      )}
      {!!data?.atDesk.length && (
        <Section title={t("atDesk")}>
          {data.atDesk.map((d) => (
            <DeliveryCard key={d.id} d={d} />
          ))}
        </Section>
      )}
      {!!data?.done.length && (
        <Section title={t("done")}>
          {data.done.map((d) => (
            <DeliveryCard key={d.id} d={d} />
          ))}
        </Section>
      )}
    </div>
  )
}
