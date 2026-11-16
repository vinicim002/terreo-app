"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { errorKey } from "@/components/forms/errors"
import { ConfirmBox, Status } from "@/components/forms/fields"
import { Header } from "@/components/layout/Header"
import { useMe } from "@/auth/useMe"
import { useHousehold, useResidency, useServiceMutation, serviceContext } from "@/hooks/data"
import { countryOf, formatPhone } from "@/phone/phone"
import { getServices } from "@/services"
import type { ResidencyPatch } from "@/services/contracts"
import { Avatar } from "./Avatar"
import { PersonForm } from "./PersonForm"

/**
 * Pessoa do apartamento (História 3; o síndico usa a mesma tela, RF-028a): ver; e, para quem pode,
 * editar nome, tipo, permissões e celular, reenviar convite e remover com confirmação.
 */
export function PersonScreen({
  backHref,
  asManager = false,
}: {
  backHref: string
  asManager?: boolean
}) {
  const t = useTranslations("household")
  const tk = useTranslations("kindLabels")
  const tAll = useTranslations()
  const router = useRouter()
  const id = useSearchParams().get("id") ?? undefined
  const me = useMe()
  const person = useResidency(id)
  const household = useHousehold(asManager ? undefined : me.apartmentId)
  const [error, setError] = useState<string>()
  const [done, setDone] = useState<string>()
  const [confirming, setConfirming] = useState(false)
  const ctx = serviceContext
  const update = useServiceMutation((patch: ResidencyPatch) =>
    getServices().residents.update(ctx(), id!, patch),
  )
  const resend = useServiceMutation(() => getServices().residents.resendInvite(ctx(), id!))
  const remove = useServiceMutation(() => getServices().residents.remove(ctx(), id!))

  const r = person.data
  const iAmResponsible = household.data?.some(
    (x) => x.personId === me.person?.id && x.isResponsible,
  )
  const canEdit = !!r && r.personId !== me.person?.id && (asManager || iAmResponsible)

  return (
    <>
      <Header title={r?.name ?? t("title", { number: "" })} showBack backHref={backHref} />
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
        {person.isError && <Status>{t("notFound")}</Status>}
        {r && (
          <div className="flex items-center gap-4">
            <Avatar name={r.name} photo={r.photo} size="lg" />
            <div>
              <p className="text-lg font-semibold">
                {r.isResponsible ? t("responsible") : tk(r.kind)}
              </p>
              <p className="text-muted-foreground">{formatPhone(r.phone)}</p>
              {r.status === "pending" && (
                <p className="text-sm font-semibold text-warning">{t("pending")}</p>
              )}
            </div>
          </div>
        )}
        {done && <Status>{done}</Status>}
        {r && canEdit && (
          <PersonForm
            key={r.residencyId + r.lastInviteAt}
            initial={{
              name: r.name,
              phone: { country: countryOf(r.phone), text: formatPhone(r.phone) },
              kind: r.kind,
              canRegisterDeliveries: r.canRegisterDeliveries,
              canVotePolls: r.canVotePolls,
            }}
            kinds={r.isResponsible ? ["owner", "tenant"] : ["family", "tenant", "owner"]}
            lockPermissions={r.isResponsible}
            submitLabel={t("save")}
            phoneWarning={t("phoneChangeWarn")}
            error={error}
            onSubmit={async (value) => {
              setError(undefined)
              setDone(undefined)
              try {
                await update.mutateAsync(value)
                setDone(t("saved"))
              } catch (e) {
                setError(tAll(errorKey(e)))
              }
            }}
          />
        )}
        {r && canEdit && r.status === "pending" && (
          <button
            type="button"
            className="btn-outline"
            onClick={async () => {
              await resend.mutateAsync(undefined)
              setDone(t("resent"))
            }}
          >
            {t("resend")}
          </button>
        )}
        {r &&
          canEdit &&
          !(r.isResponsible && !asManager) &&
          (confirming ? (
            <ConfirmBox
              text={t("removeConfirm", { name: r.name })}
              yes={t("removeYes")}
              no={t("cancel")}
              onNo={() => setConfirming(false)}
              onYes={async () => {
                try {
                  await remove.mutateAsync(undefined)
                  router.replace(backHref)
                } catch (e) {
                  setError(tAll(errorKey(e)))
                  setConfirming(false)
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="btn-outline text-destructive"
              onClick={() => setConfirming(true)}
            >
              {t("remove")}
            </button>
          ))}
        {r && !canEdit && r.personId !== me.person?.id && <Status>{t("onlyResponsible")}</Status>}
      </main>
    </>
  )
}
