"use client"

import { Pencil } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { AccountSection } from "@/components/settings/AccountSection"
import { ScreenPage } from "@/components/layout/ScreenPage"
import { useMe } from "@/auth/useMe"
import { formatPhone } from "@/phone/phone"
import { PROFILES_DEF } from "@/navigation/screens"
import type { Profile } from "@/preferences/types"
import { Avatar } from "./Avatar"

/** Perfil de quem trabalha no prédio (portaria): nome, foto e celular, editar, trocar de papel e sair. */
export function StaffProfileScreen({ profile }: { profile: Profile }) {
  const t = useTranslations("profile")
  const ta = useTranslations("auth")
  const me = useMe()
  const base = PROFILES_DEF[profile].basePath
  return (
    <ScreenPage profile={profile} slug="profile">
      {me.person && (
        <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-4">
          <section className="flex min-h-16 items-center gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground">
            <Avatar name={me.person.name} photo={me.person.photo} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-extrabold">{me.person.name}</p>
              <p className="text-muted-foreground">
                {profile === "front-desk" ? ta("roleFrontDesk") : ta("roleManager")}
              </p>
              <p className="text-sm text-muted-foreground">{formatPhone(me.person.phone)}</p>
            </div>
            <Link
              href={`${base}/profile/edit/`}
              aria-label={t("edit")}
              className="inline-flex size-11 items-center justify-center rounded-xl border border-border hover:bg-muted"
            >
              <Pencil aria-hidden className="size-5" />
            </Link>
          </section>
          <AccountSection compact />
        </div>
      )}
    </ScreenPage>
  )
}
