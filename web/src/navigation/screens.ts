/**
 * Catálogo único de telas (contracts/rotas.md). Gera as rotas, a barra de baixo, "Mais",
 * "Todos os serviços" e as chaves de tradução esperadas (`screens.<slug>`).
 */
import {
  AlarmClock,
  BadgeAlert,
  Bell,
  BellRing,
  Building2,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  Contact,
  FileText,
  Hammer,
  HandCoins,
  HelpCircle,
  Home,
  KeyRound,
  Lightbulb,
  ListChecks,
  Mail,
  Megaphone,
  Menu,
  Mic,
  Package,
  PackagePlus,
  Plane,
  Accessibility,
  ShieldAlert,
  ShoppingBag,
  Siren,
  Sparkles,
  Star,
  Truck,
  UserPlus,
  UserRound,
  Users,
  Vote,
  Volume2,
  Wrench,
  LayoutGrid,
  Search,
  Handshake,
  Gavel,
  Store,
  CalendarClock,
  Smile,
  type LucideIcon,
} from "lucide-react"
import type { Profile } from "@/preferences/types"

export interface ScreenDef {
  /** Segmento da rota em inglês; "" é o início do perfil. */
  slug: string
  icon: LucideIcon
  /** Grupo em "Mais" / "Todos os serviços" (chave `groups.<group>`). */
  group?: string
  /** Destino fixo, quando a tela é a mesma para todos (ex.: acessibilidade → /settings). */
  href?: string
}

export interface ProfileDef {
  profile: Profile
  basePath: `/${string}`
  /** Slugs da barra de baixo, na ordem (o primeiro é sempre o início ""). */
  nav: [string, string, string, string]
  /** Tela que lista as demais funcionalidades ("more" ou "services"). */
  hub: string
  /** Ordem dos grupos no hub. */
  groups: string[]
  screens: ScreenDef[]
}

const settings = "/settings"

