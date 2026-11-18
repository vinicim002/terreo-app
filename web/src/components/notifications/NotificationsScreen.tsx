"use client"

import {
  BellRing,
  CheckCheck,
  ShieldCheck,
  Mail,
  MessageSquareText,
  Search,
  CheckCircle2,
  Clock,
  Megaphone,
  Package,
  Pencil,
  Siren,
  UserPlus,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Toggle } from "@/components/forms/fields"
import { Empty, KindIcon, Section, Tabs, useDates } from "@/components/comm/shared"
import {
  serviceContext,
  useNotificationPrefs,
  useNotifications,
  useServiceMutation,
} from "@/hooks/data"
import { relativeDayGroup } from "@/i18n/datetime"
import { PROFILES_DEF } from "@/navigation/screens"
import type { Profile } from "@/preferences/types"
import { getServices } from "@/services"
import type { NotificationPrefsInput, NotificationView } from "@/services/contracts"
import type { NotificationType } from "@/services/schemas"

const ICON: Record<NotificationType, LucideIcon> = {
  notice: Megaphone,
  "notice-updated": Pencil,
  "notice-resolved": CheckCircle2,
  "notice-reminder": Clock,
  meeting: Users,
  "meeting-reminder": Clock,
  "meeting-summary": Users,
  poll: Vote,
  "poll-closed": Vote,
  delivery: Package,
  "delivery-reminder": Package,
  mail: Mail,
  visitor: UserPlus,
  "lost-found": Search,
  memo: MessageSquareText,
  emergency: Siren,
  "emergency-update": ShieldCheck,
  "general-alert": BellRing,
  "general-alert-closed": CheckCircle2,
}

function targetHref(base: string, n: NotificationView) {
  if (!n.target) return null
  switch (n.target.kind) {
    case "notice":
      return `${base}/notice/?id=${n.target.id}`
    case "meeting":
      return `${base}/meeting/?id=${n.target.id}`
    case "poll":
      return `${base}/polls/`
    case "delivery":
      return `${base}/deliveries/`
    case "visitor":
      return `${base}/visitors/`
    case "lost-item":
      return `${base}/lost-and-found/`
    case "memo":
      return `${base}/memos/`
    // Spec 005: o morador acompanha na tela de emergência; portaria e síndico, na lista de alertas.
    case "emergency":
      return base === "/resident" ? `${base}/emergency/` : `${base}/emergency-alert/`
    case "general-alert":
      return base === "/resident" ? `${base}/emergency/` : `${base}/general-alert/`
  }
}

