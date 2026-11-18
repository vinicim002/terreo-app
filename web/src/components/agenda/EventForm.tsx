"use client"

import { DateField } from "@/components/comm/DateField"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Choices, TextField } from "@/components/forms/fields"
import { DateTimeField, ErrorText } from "@/components/comm/shared"
import { serviceContext, useServiceMutation } from "@/hooks/data"
import { brasiliaToIso, dayKeyBrasilia } from "@/i18n/datetime"
import { getServices } from "@/services"
import { RecurrenceSchema, type Recurrence } from "@/services/schemas"

/** Novo evento da agenda: manutenção ou rotina, com repetição (História 4, RF-018). */
export function EventForm() {
  const t = useTranslations("comm.eventForm")
  const ta = useTranslations("comm.agenda")
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [kind, setKind] = useState<"maintenance" | "routine">("maintenance")
  const [date, setDate] = useState(() => dayKeyBrasilia(new Date(Date.now() + 86_400_000)))
  const [time, setTime] = useState("08:00")
  const [duration, setDuration] = useState("")
  const [recurrence, setRecurrence] = useState<Recurrence>("none")
  const save = useServiceMutation(() =>
    getServices().agenda.createEvent(serviceContext(), {
      title,
      kind,
      startsAt: brasiliaToIso(date, time),
      durationMinutes: duration ? Number(duration) : null,
      recurrence,
    }),
  )
  return (
    <form
      className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(undefined, { onSuccess: () => router.replace("/manager/calendar/") })
      }}
    >
      <TextField label={t("title")} value={title} onChange={setTitle} maxLength={80} />
      <Choices
        label={t("kind")}
        options={["maintenance", "routine"] as const}
        value={kind}
        onChange={setKind}
        labelOf={(k) => ta(`kinds.${k}`)}
      />
      <DateField label={t("date")} value={date} onChange={setDate} />
      <DateTimeField label={t("time")} type="time" value={time} onChange={setTime} />
      <DateTimeField label={t("duration")} type="number" value={duration} onChange={setDuration} />
      <Choices
        label={t("recurrence")}
        options={RecurrenceSchema.options}
        value={recurrence}
        onChange={setRecurrence}
        labelOf={(r) => ta(`recurrence.${r}`)}
      />
      {save.isError && <ErrorText>{t("invalid")}</ErrorText>}
      <button type="submit" className="btn-primary" disabled={save.isPending}>
        {t("save")}
      </button>
    </form>
  )
}
