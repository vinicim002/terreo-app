"use client"

import { DateField } from "@/components/comm/DateField"
import { Plus, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { TextField } from "@/components/forms/fields"
import { DateTimeField, ErrorText } from "@/components/comm/shared"
import { serviceContext, useMeeting, useServiceMutation } from "@/hooks/data"
import { brasiliaToIso, dayKeyBrasilia, timeBrasilia } from "@/i18n/datetime"
import { getServices } from "@/services"
import type { MeetingView } from "@/services/contracts"

/** Nova reunião ou edição: data, horário, local e pauta (RF-020). */
export function MeetingForm() {
  const id = useSearchParams().get("id")
  const { data: existing } = useMeeting(id)
  if (id && !existing) return null
  return <MeetingFormFields id={id} existing={existing} />
}

function MeetingFormFields({ id, existing }: { id: string | null; existing?: MeetingView }) {
  const t = useTranslations("comm.meetingForm")
  const router = useRouter()
  const [date, setDate] = useState(() =>
    dayKeyBrasilia(existing?.startsAt ?? new Date(Date.now() + 7 * 86_400_000)),
  )
  const [time, setTime] = useState(existing ? timeBrasilia(existing.startsAt) : "19:30")
  const [place, setPlace] = useState(existing?.place ?? "Salão de festas")
  const [agenda, setAgenda] = useState(existing?.agenda ?? [""])

  const save = useServiceMutation(() => {
    const input = { startsAt: brasiliaToIso(date, time), place, agenda }
    return id
      ? getServices().meetings.update(serviceContext(), id, input)
      : getServices().meetings.create(serviceContext(), input)
  })
  const setItem = (i: number, v: string) => setAgenda((a) => a.map((x, j) => (j === i ? v : x)))

  return (
    <form
      className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(undefined, { onSuccess: (m) => router.replace(`/manager/meeting/?id=${m.id}`) })
      }}
    >
      <DateField label={t("date")} value={date} onChange={setDate} />
      <DateTimeField label={t("time")} type="time" value={time} onChange={setTime} />
      <TextField label={t("place")} value={place} onChange={setPlace} maxLength={120} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">{t("agenda")}</legend>
        {agenda.map((item, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex-1">
              <TextField
                label={t("item", { n: i + 1 })}
                value={item}
                onChange={(v) => setItem(i, v)}
                maxLength={200}
              />
            </div>
            {agenda.length > 1 && (
              <button
                type="button"
                aria-label={t("removeItem", { n: i + 1 })}
                onClick={() => setAgenda((a) => a.filter((_, j) => j !== i))}
                className="inline-flex size-12 items-center justify-center rounded-xl border border-border bg-card"
              >
                <X aria-hidden className="size-5" />
              </button>
            )}
          </div>
        ))}
        {agenda.length < 15 && (
          <button
            type="button"
            className="btn-outline"
            onClick={() => setAgenda((a) => [...a, ""])}
          >
            <Plus aria-hidden className="size-5" />
            {t("addItem")}
          </button>
        )}
      </fieldset>
      {save.isError && <ErrorText>{t("invalid")}</ErrorText>}
      <button type="submit" className="btn-primary" disabled={save.isPending}>
        {t("save")}
      </button>
    </form>
  )
}
