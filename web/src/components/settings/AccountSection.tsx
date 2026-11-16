"use client"

import { LogOut, Repeat } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { chooseRole, signOut, useSession } from "@/auth/session"
import type { Role } from "@/services/contracts"

/** Conta: trocar de papel (quem tem mais de um) e sair (RF-005, RF-007, CS-009). */
export function AccountSection({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("auth")
  const router = useRouter()
  const state = useSession()
  const [confirming, setConfirming] = useState(false)
  const session = state.status === "ready" ? state.session : null
  if (!session) return null

  const label = (role: Role) =>
    role.kind === "resident"
      ? t("roleResident", { number: session.apartmentNumbers[role.apartmentId] ?? "" })
      : role.kind === "front-desk"
        ? t("roleFrontDesk")
        : t("roleManager")
  const active = session.activeRole
  const others = session.roles.filter((r) => JSON.stringify(r) !== JSON.stringify(active))

  return (
    <section className="flex flex-col gap-2">
      {!compact && (
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("account")}
        </h2>
      )}
      {!compact && (
        <p className="text-sm text-muted-foreground">
          {session.person.name}
          {active && ` · ${label(active)}`}
        </p>
      )}
      {!compact &&
        others.map((role) => (
          <button
            key={JSON.stringify(role)}
            type="button"
            className="btn-outline justify-start"
            onClick={async () => {
              await chooseRole(role)
              router.push("/")
            }}
          >
            <Repeat aria-hidden className="size-5" />
            {t("switchRole")}: {label(role)}
          </button>
        ))}
      {confirming ? (
        <div
          role="alertdialog"
          aria-labelledby="sign-out-q"
          className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
        >
          <p id="sign-out-q" className="text-card-foreground">
            {t("signOutConfirm")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={async () => {
                await signOut()
                router.replace("/login/")
              }}
            >
              {t("confirmSignOut")}
            </button>
            <button type="button" className="btn-outline" onClick={() => setConfirming(false)}>
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn-outline justify-start"
          onClick={() => setConfirming(true)}
        >
          <LogOut aria-hidden className="size-5" />
          {t("signOut")}
        </button>
      )}
    </section>
  )
}
