"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Toggle } from "@/components/forms/fields"
import { serviceContext, useServiceMutation } from "@/hooks/data"
import { getServices } from "@/services"

/**
 * "Mostrar meu celular nos contatos" (spec 005, esclarecimento 2): só síndico e porteiro-chefe. Para quem não pode,
 * o serviço recusa e a opção não aparece.
 */
export function ShowPhoneToggle() {
  const t = useTranslations("security.showPhone")
  const { data, isError } = useQuery({
    queryKey: ["contacts", "show-my-phone"],
    queryFn: () => getServices().contacts.showMyPhone(serviceContext()),
    retry: false,
  })
  const set = useServiceMutation((show: boolean) =>
    getServices().contacts.setShowMyPhone(serviceContext(), show),
  )
  if (isError || data === undefined) return null
  return (
    <Toggle
      label={t("label")}
      hint={t("hint")}
      checked={set.isPending ? !!set.variables : data}
      onChange={(v) => set.mutate(v)}
      disabled={set.isPending}
    />
  )
}
