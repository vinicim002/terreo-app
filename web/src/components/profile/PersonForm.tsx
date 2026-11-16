"use client"

import { useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"
import { Choices, TextField, Toggle } from "@/components/forms/fields"
import { PhoneInput, type PhoneValue } from "@/phone/PhoneInput"
import { normalizePhone } from "@/phone/phone"
import type { ResidentKind } from "@/services/schemas"

export interface PersonFormValue {
  name: string
  phone: PhoneValue
  kind: ResidentKind
  canRegisterDeliveries: boolean
  canVotePolls: boolean
}

export interface PersonFormResult {
  name: string
  phone: string
  kind: ResidentKind
  canRegisterDeliveries: boolean
  canVotePolls: boolean
}

interface PersonFormProps {
  initial: PersonFormValue
  kinds: readonly ResidentKind[]
  submitLabel: string
  /** Mostra as permissões (convite e edição pelo responsável). */
  showPermissions?: boolean
  /** Responsável: permissões travadas em "sim" (RF-015a). */
  lockPermissions?: boolean
  phoneWarning?: string
  onSubmit: (value: PersonFormResult) => Promise<void>
  error?: string
}

/** Formulário de pessoa: nome, celular com país, tipo e permissões (convite, edição). */
export function PersonForm({
  initial,
  kinds,
  submitLabel,
  showPermissions = true,
  lockPermissions = false,
  phoneWarning,
  onSubmit,
  error,
}: PersonFormProps) {
  const t = useTranslations("household")
  const tp = useTranslations("phone")
  const tk = useTranslations("kindLabels")
  const [value, setValue] = useState(initial)
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const name = value.name.trim()
    const phone = normalizePhone(value.phone.text, value.phone.country)
    const next = {
      name: name.length < 2 || name.length > 120 ? t("nameInvalid") : undefined,
      phone: phone.ok ? undefined : tp(phone.reason),
    }
    setErrors(next)
    if (next.name || next.phone || !phone.ok) return
    setBusy(true)
    try {
      await onSubmit({ ...value, name, phone: phone.e164 })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <TextField
        label={t("name")}
        value={value.name}
        onChange={(name) => setValue({ ...value, name })}
        error={errors.name}
        maxLength={120}
      />
      <PhoneInput
        label={t("phone")}
        value={value.phone}
        onChange={(phone) => setValue({ ...value, phone })}
        error={errors.phone}
      />
      {phoneWarning && <p className="text-sm text-muted-foreground">{phoneWarning}</p>}
      <Choices
        label={t("kind")}
        options={kinds}
        value={value.kind}
        onChange={(kind) => setValue({ ...value, kind })}
        labelOf={(k) => tk(k)}
      />
      {showPermissions && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">{t("permissions")}</legend>
          <Toggle
            label={t("canDeliveries")}
            checked={lockPermissions || value.canRegisterDeliveries}
            disabled={lockPermissions}
            onChange={(canRegisterDeliveries) => setValue({ ...value, canRegisterDeliveries })}
          />
          <Toggle
            label={t("canVote")}
            hint={t("canVoteHint")}
            checked={lockPermissions || value.canVotePolls}
            disabled={lockPermissions}
            onChange={(canVotePolls) => setValue({ ...value, canVotePolls })}
          />
        </fieldset>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary min-h-14 text-lg" disabled={busy}>
        {submitLabel}
      </button>
    </form>
  )
}