export const PROFILES_DEF: Record<Profile, ProfileDef> = {
  resident: {
    profile: "resident",
    basePath: "/resident",
    nav: ["", "deliveries", "suggestions", "profile"],
    hub: "services",
    groups: ["communication", "frontDesk", "building", "useful", "other"],
    screens: [
      { slug: "", icon: Home },
      { slug: "services", icon: LayoutGrid },
      { slug: "profile", icon: UserRound },
      { slug: "notifications", icon: Bell },
      { slug: "notices", icon: Megaphone, group: "communication" },
      { slug: "polls", icon: Vote, group: "communication" },
      { slug: "calendar", icon: CalendarDays, group: "communication" },
      { slug: "meetings", icon: Users, group: "communication" },
      { slug: "suggestions", icon: Lightbulb, group: "communication" },
      { slug: "deliveries", icon: Package, group: "frontDesk" },
      { slug: "visitors", icon: UserPlus, group: "frontDesk" },
      { slug: "on-duty", icon: AlarmClock, group: "frontDesk" },
      { slug: "lost-and-found", icon: Search, group: "frontDesk" },
      { slug: "travel-mode", icon: Plane, group: "frontDesk" },
      { slug: "report-issue", icon: Wrench, group: "building" },
      { slug: "moves", icon: Truck, group: "building" },
      { slug: "improvements", icon: Hammer, group: "building" },
      { slug: "finances", icon: HandCoins, group: "building" },
      { slug: "key-request", icon: KeyRound, group: "building" },
      { slug: "noise-report", icon: Volume2, group: "building" },
      { slug: "warnings", icon: Gavel, group: "building" },
      { slug: "listings", icon: Building2, group: "building" },
      { slug: "contacts", icon: Contact, group: "useful" },
      { slug: "providers", icon: Handshake, group: "useful" },
      { slug: "local-shops", icon: Store, group: "useful" },
      { slug: "rules", icon: FileText, group: "useful" },
      { slug: "faq", icon: HelpCircle, group: "useful" },
      { slug: "satisfaction-survey", icon: Smile, group: "useful" },
      { slug: "accessibility", icon: Accessibility, group: "useful", href: settings },
      { slug: "emergency", icon: Siren, group: "other" },
      { slug: "invite", icon: UserPlus, group: "other" },
      { slug: "welcome", icon: Sparkles, group: "other" },
    ],
  },
  "front-desk": {
    profile: "front-desk",
    basePath: "/front-desk",
    nav: ["", "deliveries", "visitors", "more"],
    hub: "more",
    groups: ["actions", "communication", "building"],
    screens: [
      { slug: "", icon: Home },
      { slug: "deliveries", icon: Package },
      { slug: "visitors", icon: Users },
      { slug: "more", icon: Menu },
      { slug: "notifications", icon: Bell },
      { slug: "accessibility", icon: Accessibility, href: settings },
      { slug: "receive-delivery", icon: PackagePlus, group: "actions" },
      { slug: "mail", icon: Mail, group: "actions" },
      { slug: "dictate", icon: Mic, group: "actions" },
      { slug: "general-alert", icon: BellRing, group: "actions" },
      { slug: "emergency-alert", icon: ShieldAlert, group: "actions" },
      { slug: "notices", icon: Megaphone, group: "communication" },
      { slug: "calendar", icon: CalendarDays, group: "communication" },
      { slug: "lost-and-found", icon: Search, group: "building" },
      { slug: "on-duty", icon: AlarmClock, group: "building" },
      { slug: "travel-watch", icon: Plane, group: "building" },
      { slug: "contacts", icon: Contact, group: "building" },
      { slug: "residents", icon: Users, group: "building" },
      { slug: "rules", icon: FileText, group: "building" },
    ],
  },
  manager: {
    profile: "manager",
    basePath: "/manager",
    nav: ["", "notices", "residents", "more"],
    hub: "more",
    groups: ["communication", "management", "info"],
    screens: [
      { slug: "", icon: ChartColumn },
      { slug: "notices", icon: Megaphone },
      { slug: "residents", icon: Users },
      { slug: "more", icon: Menu },
      { slug: "notifications", icon: Bell },
      { slug: "accessibility", icon: Accessibility, href: settings },
      { slug: "polls", icon: Vote, group: "communication" },
      { slug: "meetings", icon: Users, group: "communication" },
      { slug: "calendar", icon: CalendarDays, group: "communication" },
      { slug: "suggestions", icon: Lightbulb, group: "communication" },
      { slug: "improvements", icon: Hammer, group: "communication" },
      { slug: "general-alert", icon: BellRing, group: "communication" },
      { slug: "reminders", icon: CalendarClock, group: "communication" },
      { slug: "schedule", icon: ClipboardList, group: "management" },
      { slug: "finances", icon: HandCoins, group: "management" },
      { slug: "issues", icon: BadgeAlert, group: "management" },
      { slug: "moves", icon: Truck, group: "management" },
      { slug: "key-requests", icon: KeyRound, group: "management" },
      { slug: "warnings", icon: Gavel, group: "management" },
      { slug: "noise-reports", icon: Volume2, group: "management" },
      { slug: "monthly-report", icon: ListChecks, group: "management" },
      { slug: "listings", icon: Building2, group: "management" },
      { slug: "satisfaction", icon: Star, group: "management" },
      { slug: "faq", icon: HelpCircle, group: "info" },
      { slug: "rules", icon: FileText, group: "info" },
      { slug: "contacts", icon: Contact, group: "info" },
      { slug: "local-shops", icon: ShoppingBag, group: "info" },
    ],
  },
}

/** Chave de tradução do título da tela. O início de cada perfil tem título próprio. */
export function titleKey(profile: Profile, slug: string) {
  return slug === "" ? `home.${profile}` : slug
}

export function screenHref(def: ProfileDef, screen: ScreenDef) {
  if (screen.href) return screen.href
  return screen.slug === "" ? `${def.basePath}/` : `${def.basePath}/${screen.slug}/`
}

export function findScreen(profile: Profile, slug: string) {
  return PROFILES_DEF[profile].screens.find((s) => s.slug === slug)
}

/** Slugs que viram página pela rota dinâmica `[screen]` (as que não têm destino fixo nem página própria). */
export function dynamicSlugs(profile: Profile, ownPages: string[] = []) {
  return PROFILES_DEF[profile].screens
    .filter((s) => s.slug !== "" && !s.href && !ownPages.includes(s.slug))
    .map((s) => s.slug)
}

export function hubGroups(profile: Profile) {
  const def = PROFILES_DEF[profile]
  return def.groups.map((group) => ({
    group,
    screens: def.screens.filter((s) => s.group === group),
  }))
}

/** Perfil dono de um caminho, ou null para rotas gerais. */
export function profileOfPath(pathname: string): Profile | null {
  for (const def of Object.values(PROFILES_DEF)) {
    if (pathname === def.basePath || pathname.startsWith(`${def.basePath}/`)) return def.profile
  }
  return null
}
