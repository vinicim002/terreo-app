"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Choices, TextField, Toggle } from "@/components/forms/fields"
import { DateTimeField, ErrorText, TextArea } from "@/components/comm/shared"
import { serviceContext, useNotice, useServiceMutation } from "@/hooks/data"
import { brasiliaToIso, dayKeyBrasilia, timeBrasilia } from "@/i18n/datetime"
import { getServices, ServiceError } from "@/services"
import type { NoticeInput, NoticeView } from "@/services/contracts"
import { NoticeKindSchema, type NoticeKind } from "@/services/schemas"

const KINDS = NoticeKindSchema.options

/** Novo aviso ou edição (mockup 37). Sem `id` na URL, cria. */
export function NoticeForm() {
  const id = useSearchParams().get("id")
  const { data: existing } = useNotice(id)
  if (id && !existing) return null
  return <NoticeFormFields id={id} existing={existing} />
}

function NoticeFormFields({ id, existing }: { id: string | null; existing?: NoticeView }) {
  const t = useTranslations("comm.form")
  const tk = useTranslations("comm.kinds")
  const router = useRouter()
  const scheduled = existing?.status === "scheduled"
  const [kind, setKind] = useState<NoticeKind>(existing?.kind ?? "general")
  const [title, setTitle] = useState(existing?.title ?? "")
  const [body, setBody] = useState(existing?.body ?? "")
  const [important, setImportant] = useState(existing?.important ?? false)
  const [requireConfirmation, setRequireConfirmation] = useState(
    existing?.requireConfirmation ?? false,
  )
  const [sendToGroup, setSendToGroup] = useState(existing?.sendToGroup ?? true)
  const [when, setWhen] = useState<"now" | "schedule">(scheduled ? "schedule" : "now")
  const [date, setDate] = useState(() =>
    scheduled
      ? dayKeyBrasilia(existing.publishAt)
      : dayKeyBrasilia(new Date(Date.now() + 86_400_000)),
  )
  const [time, setTime] = useState(scheduled ? timeBrasilia(existing.publishAt) : "08:00")
  const [referenceDate, setReferenceDate] = useState(existing?.referenceDate ?? "")
  const [remind, setRemind] = useState(existing?.remindDayBefore ?? false)

  const published = !!existing && existing.status !== "scheduled"
  const input = (publishNow = false): NoticeInput => ({
    kind,
    title,
    body,
    important,
    sendToGroup,
    requireConfirmation,
    referenceDate: referenceDate || null,
    remindDayBefore: remind && !!referenceDate,
    publishAt: published || publishNow || when === "now" ? null : brasiliaToIso(date, time),
  })
  const save = useServiceMutation((publishNow: boolean) =>
    id
      ? getServices().notices.update(serviceContext(), id, input(publishNow))
      : getServices().notices.create(serviceContext(), input(publishNow)),
  )
  const submit = (publishNow = false) =>
    save.mutate(publishNow, {
      onSuccess: (n) => router.replace(`/manager/notice/?id=${n.id}`),
    })

  const details = save.error instanceof ServiceError ? save.error.details : undefined
  const error = !save.error
    ? null
    : details?.publishAt === "past"
      ? "past"
      : details?.referenceDate
        ? "needReference"
        : save.error instanceof ServiceError && save.error.code === "validation"
          ? "invalid"
          : null

  return (
    <form
      className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Choices
        label={t("kind")}
        options={KINDS}
        value={kind}
        onChange={setKind}
        labelOf={(k) => tk(k)}
      />
      <TextField label={t("title")} value={title} onChange={setTitle} maxLength={120} />
      <TextArea
        label={t("body")}
        value={body}
        onChange={setBody}
        max={2000}
        counter={t("chars", { count: body.length, max: 2000 })}
      />
      <Toggle
        label={t("important")}
        hint={t("importantHint")}
        checked={important}
        onChange={setImportant}
      />
      <Toggle
        label={t("confirm")}
        hint={t("confirmHint")}
        checked={requireConfirmation}
        onChange={setRequireConfirmation}
      />
      <Toggle
        label={t("group")}
        hint={t("groupHint")}
        checked={sendToGroup}
        onChange={setSendToGroup}
      />
      {!published && (
        <>
          <Choices
            label={t("when")}
            options={["now", "schedule"] as const}
            value={when}
            onChange={setWhen}
            labelOf={(w) => t(w)}
          />
          {when === "schedule" && (
            <div className="grid grid-cols-2 gap-2">
              <DateTimeField label={t("date")} type="date" value={date} onChange={setDate} />
              <DateTimeField label={t("time")} type="time" value={time} onChange={setTime} />
            </div>
          )}
        </>
      )}
      <DateTimeField
        label={t("reference")}
        type="date"
        value={referenceDate}
        onChange={setReferenceDate}
      />
      <p className="-mt-3 text-sm text-muted-foreground">{t("referenceHint")}</p>
      {referenceDate && (
        <Toggle label={t("remind")} hint={t("remindHint")} checked={remind} onChange={setRemind} />
      )}
      {published && (
        <p className="rounded-xl bg-warning-background p-3 text-sm text-warning">
          {t("editWarning")}
        </p>
      )}
      {error && <ErrorText>{t(error)}</ErrorText>}
      {error === "past" && (
        <button type="button" className="btn-outline" onClick={() => submit(true)}>
          {t("publishNow")}
        </button>
      )}
      {save.isError && !error && <ErrorText>{t("invalid")}</ErrorText>}
      <button type="submit" className="btn-primary" disabled={save.isPending}>
        {published || id ? t("save") : when === "schedule" ? t("saveSchedule") : t("publish")}
      </button>
    </form>
  )
}
