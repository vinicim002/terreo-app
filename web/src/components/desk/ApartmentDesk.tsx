"use client"

import { Check, Mail, PackagePlus, Phone, Plane, ArrowUp } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Empty, ErrorText, Section, useDates } from "@/components/comm/shared"
import { storeName } from "@/components/deliveries/ResidentDeliveries"
import { Avatar } from "@/components/profile/Avatar"
import { fromDayKey } from "@/i18n/datetime"
import { serviceContext, useDeskApartment, useServiceMutation } from "@/hooks/data"
import { getServices } from "@/services"
import type { DeliveryView } from "@/services/contracts"

function CodeRow({ d }: { d: DeliveryView }) {
  const t = useTranslations("fd")
  const arrived = useServiceMutation(() =>
    getServices().deliveries.markArrived(serviceContext(), d.id),
  )
  return (
    <li className="flex flex-col gap-2 rounded-xl border-2 border-border bg-card p-3 text-card-foreground">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold">{storeName(t, d)}</span>
          {d.note && <span className="block text-sm text-muted-foreground">{d.note}</span>}
        </span>
        <span
          className="rounded-xl bg-muted px-3 py-2 font-mono text-3xl font-extrabold tracking-wider"
          data-testid="code"
        >
          {d.code}
        </span>
      </div>
      {d.onArrival === "call" && (
        <p className="flex items-center gap-2 rounded-xl bg-warning-background p-2 font-bold text-warning">
          <Phone aria-hidden className="size-5" />
          {t("apartment.callFirst")}
        </p>
      )}
      {d.onArrival === "elevator" && (
        <p className="flex items-center gap-2 font-semibold">
          <ArrowUp aria-hidden className="size-5" />
          {t("apartment.elevator")}
        </p>
      )}
      {d.onArrival === "front-desk" && <p className="font-semibold">{t("arrival.front-desk")}</p>}
      <button
        type="button"
        className="btn-primary min-h-14 text-lg"
        disabled={arrived.isPending}
        onClick={() => arrived.mutate(undefined)}
      >
        <Check aria-hidden className="size-6" />
        {t("apartment.arrived")}
      </button>
      {arrived.isError && <ErrorText>{t("error")}</ErrorText>}
    </li>
  )
}

function AtDeskRow({
  d,
  people,
}: {
  d: DeliveryView
  people: { personId: string; name: string }[]
}) {
  const t = useTranslations("fd")
  const dates = useDates()
  const [picking, setPicking] = useState(false)
  const [who, setWho] = useState(people[0]?.personId ?? "")
  const pickup = useServiceMutation(() =>
    getServices().deliveries.registerPickup(serviceContext(), d.id, who),
  )
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 text-card-foreground">
      <div className="flex items-center gap-3">
        {d.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={d.photo}
            alt={t("deliveries.photo")}
            className="size-14 rounded-xl object-cover"
          />
        )}
        <span className="flex-1">
          <span className="block font-bold">
            {storeName(t, d)}
            {d.size && ` · ${t(`sizes.${d.size}`)}`}
          </span>
          <span className="text-sm text-muted-foreground">
            {dates.short(d.arrivedAt!)} · {t("deliveries.days", { count: d.daysAtDesk ?? 0 })}
          </span>
        </span>
      </div>
      {picking ? (
        <div className="flex flex-col gap-2">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">{t("apartment.whoPicked")}</legend>
            {people.map((p) => (
              <label
                key={p.personId}
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 text-lg font-semibold ${
                  who === p.personId
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card text-card-foreground"
                }`}
              >
                <input
                  type="radio"
                  name={`who-${d.id}`}
                  className="sr-only"
                  checked={who === p.personId}
                  onChange={() => setWho(p.personId)}
                />
                <span
                  aria-hidden
                  className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    who === p.personId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input"
                  }`}
                >
                  {who === p.personId && <Check className="size-4" />}
                </span>
                {p.name}
              </label>
            ))}
          </fieldset>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={() => pickup.mutate(undefined)}
            >
              {t("apartment.confirm")}
            </button>
            <button type="button" className="btn-outline" onClick={() => setPicking(false)}>
              {t("apartment.cancel")}
            </button>
          </div>
        </div>
      ) : (
        people.length > 0 && (
          <button type="button" className="btn-outline min-h-14" onClick={() => setPicking(true)}>
            {t("apartment.pickup")}
          </button>
        )
      )}
    </li>
  )
}

/** Painel do apartamento na portaria: moradores, códigos com "Chegou", encomendas e correspondência. */
export function ApartmentDesk() {
  const t = useTranslations("fd")
  const tk = useTranslations("kindLabels")
  const dates = useDates()
  const number = useSearchParams().get("n")
  const { data, error } = useDeskApartment(number)
  const mail = useServiceMutation(() => getServices().deliveries.mail(serviceContext(), number!))
  if (error)
    return (
      <div className="mx-auto max-w-xl px-4 py-4">
        <Empty>{t("notFound")}</Empty>
      </div>
    )
  if (!data) return <p className="px-4 py-4 text-muted-foreground">{t("loading")}</p>
  const codes = data.deliveries.filter((d) => d.status === "awaiting")
  const atDesk = data.deliveries.filter((d) => d.status === "at-desk")

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <h2 className="text-4xl">{data.number}</h2>
      {data.travelUntil && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-warning-background p-3 font-bold text-warning"
        >
          <Plane aria-hidden className="size-5" />
          {t("desk.travel", { date: dates.long(fromDayKey(data.travelUntil)) })}
        </p>
      )}
      <Section title={t("apartment.codes")}>
        {codes.length === 0 && <p className="text-muted-foreground">{t("apartment.noCodes")}</p>}
        <ul className="flex flex-col gap-2">
          {codes.map((d) => (
            <CodeRow key={d.id} d={d} />
          ))}
        </ul>
      </Section>
      {atDesk.length > 0 && (
        <Section title={t("apartment.atDesk")}>
          <ul className="flex flex-col gap-2">
            {atDesk.map((d) => (
              <AtDeskRow key={d.id} d={d} people={data.people} />
            ))}
          </ul>
        </Section>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/front-desk/receive-delivery/?n=${data.number}`}
          className="btn-outline min-h-14"
        >
          <PackagePlus aria-hidden className="size-5" />
          {t("desk.receive")}
        </Link>
        <button
          type="button"
          className="btn-outline min-h-14"
          disabled={mail.isPending || mail.isSuccess}
          onClick={() => mail.mutate(undefined)}
        >
          <Mail aria-hidden className="size-5" />
          {t("desk.mail")}
        </button>
      </div>
      {mail.isSuccess && (
        <p role="status" className="font-semibold">
          {t("apartment.mailSent")}
        </p>
      )}
      <Section title={t("apartment.people")}>
        {data.people.length === 0 && (
          <p className="text-muted-foreground">{t("apartment.noPeople")}</p>
        )}
        <ul className="flex flex-col gap-2">
          {data.people.map((p) => (
            <li key={p.personId} className="flex items-center gap-3">
              <Avatar name={p.name} photo={p.photo} />
              <span>
                <span className="block font-semibold">{p.name}</span>
                <span className="block text-sm text-muted-foreground">{tk(p.kind)}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
