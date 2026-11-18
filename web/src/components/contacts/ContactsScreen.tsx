"use client"

import {
  Flame,
  HeartPulse,
  MessageCircle,
  Pencil,
  Phone,
  Shield,
  ShieldCheck,
  UserRound,
  Zap,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { createElement, useState } from "react"
import { Section } from "@/components/comm/shared"
import { useContacts } from "@/hooks/data"
import type { ContactView } from "@/services/contracts"
import { telLink, whatsappLink } from "@/services/dialable"

const ICONS: Record<string, LucideIcon> = {
  frontDesk: ShieldCheck,
  registry: UserRound,
  "192": HeartPulse,
  "193": Flame,
  "190": Shield,
  "199": Shield,
  "0800": Zap,
  other: Phone,
}

function iconKey(c: ContactView) {
  if (c.frontDesk) return "frontDesk"
  if (c.fromRegistry) return "registry"
  if (c.phone && c.phone in ICONS) return c.phone
  if (c.phone?.startsWith("0800")) return "0800"
  return "other"
}

function ContactIcon({ contact }: { contact: ContactView }) {
  return createElement(ICONS[iconKey(contact)], { "aria-hidden": true, className: "size-6" })
}

/** Contatos importantes (mockup 15, História 3): busca, "Do prédio" e "Emergência e serviços", ligar e WhatsApp. */
export function ContactsScreen({ editHref }: { editHref?: string }) {
  const t = useTranslations("security.contacts")
  const [search, setSearch] = useState("")
  const { data } = useContacts(search)
  const empty = data && data.building.length + data.emergency.length === 0

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <input
        type="search"
        aria-label={t("search")}
        placeholder={t("search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="min-h-14 rounded-xl border border-input bg-card px-4 text-lg text-card-foreground"
      />
      {editHref && (
        <Link href={editHref} className="btn-outline min-h-12 self-start">
          <Pencil aria-hidden className="size-5" />
          {t("edit")}
        </Link>
      )}
      {empty && <p className="text-muted-foreground">{t("none")}</p>}
      {(["building", "emergency"] as const).map((group) =>
        data && data[group].length > 0 ? (
          <Section key={group} title={t(`groups.${group}`)}>
            <ul className="flex flex-col gap-2">
              {data[group].map((c) => (
                <ContactRow key={c.id ?? `${c.role}-${c.name}`} contact={c} />
              ))}
            </ul>
          </Section>
        ) : null,
      )}
    </div>
  )
}

function ContactRow({ contact: c }: { contact: ContactView }) {
  const t = useTranslations("security.contacts")
  const emergency = c.group === "emergency"
  const subtitle = c.fromRegistry
    ? `${t(`roles.${c.role}`)}${c.display ? ` · ${c.display}` : ` · ${t("noPhone")}`}`
    : [c.display, c.description].filter(Boolean).join(" · ")
  return (
    <li className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground">
      <span
        className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${
          emergency ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"
        }`}
      >
        <ContactIcon contact={c} />
      </span>
      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <span className="block font-semibold">{c.name}</span>
        <span className="block text-sm text-muted-foreground">{subtitle}</span>
      </span>
      {c.phone && c.isMobile && (
        <a
          href={whatsappLink(c.phone)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground"
        >
          <MessageCircle aria-hidden className="size-6" />
          <span className="sr-only">{t("whatsapp", { name: c.name })}</span>
        </a>
      )}
      {c.phone && (
        <a
          href={telLink(c.phone)}
          className={`inline-flex size-12 shrink-0 items-center justify-center rounded-xl ${
            emergency
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          <Phone aria-hidden className="size-6" />
          <span className="sr-only">{t("call", { name: c.name })}</span>
        </a>
      )}
    </li>
  )
}
