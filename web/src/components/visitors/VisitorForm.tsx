"use client"

import { DateField } from "@/components/comm/DateField"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Choices, TextField } from "@/components/forms/fields"
import { DateTimeField, ErrorText } from "@/components/comm/shared"
import { serviceContext, useServiceMutation } from "@/hooks/data"
import { dayKeyBrasilia } from "@/i18n/datetime"
import { getServices } from "@/services"

/** Avisar visita ou prestador (História 3, RF-011). Sem documento (RF-014). */
export function VisitorForm() {
  const t = useTranslations("fd")
  const router = useRouter()
  const [kind, setKind] = useState<"visit" | "provider">("visit")
  const [name, setName] = useState("")
  const [today] = useState(() => dayKeyBrasilia(new Date()))
  const [day, setDay] = useState(today)
  const [from, setFrom] = useState("19:00")
  const [to, setTo] = useState("21:00")
  const [people, setPeople] = useState("1")
  const save = useServiceMutation(() =>
    getServices().visitors.register(serviceContext(), {
      kind,
      name,
      day,
      fromTime: from,
      toTime: to,
      people: Number(people) || 1,
    }),
  )
  return (
    <form
      className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(undefined, { onSuccess: () => router.replace("/resident/visitors/") })
      }}
    >
      <Choices
        label={t("visitorForm.kind")}
        options={["visit", "provider"] as const}
        value={kind}
        onChange={setKind}
        labelOf={(k) => t(`visitors.${k}`)}
      />
      <TextField
        label={kind === "provider" ? t("visitorForm.providerName") : t("visitorForm.name")}
        value={name}
        onChange={setName}
        maxLength={80}
      />
      <DateField label={t("visitorForm.day")} value={day} onChange={setDay} min={today} />
      <div className="grid grid-cols-2 gap-2">
        <DateTimeField label={t("visitorForm.from")} type="time" value={from} onChange={setFrom} />
        <DateTimeField label={t("visitorForm.to")} type="time" value={to} onChange={setTo} />
      </div>
      {kind === "visit" && (
        <DateTimeField
          label={t("visitorForm.people")}
          type="number"
          value={people}
          onChange={setPeople}
        />
      )}
      {save.isError && <ErrorText>{t("visitorForm.invalid")}</ErrorText>}
      <button type="submit" className="btn-primary min-h-14 text-lg" disabled={save.isPending}>
        {t("visitorForm.save")}
      </button>
    </form>
  )
}
