"use client"

import { ShieldCheck } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { errorKey } from "@/components/forms/errors"
import { Header } from "@/components/layout/Header"
import { PersonForm } from "@/components/profile/PersonForm"
import { serviceContext, useApartment, useServiceMutation } from "@/hooks/data"
import { getServices } from "@/services"

/** Cadastro do responsável pelo síndico (H5-4, mockup 40): nome, celular e tipo; sem CPF nem nascimento. */
export function RegisterResponsibleScreen() {
  const t = useTranslations("admin")
  const tAll = useTranslations()
  const router = useRouter()
  const id = useSearchParams().get("id") ?? undefined
  const apartment = useApartment(id)
  const [error, setError] = useState<string>()
  const register = useServiceMutation(
    (v: { name: string; phone: string; kind: "owner" | "tenant" }) =>
      getServices().admin.registerResponsible(serviceContext(), id!, v),
  )

  return (
    <>
      <Header
        title={t("registerTitle", { number: apartment.data?.number ?? "" })}
        showBack
        backHref="/manager/residents/"
      />
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
        <PersonForm
          initial={{
            name: "",
            phone: { country: "BR", text: "" },
            kind: "owner",
            canRegisterDeliveries: true,
            canVotePolls: true,
          }}
          kinds={["owner", "tenant"]}
          showPermissions={false}
          submitLabel={t("saveAndInvite")}
          error={error}
          onSubmit={async (value) => {
            setError(undefined)
            try {
              await register.mutateAsync({
                name: value.name,
                phone: value.phone,
                kind: value.kind as "owner" | "tenant",
              })
              router.push(`/manager/apartment/?id=${id}`)
            } catch (e) {
              setError(tAll(errorKey(e)))
            }
          }}
        />
        <p className="flex gap-3 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
          <ShieldCheck aria-hidden className="size-5 shrink-0" />
          {t("registerHint")}
        </p>
      </main>
    </>
  )
}
