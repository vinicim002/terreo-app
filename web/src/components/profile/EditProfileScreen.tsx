"use client"

import { useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"
import { Status, TextField } from "@/components/forms/fields"
import { Header } from "@/components/layout/Header"
import { refreshSession } from "@/auth/session"
import { useMe } from "@/auth/useMe"
import { serviceContext, useServiceMutation } from "@/hooks/data"
import { formatPhone } from "@/phone/phone"
import { resizePhoto } from "@/photo/resize"
import { getServices } from "@/services"
import { Avatar } from "./Avatar"

/** Editar o próprio nome e foto (RF-020, RF-021, RF-025). O celular não muda por aqui. */
export function EditProfileScreen() {
  const t = useTranslations("profile")
  const th = useTranslations("household")
  const me = useMe()
  const [name, setName] = useState<string | null>(null)
  const [photo, setPhoto] = useState<string | null | undefined>(undefined)
  const [error, setError] = useState<string>()
  const [saved, setSaved] = useState(false)
  const save = useServiceMutation((patch: { name?: string; photo?: string | null }) =>
    getServices().people.updateOwnProfile(serviceContext(), patch),
  )
  if (!me.person) return <Header title={t("editTitle")} showBack backHref="/resident/profile/" />

  const currentName = name ?? me.person.name
  const currentPhoto = photo === undefined ? me.person.photo : photo

  async function submit(e: FormEvent) {
    e.preventDefault()
    const clean = currentName.trim()
    if (clean.length < 2 || clean.length > 120) return setError(th("nameInvalid"))
    setError(undefined)
    await save.mutateAsync({ name: clean, ...(photo !== undefined && { photo }) })
    await refreshSession()
    setSaved(true)
  }

  return (
    <>
      <Header title={t("editTitle")} showBack backHref="/resident/profile/" />
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={currentName} photo={currentPhoto} size="lg" />
            <div className="flex flex-col gap-2">
              <label className="btn-outline cursor-pointer">
                {t("choosePhoto")}
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="sr-only"
                  data-testid="photo-input"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) setPhoto(await resizePhoto(file))
                  }}
                />
              </label>
              {currentPhoto && (
                <button type="button" className="btn-outline" onClick={() => setPhoto(null)}>
                  {t("removePhoto")}
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t("photoHint")}</p>
          <TextField
            label={th("name")}
            value={currentName}
            onChange={setName}
            error={error}
            maxLength={120}
          />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">{th("phone")}</p>
            <p className="min-h-12 rounded-xl border border-border bg-muted px-4 py-3 text-muted-foreground">
              {formatPhone(me.person.phone)}
            </p>
            <p className="text-sm text-muted-foreground">{t("phoneReadonly")}</p>
          </div>
          {saved && <Status>{t("saved")}</Status>}
          <button type="submit" className="btn-primary min-h-14 text-lg" disabled={save.isPending}>
            {t("save")}
          </button>
        </form>
      </main>
    </>
  )
}
