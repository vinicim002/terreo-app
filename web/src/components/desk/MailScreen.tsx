"use client"

import { Mail } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { ErrorText } from "@/components/comm/shared"
import { serviceContext, useServiceMutation } from "@/hooks/data"
import { getServices } from "@/services"

/** Correspondência (História 2, RF-009): um toque avisa o apartamento, sem dizer o que é. */
export function MailScreen() {
  const t = useTranslations("fd")
  const [number, setNumber] = useState("")
  const [sent, setSent] = useState<string | null>(null)
  const mail = useServiceMutation((n: string) => getServices().deliveries.mail(serviceContext(), n))
  return (
    <form
      className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault()
        mail.mutate(number, {
          onSuccess: () => {
            setSent(number)
            setNumber("")
          },
        })
      }}
    >
      <p className="text-muted-foreground">{t("mail.hint")}</p>
      <label htmlFor="mail-apt" className="text-sm font-semibold">
        {t("receive.apartment")}
      </label>
      <input
        id="mail-apt"
        inputMode="numeric"
        value={number}
        onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
        className="min-h-14 rounded-xl border border-input bg-card px-4 text-2xl font-extrabold text-card-foreground"
      />
      {mail.isError && <ErrorText>{t("receive.notFound")}</ErrorText>}
      {sent && !mail.isError && (
        <p role="status" className="font-semibold">
          {t("apartment.mailSent")} ({sent})
        </p>
      )}
      <button
        type="submit"
        className="btn-primary min-h-14 text-lg"
        disabled={!number || mail.isPending}
      >
        <Mail aria-hidden className="size-6" />
        {t("mail.send")}
      </button>
    </form>
  )
}
