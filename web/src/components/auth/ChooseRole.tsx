"use client"

import { Building2, ChartColumn, ChevronRight, House } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import type { Role } from "@/services/contracts"
import { chooseRole, roleHome, useSession } from "@/auth/session"
import { AuthLayout } from "./AuthLayout"

const ICONS = { resident: House, "front-desk": Building2, manager: ChartColumn }

/** Escolha do papel para quem tem mais de um (esclarecimento da spec 002; CS-009). */
export function ChooseRole() {
  const t = useTranslations("auth")
  const router = useRouter()
  const state = useSession()
  const session = state.status === "ready" ? state.session : null

  useEffect(() => {
    if (state.status === "ready" && !session) router.replace("/login/")
  }, [state.status, session, router])

  if (!session) return null

  const label = (role: Role) =>
    role.kind === "resident"
      ? t("roleResident", { number: session.apartmentNumbers[role.apartmentId] ?? "" })
      : role.kind === "front-desk"
        ? t("roleFrontDesk")
        : t("roleManager")

  return (
    <AuthLayout title={t("chooseRoleTitle")} subtitle={t("chooseRoleHint")}>
      <ul className="flex flex-col gap-3">
        {session.roles.map((role) => {
          const Icon = ICONS[role.kind]
          return (
            <li key={JSON.stringify(role)}>
              <button
                type="button"
                onClick={async () => {
                  await chooseRole(role)
                  router.replace(roleHome(role))
                }}
                className="flex min-h-20 w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left text-card-foreground hover:bg-muted"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-brand text-brand-foreground">
                  <Icon aria-hidden className="size-6" />
                </span>
                <span className="flex-1 text-lg font-semibold">{label(role)}</span>
                <ChevronRight aria-hidden className="size-5" />
              </button>
            </li>
          )
        })}
      </ul>
    </AuthLayout>
  )
}
