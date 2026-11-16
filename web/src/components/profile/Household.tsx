"use client"

import { ChevronRight, UserPlus } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { daysSince } from "@/components/forms/errors"
import { useHousehold } from "@/hooks/data"
import type { ResidentView } from "@/services/contracts"
import { Avatar } from "./Avatar"

interface HouseholdProps {
  apartmentId: string
  apartmentNumber: string
  myPersonId: string
  /** Onde abrir a pessoa (morador: /resident/person/; síndico: /manager/person/). */
  personHref?: (r: ResidentView) => string
  /** Mostrar "Convidar" (só o responsável). */
  canInvite: boolean
  /** Pode abrir as outras pessoas para editar. */
  canEdit: boolean
}

/** "Moram no apto" (História 3): marcas Você, Responsável e Convite pendente há N dias. */
export function Household({
  apartmentId,
  apartmentNumber,
  myPersonId,
  personHref,
  canInvite,
  canEdit,
}: HouseholdProps) {
  const t = useTranslations("household")
  const tk = useTranslations("kindLabels")
  const { data } = useHousehold(apartmentId)

  return (
    <section aria-labelledby="household" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 id="household" className="text-lg">
          {t("title", { number: apartmentNumber })}
        </h2>
        {canInvite && (
          <Link
            href="/resident/invite/"
            className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 font-semibold text-link"
          >
            <UserPlus aria-hidden className="size-5" />
            {t("invite")}
          </Link>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {data?.map((r) => {
          const me = r.personId === myPersonId
          const content = (
            <>
              <Avatar name={r.name} photo={r.photo} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{r.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {r.isResponsible ? t("responsible") : tk(r.kind)}
                  {r.status === "pending" &&
                    ` · ${t("pendingSince", { days: daysSince(r.lastInviteAt) })}`}
                </span>
              </span>
              {me && (
                <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
                  {t("you")}
                </span>
              )}
              {!me && r.status === "pending" && (
                <span className="rounded-full bg-warning-background px-3 py-1 text-sm font-semibold text-warning">
                  {t("pending")}
                </span>
              )}
            </>
          )
          const clickable = canEdit && !me && personHref
          return (
            <li key={r.residencyId}>
              {clickable ? (
                <Link
                  href={personHref(r)}
                  className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground hover:bg-muted"
                >
                  {content}
                  <ChevronRight aria-hidden className="size-5" />
                </Link>
              ) : (
                <div className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground">
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
