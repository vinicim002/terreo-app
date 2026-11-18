"use client"

import { Check, Phone, UserPlus, Wrench } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Badge, Empty, ErrorText, Section, useDates } from "@/components/comm/shared"
import { DictateField } from "@/voice/DictateButton"
import { serviceContext, useServiceMutation, useTodayVisitors } from "@/hooks/data"
import { getServices } from "@/services"
import type { VisitorView } from "@/services/contracts"

function Expected({ v }: { v: VisitorView }) {
  const t = useTranslations("fd.visitors")
  const checkIn = useServiceMutation(() => getServices().visitors.checkIn(serviceContext(), v.id))
  return (
    <li className="flex flex-col gap-2 rounded-xl border-2 border-primary bg-card p-3 text-card-foreground">
      <div className="flex items-start gap-3">
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-bold">{v.name}</span>
          <span className="block text-muted-foreground">
            {t("for", { number: v.apartment })} · {t("between", { from: v.fromTime, to: v.toTime })}
          </span>
        </span>
        {v.kind === "provider" ? (
          <Badge tone="warning">{t("provider")}</Badge>
        ) : (
          <Badge>{t("people", { count: v.people })}</Badge>
        )}
      </div>
      {v.kind === "provider" && (
        <p className="flex items-center gap-2 rounded-xl bg-warning-background p-2 font-bold text-warning">
          <Phone aria-hidden className="size-5" />
          {t("intercom")}
        </p>
      )}
      <button
        type="button"
        className="btn-primary min-h-14 text-lg"
        disabled={checkIn.isPending}
        onClick={() => checkIn.mutate(undefined)}
      >
        <Check aria-hidden className="size-6" />
        {t("checkIn")}
      </button>
    </li>
  )
}

function WalkIn() {
  const t = useTranslations("fd")
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [number, setNumber] = useState("")
  const save = useServiceMutation(() =>
    getServices().visitors.walkIn(serviceContext(), { apartmentNumber: number, name }),
  )
  if (!open)
    return (
      <button type="button" className="btn-outline min-h-14 text-lg" onClick={() => setOpen(true)}>
        <UserPlus aria-hidden className="size-6" />
        {t("visitors.walkIn")}
      </button>
    )
  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-border p-3"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(undefined, {
          onSuccess: () => {
            setOpen(false)
            setName("")
            setNumber("")
          },
        })
      }}
    >
      <p className="flex items-center gap-2 font-semibold">
        <Phone aria-hidden className="size-5" />
        {t("visitors.walkInHint")}
      </p>
      <DictateField label={t("visitors.walkInName")} value={name} onChange={setName} max={80} />
      <label htmlFor="walkin-apt" className="text-sm font-semibold">
        {t("visitors.walkInApartment")}
      </label>
      <input
        id="walkin-apt"
        inputMode="numeric"
        value={number}
        onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
        className="min-h-14 rounded-xl border border-input bg-card px-4 text-2xl font-extrabold"
      />
      {save.isError && <ErrorText>{t("error")}</ErrorText>}
      <button type="submit" className="btn-primary min-h-14 text-lg" disabled={!name || !number}>
        {t("visitors.walkInSave")}
      </button>
    </form>
  )
}

/** Visitantes da portaria (mockup 35): esperados de hoje, já entraram e sem cadastro (História 3). */
export function DeskVisitors() {
  const t = useTranslations("fd.visitors")
  const dates = useDates()
  const { data } = useTodayVisitors()
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <Section title={t("expected")}>
        {data?.expected.length === 0 && <Empty>{t("empty")}</Empty>}
        <ul className="flex flex-col gap-2">
          {data?.expected.map((v) => (
            <Expected key={v.id} v={v} />
          ))}
        </ul>
      </Section>
      <WalkIn />
      <Section title={t("arrivedToday")}>
        {data?.arrived.length === 0 && <p className="text-muted-foreground">{t("emptyHistory")}</p>}
        <ul className="flex flex-col gap-2">
          {data?.arrived.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              {v.kind === "provider" ? (
                <Wrench aria-hidden className="size-5" />
              ) : (
                <Check aria-hidden className="size-5" />
              )}
              <span className="flex-1">
                <span className="block font-semibold">
                  {v.name} → {v.apartment}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("arrivedAt", { date: dates.time(v.arrivedAt!), name: v.releasedBy ?? "" })}
                </span>
              </span>
              {v.walkIn && <Badge tone="warning">{t("walkInMark")}</Badge>}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
