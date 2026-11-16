"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState, type FormEvent, type ReactNode } from "react"
import { Choices, ConfirmBox, Status, TextField } from "@/components/forms/fields"
import { Header } from "@/components/layout/Header"
import { useMe } from "@/auth/useMe"
import { formatPlate, isValidPlate, normalizePlate } from "@/domain/plate"
import {
  serviceContext,
  useEmergencyContact,
  usePets,
  useServiceMutation,
  useVehicles,
} from "@/hooks/data"
import { PhoneInput, type PhoneValue } from "@/phone/PhoneInput"
import { countryOf, formatPhone, normalizePhone } from "@/phone/phone"
import { getServices, ServiceError } from "@/services"
import { PetKindSchema, type PetKind } from "@/services/schemas"

const BACK = "/resident/profile/"

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Header title={title} showBack backHref={BACK} />
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">{children}</main>
    </>
  )
}

function RemoveButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const t = useTranslations("profile")
  const [confirming, setConfirming] = useState(false)
  return confirming ? (
    <ConfirmBox
      text={t("removeConfirm")}
      yes={t("removeYes")}
      no={t("cancel")}
      onYes={onConfirm}
      onNo={() => setConfirming(false)}
    />
  ) : (
    <button
      type="button"
      className="btn-outline text-destructive"
      onClick={() => setConfirming(true)}
    >
      {t("remove")}
    </button>
  )
}

const forbiddenMessage = (e: unknown) => e instanceof ServiceError && e.code === "forbidden"

/** Carro do apartamento (RF-022): placa antiga ou Mercosul, modelo e cor. */
export function VehicleScreen() {
  const t = useTranslations("profile")
  const router = useRouter()
  const id = useSearchParams().get("id")
  const me = useMe()
  const list = useVehicles(me.apartmentId)
  const current = list.data?.find((v) => v.id === id)
  const [form, setForm] = useState<{ plate: string; model: string; color: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useServiceMutation((v: { plate: string; model: string; color: string }) =>
    getServices().apartmentData.saveVehicle(serviceContext(), {
      ...v,
      id: id ?? undefined,
      apartmentId: me.apartmentId!,
    }),
  )
  const remove = useServiceMutation(() =>
    getServices().apartmentData.removeVehicle(serviceContext(), id!),
  )
  if (id && !current) return <Shell title={t("car")}>{null}</Shell>
  const value = form ?? {
    plate: current ? formatPlate(current.plate) : "",
    model: current?.model ?? "",
    color: current?.color ?? "",
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!isValidPlate(normalizePlate(value.plate))) next.plate = t("plateInvalid")
    if (!value.model.trim()) next.model = t("required")
    if (!value.color.trim()) next.color = t("required")
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      await save.mutateAsync(value)
      router.push(BACK)
    } catch (err) {
      if (err instanceof ServiceError && err.details?.plate === "in_use")
        setErrors({ plate: t("plateInUse") })
      else if (forbiddenMessage(err)) setErrors({ form: t("onlyResponsible") })
      else setErrors({ plate: t("plateInvalid") })
    }
  }

  return (
    <Shell title={t("car")}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label={t("plate")}
          value={value.plate}
          onChange={(plate) => setForm({ ...value, plate })}
          error={errors.plate}
          maxLength={8}
          placeholder="ABC1D23"
        />
        <p className="-mt-3 text-sm text-muted-foreground">{t("plateHint")}</p>
        <TextField
          label={t("model")}
          value={value.model}
          onChange={(model) => setForm({ ...value, model })}
          error={errors.model}
          maxLength={60}
        />
        <TextField
          label={t("color")}
          value={value.color}
          onChange={(color) => setForm({ ...value, color })}
          error={errors.color}
          maxLength={30}
        />
        {errors.form && <Status>{errors.form}</Status>}
        <button type="submit" className="btn-primary min-h-14 text-lg" disabled={save.isPending}>
          {t("save")}
        </button>
      </form>
      {current && (
        <RemoveButton
          onConfirm={async () => {
            await remove.mutateAsync(undefined)
            router.push(BACK)
          }}
        />
      )}
    </Shell>
  )
}