function Center({ profile }: { profile: Profile }) {
  const t = useTranslations("comm.notifications")
  const dates = useDates()
  const router = useRouter()
  const base = PROFILES_DEF[profile].basePath
  const { data } = useNotifications()
  const markRead = useServiceMutation((id: string) =>
    getServices().notifications.markRead(serviceContext(), id),
  )
  const readAll = useServiceMutation(() =>
    getServices().notifications.markAllRead(serviceContext()),
  )
  const now = new Date()
  const groups = (["today", "yesterday", "earlier"] as const)
    .map((g) => ({
      g,
      items: (data ?? []).filter((n) => relativeDayGroup(n.createdAt, now) === g),
    }))
    .filter((x) => x.items.length > 0)
  const unread = data?.filter((n) => !n.read).length ?? 0

  const open = (n: NotificationView) => {
    const href = targetHref(base, n)
    markRead.mutate(n.id, { onSuccess: () => href && router.push(href) })
  }

  return (
    <>
      {unread > 0 && (
        <button type="button" className="btn-outline" onClick={() => readAll.mutate(undefined)}>
          <CheckCheck aria-hidden className="size-5" />
          {t("readAll")}
        </button>
      )}
      {data && data.length === 0 && <Empty>{t("empty")}</Empty>}
      {groups.map(({ g, items }) => (
        <Section key={g} title={t(g)}>
          <ul className="flex flex-col gap-2">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={`flex min-h-16 w-full items-start gap-3 rounded-xl border p-3 text-left hover:bg-muted ${
                    n.read
                      ? "border-border bg-card text-card-foreground"
                      : "border-primary bg-accent text-accent-foreground"
                  }`}
                >
                  <KindIcon icon={ICON[n.type]} tone={n.read ? "muted" : "brand"} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm">
                      <span className={n.read ? "" : "font-bold"}>{t(`types.${n.type}`)}</span>
                      {!n.read && <span className="sr-only">({t("unreadMark")})</span>}
                      <span className="ml-auto shrink-0 text-xs">
                        {g === "earlier" ? dates.short(n.createdAt) : dates.time(n.createdAt)}
                      </span>
                    </span>
                    <span className="block font-semibold">{n.title}</span>
                    <span className="line-clamp-2 block text-sm">{n.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      ))}
    </>
  )
}

const GENERAL = ["notices", "meetings", "polls"] as const
const PERSONAL = ["deliveries", "visitors"] as const

function Prefs({ profile }: { profile: Profile }) {
  const t = useTranslations("comm.prefs")
  const { data } = useNotificationPrefs()
  const save = useServiceMutation((prefs: NotificationPrefsInput) =>
    getServices().notifications.setPrefs(serviceContext(), prefs),
  )
  if (!data) return null
  const current = save.variables && save.isPending ? save.variables : data
  const general = profile === "front-desk" ? (["notices"] as const) : GENERAL
  const setApp = (key: keyof NotificationPrefsInput["app"], v: boolean) =>
    save.mutate({ ...current, app: { ...current.app, [key]: v } })
  const setWhatsapp = (key: keyof NotificationPrefsInput["whatsapp"], v: boolean) =>
    save.mutate({ ...current, whatsapp: { ...current.whatsapp, [key]: v } })

  return (
    <>
      <p className="text-muted-foreground">{t("intro")}</p>
      {general.map((key) => (
        <section key={key} className="flex flex-col gap-2 rounded-xl border border-border p-3">
          <h2 className="text-lg">{t(`types.${key}`)}</h2>
          <Toggle label={t("inApp")} checked={current.app[key]} onChange={(v) => setApp(key, v)} />
          <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <Users aria-hidden className="size-4" />
            {t("whatsapp")}: {t("group")}
          </p>
        </section>
      ))}
      {profile === "resident" &&
        PERSONAL.map((key) => (
          <section key={key} className="flex flex-col gap-2 rounded-xl border border-border p-3">
            <h2 className="text-lg">{t(`types.${key}`)}</h2>
            <Toggle
              label={t("inApp")}
              checked={current.app[key]}
              onChange={(v) => setApp(key, v)}
            />
            <Toggle
              label={t("private")}
              checked={current.whatsapp[key]}
              onChange={(v) => setWhatsapp(key, v)}
            />
          </section>
        ))}
      <section className="flex flex-col gap-2 rounded-xl border-2 border-destructive p-3">
        <h2 className="flex items-center gap-2 text-lg">
          <Siren aria-hidden className="size-5 text-destructive" />
          {t("types.emergency")}
        </h2>
        <Toggle
          label={t("alwaysOn")}
          hint={t("emergencyHint")}
          checked
          onChange={() => {}}
          disabled
        />
      </section>
      {save.isSuccess && (
        <p role="status" className="text-sm font-medium">
          {t("saved")}
        </p>
      )}
    </>
  )
}

/** Notificações (mockup 29): central agrupada e "Como receber" (História 5). */
export function NotificationsScreen({ profile }: { profile: Profile }) {
  const t = useTranslations("comm.notifications")
  const [tab, setTab] = useState<"center" | "prefs">("center")
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 py-4">
      <Tabs
        label={t("center")}
        options={["center", "prefs"] as const}
        value={tab}
        onChange={setTab}
        labelOf={(v) => t(v)}
      />
      {tab === "center" ? <Center profile={profile} /> : <Prefs profile={profile} />}
    </div>
  )
}
