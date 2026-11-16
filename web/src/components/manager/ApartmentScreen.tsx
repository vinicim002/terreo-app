"use client"

import { Car, PawPrint } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Status } from "@/components/forms/fields"
import { Header } from "@/components/layout/Header"
import { Household } from "@/components/profile/Household"
import { useMe } from "@/auth/useMe"
import { formatPlate } from "@/domain/plate"
import {
  serviceContext,
  useApartment,
  useHousehold,
  usePets,
  useServiceMutation,
  useVehicles,
} from "@/hooks/data"
import { getServices } from "@/services"

/** Apartamento pelo síndico (RF-028, RF-028a): pessoas, carros, animais; reenviar convite e trocar responsável. */
export function ApartmentScreen() {
  const t = useTranslations("admin")
  const tp = useTranslations("profile")
  const id = useSearchParams().get("id") ?? undefined
  const me = useMe()
  const apartment = useApartment(id)
  const people = useHousehold(id)
  const vehicles = useVehicles(id)
  const pets = usePets(id)
  const [done, setDone] = useState<string>()
  const resend = useServiceMutation((residencyId: string) =>
    getServices().residents.resendInvite(serviceContext(), residencyId),
  )
  const setResponsible = useServiceMutation((residencyId: string) =>
    getServices().admin.setResponsible(serviceContext(), id!, residencyId),
  )
  const number = apartment.data?.number ?? ""
  const responsible = people.data?.find((r) => r.isResponsible)

  return (
    <>
      <Header
        title={t("apartment", { number })}
        subtitle={apartment.data ? t("floor", { floor: apartment.data.floor }) : undefined}
        showBack
        backHref="/manager/residents/"
      />
      <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-4">
        {done && <Status>{done}</Status>}
        {id && me.person && (
          <Household
            apartmentId={id}
            apartmentNumber={number}
            myPersonId={me.person.id}
            canInvite={false}
            canEdit
            personHref={(r) => `/manager/person/?id=${r.residencyId}`}
          />
        )}
        {people.data?.length === 0 && (
          <>
            <p className="text-muted-foreground">{t("noPeople")}</p>
            <Link href={`/manager/apartment/register/?id=${id}`} className="btn-primary">
              {t("register")}
            </Link>
          </>
        )}
        {responsible?.status === "pending" && (
          <button
            type="button"
            className="btn-outline"
            onClick={async () => {
              await resend.mutateAsync(responsible.residencyId)
              setDone(t("resent"))
            }}
          >
            {t("resend")}
          </button>
        )}
        {!responsible && people.data && people.data.length > 0 && (
          <section className="flex flex-col gap-2">
            <p className="font-semibold">{t("none")}</p>
            {people.data.map((r) => (
              <button
                key={r.residencyId}
                type="button"
                className="btn-outline justify-start"
                onClick={async () => {
                  await setResponsible.mutateAsync(r.residencyId)
                  setDone(t("responsibleChanged"))
                }}
              >
                {t("setResponsible")}: {r.name}
              </button>
            ))}
          </section>
        )}
        {responsible &&
          people.data
            ?.filter((r) => !r.isResponsible && r.status === "active")
            .map((r) => (
              <button
                key={r.residencyId}
                type="button"
                className="btn-outline justify-start"
                onClick={async () => {
                  await setResponsible.mutateAsync(r.residencyId)
                  setDone(t("responsibleChanged"))
                }}
              >
                {t("setResponsible")}: {r.name}
              </button>
            ))}
        <section aria-labelledby="apt-cars" className="flex flex-col gap-2">
          <h2 id="apt-cars" className="text-lg">
            {tp("carsAndPets")}
          </h2>
          {vehicles.data?.map((v) => (
            <p
              key={v.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground"
            >
              <Car aria-hidden className="size-5 text-link" />
              {v.model} {v.color.toLowerCase()} ·{" "}
              <span className="font-mono">{formatPlate(v.plate)}</span>
            </p>
          ))}
          {pets.data?.map((p) => (
            <p
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground"
            >
              <PawPrint aria-hidden className="size-5 text-link" />
              {p.name} · {tp(`petKinds.${p.kind}`)}
            </p>
          ))}
          {vehicles.data?.length === 0 && pets.data?.length === 0 && (
            <p className="text-muted-foreground">{tp("noCarsPets")}</p>
          )}
        </section>
      </main>
    </>
  )
}
