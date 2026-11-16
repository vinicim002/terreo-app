"use client"

import { Car, ChevronRight, PawPrint, Pencil, Phone, Plus } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { AccountSection } from "@/components/settings/AccountSection"
import { ScreenPage } from "@/components/layout/ScreenPage"
import { useMe } from "@/auth/useMe"
import { formatPlate } from "@/domain/plate"
import { useEmergencyContact, useHousehold, usePets, useVehicles } from "@/hooks/data"
import { formatPhone } from "@/phone/phone"
import { Avatar } from "./Avatar"
import { Household } from "./Household"

const row =
  "flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground"

/** Perfil do morador (histórias 3 e 4, mockup 26_perfil). */
export function ProfileScreen() {
  const t = useTranslations("profile")
  const tk = useTranslations("kindLabels")
  const th = useTranslations("household")
  const me = useMe()
  const household = useHousehold(me.apartmentId)
  const vehicles = useVehicles(me.apartmentId)
  const pets = usePets(me.apartmentId)
  const contact = useEmergencyContact(me.apartmentId)
  const mine = household.data?.find((r) => r.personId === me.person?.id)
  const responsible = !!mine?.isResponsible

  if (!me.person || !me.apartmentId)
    return (
      <ScreenPage profile="resident" slug="profile">
        {null}
      </ScreenPage>
    )

  return (
    <ScreenPage profile="resident" slug="profile">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-4">
        <section className={`${row} gap-4 p-4`}>
          <Avatar name={me.person.name} photo={me.person.photo} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-extrabold">{me.person.name}</p>
            <p className="text-muted-foreground">
              {mine ? (mine.isResponsible ? th("responsible") : tk(mine.kind)) : ""} ·{" "}
              {me.apartmentNumber}
            </p>
            <p className="text-sm text-muted-foreground">{formatPhone(me.person.phone)}</p>
          </div>
          <Link
            href="/resident/profile/edit/"
            aria-label={t("edit")}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-border hover:bg-muted"
          >
            <Pencil aria-hidden className="size-5" />
          </Link>
        </section>

        <Household
          apartmentId={me.apartmentId}
          apartmentNumber={me.apartmentNumber ?? ""}
          myPersonId={me.person.id}
          canInvite={responsible}
          canEdit={responsible}
          personHref={(r) => `/resident/person/?id=${r.residencyId}`}
        />

        <section aria-labelledby="cars-pets" className="flex flex-col gap-2">
          <h2 id="cars-pets" className="text-lg">
            {t("carsAndPets")}
          </h2>
          <ul className="flex flex-col gap-2">
            {vehicles.data?.map((v) => (
              <li key={v.id}>
                <ItemLink href={responsible ? `/resident/vehicle/?id=${v.id}` : undefined}>
                  <Car aria-hidden className="size-6 text-link" />
                  <span className="flex-1">
                    <span className="block font-semibold">
                      {v.model} {v.color.toLowerCase()}
                    </span>
                    <span className="block font-mono text-sm text-muted-foreground">
                      {formatPlate(v.plate)}
                    </span>
                  </span>
                </ItemLink>
              </li>
            ))}
            {pets.data?.map((p) => (
              <li key={p.id}>
                <ItemLink href={responsible ? `/resident/pet/?id=${p.id}` : undefined}>
                  <PawPrint aria-hidden className="size-6 text-link" />
                  <span className="flex-1">
                    <span className="block font-semibold">{p.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {t(`petKinds.${p.kind}`)}
                    </span>
                  </span>
                </ItemLink>
              </li>
            ))}
          </ul>
          {vehicles.data?.length === 0 && pets.data?.length === 0 && (
            <p className="text-muted-foreground">{t("noCarsPets")}</p>
          )}
          {responsible && (
            <div className="flex flex-wrap gap-2">
              <Link href="/resident/vehicle/" className="btn-outline">
                <Plus aria-hidden className="size-5" />
                {t("addCar")}
              </Link>
              <Link href="/resident/pet/" className="btn-outline">
                <Plus aria-hidden className="size-5" />
                {t("addPet")}
              </Link>
            </div>
          )}
        </section>

        <section aria-labelledby="emergency" className="flex flex-col gap-2">
          <h2 id="emergency" className="sr-only">
            {t("emergency")}
          </h2>
          <ItemLink href={responsible ? "/resident/emergency-contact/" : undefined}>
            <Phone aria-hidden className="size-6 text-destructive" />
            <span className="flex-1">
              <span className="block font-semibold">{t("emergency")}</span>
              <span className="block text-sm text-muted-foreground">
                {contact.data
                  ? `${contact.data.name} (${contact.data.relationship}) · ${formatPhone(contact.data.phone)}`
                  : t("emergencyNone")}
              </span>
            </span>
          </ItemLink>
        </section>

        <AccountSection compact />
      </div>
    </ScreenPage>
  )
}

function ItemLink({ href, children }: { href?: string; children: React.ReactNode }) {
  if (!href) return <div className={row}>{children}</div>
  return (
    <Link href={href} className={`${row} hover:bg-muted`}>
      {children}
      <ChevronRight aria-hidden className="size-5" />
    </Link>
  )
}
