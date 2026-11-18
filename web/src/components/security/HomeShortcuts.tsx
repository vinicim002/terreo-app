"use client"

import { BellRing, Contact, Siren } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useOpenEmergencies } from "@/hooks/data"

/** Início do morador: emergência em vermelho e, ao lado, contatos (CS-005: ligar em 2 toques). */
export function ResidentSafetyShortcuts() {
  const t = useTranslations("security.home")
  return (
    <div className="mx-auto grid max-w-xl grid-cols-[2fr_1fr] gap-2 px-4 pt-4">
      <Link
        href="/resident/emergency/"
        className="flex min-h-16 min-w-0 items-center justify-center gap-2 rounded-xl bg-destructive px-3 text-lg font-extrabold text-destructive-foreground [overflow-wrap:anywhere]"
      >
        <Siren aria-hidden className="size-6 shrink-0" />
        {t("emergency")}
      </Link>
      <Link
        href="/resident/contacts/"
        className="flex min-h-16 min-w-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 font-bold text-card-foreground [overflow-wrap:anywhere] hover:bg-muted"
      >
        <Contact aria-hidden className="size-5 shrink-0" />
        {t("contacts")}
      </Link>
    </div>
  )
}

/** Painel da portaria: cartões dos alertas em aberto e o botão do alerta geral. */
export function DeskSafety() {
  const t = useTranslations("security")
  const { data: open } = useOpenEmergencies()
  return (
    <>
      {open?.map((a) => (
        <Link
          key={a.id}
          href="/front-desk/emergency-alert/"
          className="flex min-h-16 items-center gap-3 rounded-2xl bg-destructive p-4 text-destructive-foreground"
        >
          <Siren aria-hidden className="size-7 shrink-0" />
          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            <span className="block text-lg font-extrabold">
              {t("home.deskCard", { n: a.apartment })}
            </span>
            <span className="block text-sm">
              {t(`kind.${a.kind}`)} ·{" "}
              {a.acknowledgedBy
                ? t("desk.goingBy", { name: a.acknowledgedBy })
                : t("history.status.open")}
            </span>
          </span>
        </Link>
      ))}
      <Link
        href="/front-desk/general-alert/"
        className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-destructive bg-card px-4 font-bold text-destructive"
      >
        <BellRing aria-hidden className="size-6" />
        {t("general.send")}
      </Link>
    </>
  )
}
