"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { errorKey } from "@/components/forms/errors"
import { Status } from "@/components/forms/fields"
import { Header } from "@/components/layout/Header"
import { useMe } from "@/auth/useMe"
import { useHousehold, useServiceMutation, serviceContext } from "@/hooks/data"
import { getServices } from "@/services"
import type { InviteInput } from "@/services/contracts"
import { PersonForm } from "./PersonForm"

/** Convidar pessoa para o apartamento — só o responsável (História 3, RF-015). */
export function InviteScreen() {
  const t = useTranslations("household")
  const tAll = useTranslations()
  const router = useRouter()
  const me = useMe()
  const household = useHousehold(me.apartmentId)
  const [error, setError] = useState<string>()
  const invite = useServiceMutation((input: InviteInput) =>
    getServices().residents.invite(serviceContext(), input),
  )

  const isResponsible = household.data?.some((r) => r.personId === me.person?.id && r.isResponsible)
  const title = t("inviteTitle", { number: me.apartmentNumber ?? "" })

  return (
    <>
      <Header title={title} showBack backHref="/resident/profile/" />
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
        <p className="text-muted-foreground">{t("inviteHint")}</p>
        {household.data && !isResponsible ? (
          <Status>{t("onlyResponsible")}</Status>
        ) : (
          <PersonForm
            initial={{
              name: "",
              phone: { country: "BR", text: "" },
              kind: "family",
              canRegisterDeliveries: true,
              canVotePolls: false,
            }}
            kinds={["family", "tenant", "owner"]}
            submitLabel={t("send")}
            error={error}
            onSubmit={async (value) => {
              setError(undefined)
              try {
                await invite.mutateAsync(value)
                router.push("/resident/profile/")
              } catch (e) {
                setError(tAll(errorKey(e)))
              }
            }}
          />
        )}
      </main>
    </>
  )
}
