"use client"

import { DateField } from "@/components/comm/DateField"
import { Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { TextField, Toggle } from "@/components/forms/fields"
import { DateTimeField, ErrorText } from "@/components/comm/shared"
import { serviceContext, useServiceMutation } from "@/hooks/data"
import { brasiliaToIso, dayKeyBrasilia } from "@/i18n/datetime"
import { getServices } from "@/services"

/** Nova enquete (mockup 38): pergunta, de 2 a 6 opções, encerramento, oficial e resultado parcial. */
export function PollForm() {
  const t = useTranslations("comm.pollForm")
  const tf = useTranslations("comm.form")
  const router = useRouter()
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [date, setDate] = useState(() => dayKeyBrasilia(new Date(Date.now() + 7 * 86_400_000)))
  const [time, setTime] = useState("22:00")
  const [today] = useState(() => dayKeyBrasilia(new Date()))
  const [official, setOfficial] = useState(false)
  const [showPartial, setShowPartial] = useState(true)
  const create = useServiceMutation(() =>
    getServices().polls.create(serviceContext(), {
      question,
      options,
      closesAt: brasiliaToIso(date, time),
      official,
      showPartial,
    }),
  )
  const setOption = (i: number, v: string) => setOptions((o) => o.map((x, j) => (j === i ? v : x)))

  return (
    <form
      className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault()
        create.mutate(undefined, { onSuccess: () => router.replace("/manager/polls/") })
      }}
    >
      <TextField label={t("question")} value={question} onChange={setQuestion} maxLength={200} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">{t("options")}</legend>
        {options.map((o, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex-1">
              <TextField
                label={t("option", { n: i + 1 })}
                value={o}
                onChange={(v) => setOption(i, v)}
                maxLength={80}
              />
            </div>
            {options.length > 2 && (
              <button
                type="button"
                aria-label={t("removeOption", { n: i + 1 })}
                onClick={() => setOptions((list) => list.filter((_, j) => j !== i))}
                className="inline-flex size-12 items-center justify-center rounded-xl border border-border bg-card"
              >
                <X aria-hidden className="size-5" />
              </button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <button
            type="button"
            className="btn-outline"
            onClick={() => setOptions((o) => [...o, ""])}
          >
            <Plus aria-hidden className="size-5" />
            {t("addOption")}
          </button>
        )}
      </fieldset>
      <DateField label={t("closesAt")} value={date} onChange={setDate} min={today} />
      <DateTimeField label={tf("time")} type="time" value={time} onChange={setTime} />
      <Toggle
        label={t("official")}
        hint={t("officialHint")}
        checked={official}
        onChange={setOfficial}
      />
      <Toggle
        label={t("partial")}
        hint={t("partialHint")}
        checked={showPartial}
        onChange={setShowPartial}
      />
      {create.isError && <ErrorText>{t("invalid")}</ErrorText>}
      <button type="submit" className="btn-primary" disabled={create.isPending}>
        {t("create")}
      </button>
    </form>
  )
}