/** Animal do apartamento (RF-022): nome e tipo. */
export function PetScreen() {
  const t = useTranslations("profile")
  const router = useRouter()
  const id = useSearchParams().get("id")
  const me = useMe()
  const list = usePets(me.apartmentId)
  const current = list.data?.find((p) => p.id === id)
  const [form, setForm] = useState<{ name: string; kind: PetKind } | null>(null)
  const [error, setError] = useState<string>()
  const save = useServiceMutation((v: { name: string; kind: PetKind }) =>
    getServices().apartmentData.savePet(serviceContext(), {
      ...v,
      id: id ?? undefined,
      apartmentId: me.apartmentId!,
    }),
  )
  const remove = useServiceMutation(() =>
    getServices().apartmentData.removePet(serviceContext(), id!),
  )
  if (id && !current) return <Shell title={t("pet")}>{null}</Shell>
  const value = form ?? { name: current?.name ?? "", kind: current?.kind ?? "dog" }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!value.name.trim()) return setError(t("required"))
    try {
      await save.mutateAsync(value)
      router.push(BACK)
    } catch (err) {
      setError(forbiddenMessage(err) ? t("onlyResponsible") : t("required"))
    }
  }

  return (
    <Shell title={t("pet")}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label={t("petName")}
          value={value.name}
          onChange={(name) => setForm({ ...value, name })}
          error={error}
          maxLength={60}
        />
        <Choices
          label={t("petKind")}
          options={PetKindSchema.options}
          value={value.kind}
          onChange={(kind) => setForm({ ...value, kind })}
          labelOf={(k) => t(`petKinds.${k}`)}
        />
        <button type="submit" className="btn-primary min-h-14 text-lg" disabled={save.isPending}>
          {t("save")}
        </button>
      </form>
      {current && (
        <RemoveButton
          onConfirm={async () => {
            await remove.mutateAsync(undefined)
            router.push(BACK)
          }}
        />
      )}
    </Shell>
  )
}

/** Contato de emergência do apartamento (RF-022; celular com país, RF-001a). */
export function EmergencyContactScreen() {
  const t = useTranslations("profile")
  const tp = useTranslations("phone")
  const router = useRouter()
  const me = useMe()
  const contact = useEmergencyContact(me.apartmentId)
  const [form, setForm] = useState<{
    name: string
    relationship: string
    phone: PhoneValue
  } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useServiceMutation((v: { name: string; relationship: string; phone: string }) =>
    getServices().apartmentData.saveEmergencyContact(serviceContext(), {
      ...v,
      apartmentId: me.apartmentId!,
    }),
  )
  const remove = useServiceMutation(() =>
    getServices().apartmentData.removeEmergencyContact(serviceContext(), me.apartmentId!),
  )
  if (contact.isLoading) return <Shell title={t("emergency")}>{null}</Shell>
  const c = contact.data
  const value = form ?? {
    name: c?.name ?? "",
    relationship: c?.relationship ?? "",
    phone: c
      ? { country: countryOf(c.phone), text: formatPhone(c.phone) }
      : { country: "BR" as const, text: "" },
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const phone = normalizePhone(value.phone.text, value.phone.country)
    const next: Record<string, string> = {}
    if (value.name.trim().length < 2) next.name = t("required")
    if (value.relationship.trim().length < 2) next.relationship = t("required")
    if (!phone.ok) next.phone = tp(phone.reason)
    setErrors(next)
    if (Object.keys(next).length || !phone.ok) return
    try {
      await save.mutateAsync({
        name: value.name,
        relationship: value.relationship,
        phone: phone.e164,
      })
      router.push(BACK)
    } catch (err) {
      setErrors({ form: forbiddenMessage(err) ? t("onlyResponsible") : tp("invalid") })
    }
  }

  return (
    <Shell title={t("emergency")}>
      <p className="text-muted-foreground">{t("emergencyHint")}</p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label={t("contactName")}
          value={value.name}
          onChange={(name) => setForm({ ...value, name })}
          error={errors.name}
          maxLength={120}
        />
        <TextField
          label={t("relationship")}
          value={value.relationship}
          onChange={(relationship) => setForm({ ...value, relationship })}
          error={errors.relationship}
          maxLength={40}
          placeholder={t("relationshipHint")}
        />
        <PhoneInput
          label={t("contactPhone")}
          value={value.phone}
          onChange={(phone) => setForm({ ...value, phone })}
          error={errors.phone}
        />
        {errors.form && <Status>{errors.form}</Status>}
        <button type="submit" className="btn-primary min-h-14 text-lg" disabled={save.isPending}>
          {t("save")}
        </button>
      </form>
      {c && (
        <RemoveButton
          onConfirm={async () => {
            await remove.mutateAsync(undefined)
            router.push(BACK)
          }}
        />
      )}
    </Shell>
  )
}
