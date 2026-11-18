"use client"

import { ChevronRight, Megaphone, Package, Plus, User, Users, Vote } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { KindIcon, NOTICE_ICON, Section, useDates } from "@/components/comm/shared"
import { dayKeyBrasilia } from "@/i18n/datetime"
import { useMeetings, useMyDeliveries, useMyVisitors, useNotices } from "@/hooks/data"

const card =
  "flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground hover:bg-muted"

/** Destaques da comunicação no início do morador (spec 003, T044): avisos não lidos e a próxima reunião. */
export function ResidentHighlights() {
  const t = useTranslations("comm.home")
  const tm = useTranslations("comm.meetings")
  const dates = useDates()
  const { data: notices } = useNotices("unread")
  const { data: meetings } = useMeetings()
  const next = meetings?.upcoming[0]
  const tf = useTranslations("fd.home")
  const { data: deliveries } = useMyDeliveries()
  const { data: visitors } = useMyVisitors()
  const atDesk = deliveries?.atDesk.length ?? 0
  const today = dayKeyBrasilia(new Date())
  const visitor = visitors?.expected.find((v) => v.day === today)
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-4">
      {atDesk > 0 && (
        <Link href="/resident/deliveries/" className={card} data-testid="home-at-desk">
          <KindIcon icon={Package} />
          <span className="flex-1 font-semibold">{tf("atDesk", { count: atDesk })}</span>
          <ChevronRight aria-hidden className="size-5" />
        </Link>
      )}
      {visitor && (
        <Link href="/resident/visitors/" className={card}>
          <KindIcon icon={User} />
          <span className="flex-1 font-semibold">
            {tf("nextVisitor", { name: visitor.name, from: visitor.fromTime })}
          </span>
          <ChevronRight aria-hidden className="size-5" />
        </Link>
      )}
      <Section title={t("unreadNotices")}>
        {notices?.items.length === 0 && <p className="text-muted-foreground">{t("noUnread")}</p>}
        <ul className="flex flex-col gap-2">
          {notices?.items.slice(0, 3).map((n) => (
            <li key={n.id}>
              <Link href={`/resident/notice/?id=${n.id}`} className={card}>
                <KindIcon icon={NOTICE_ICON[n.kind]} />
                <span className="min-w-0 flex-1 font-semibold">{n.title}</span>
                <ChevronRight aria-hidden className="size-5" />
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/resident/notices/" className="self-start font-semibold text-link underline">
          {t("seeAll")}
        </Link>
      </Section>
      {next && (
        <Section title={t("nextMeeting")}>
          <Link href={`/resident/meeting/?id=${next.id}`} className={card}>
            <KindIcon icon={Users} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold first-letter:uppercase">
                {tm("when", { date: dates.long(next.startsAt), time: dates.time(next.startsAt) })}
              </span>
              <span className="block text-sm text-muted-foreground">{next.place}</span>
            </span>
            <ChevronRight aria-hidden className="size-5" />
          </Link>
        </Section>
      )}
    </div>
  )
}

/** Atalhos do síndico no painel (spec 003, T044). */
export function ManagerShortcuts() {
  const t = useTranslations("comm.home")
  const links = [
    { href: "/manager/notice/edit/", label: t("newNotice"), icon: Megaphone },
    { href: "/manager/poll/new/", label: t("newPoll"), icon: Vote },
    { href: "/manager/meeting/edit/", label: t("newMeeting"), icon: Users },
  ]
  return (
    <div className="mx-auto max-w-xl px-4 pt-4">
      <Section title={t("shortcuts")}>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {links.map(({ href, label, icon }) => (
            <li key={href}>
              <Link href={href} className={card}>
                <KindIcon icon={icon} />
                <span className="flex-1 font-semibold">{label}</span>
                <Plus aria-hidden className="size-5" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
