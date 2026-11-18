// Despacho único de notificações (research R2 da spec 003). Decide quem recebe o quê e por qual canal:
// - no app: uma Notification por pessoa, conforme as preferências (emergência ignora preferências — RF-025);
// - grupo do WhatsApp: uma única mensagem, só para assuntos gerais (avisos, reuniões, enquetes);
// - privado do WhatsApp: só assuntos pessoais (entregas, visitantes) e emergências, nunca os gerais (RF-026);
// - só no app: recados da portaria e achados e perdidos (spec 004, research R7), sem preferência e sem WhatsApp.
// Nesta etapa as mensagens ficam na caixa de saída simulada; na Etapa 3 isto vira a entrada da fila (ARQ).
import { nowIso, save, type ServiceDeps } from "./base"
import type { NotificationPrefs, NotificationTarget, NotificationType } from "./schemas"

export type Audience = "residents" | "residents+staff" | { personIds: string[] }

export interface Dispatch {
  type: NotificationType
  audience: Audience
  /** Título do item (aviso, enquete, reunião): conteúdo do condomínio, não traduzido. */
  title: string
  body: string
  target: NotificationTarget | null
  /** Mensagem ao grupo do WhatsApp (só tipos gerais). */
  toGroup?: boolean
  /** Texto da mensagem ao grupo; padrão: título e texto. */
  groupText?: string
}

type PrefKey = keyof NotificationPrefs["app"]

/** Tipo de preferência de cada notificação; null = sem preferência (emergência ou só no app). */
export function prefKeyOf(type: NotificationType): PrefKey | null {
  if (type.startsWith("notice")) return "notices"
  if (type.startsWith("meeting")) return "meetings"
  if (type.startsWith("poll")) return "polls"
  if (type.startsWith("delivery") || type === "mail") return "deliveries"
  if (type === "visitor") return "visitors"
  return null
}

const PERSONAL = new Set<NotificationType>(["delivery", "delivery-reminder", "mail", "visitor"])
/** Avisos entre morador, portaria e síndico: só no app, sempre (spec 004). */
const APP_ONLY = new Set<NotificationType>(["lost-found", "memo"])
const STAFF_TYPES = new Set<NotificationType>([
  "notice",
  "notice-updated",
  "notice-resolved",
  "notice-reminder",
  "emergency",
])

export const DEFAULT_PREFS: Pick<NotificationPrefs, "app" | "whatsapp"> = {
  app: { notices: true, meetings: true, polls: true, deliveries: true, visitors: true },
  whatsapp: { deliveries: true, visitors: true },
}

const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

/** Pessoas ativas do condomínio que moram em algum apartamento (convite aceito, não removidas). */
export async function activeResidents(deps: ServiceDeps, condominiumId: string) {
  const [people, residencies] = await Promise.all([
    deps.repo.byIndex("people", "byCondominium", condominiumId),
    deps.repo.byIndex("residencies", "byCondominium", condominiumId),
  ])
  const active = new Map(
    people.filter((p) => !p.removedAt && p.firstAccessAt).map((p) => [p.id, p]),
  )
  return residencies
    .filter((r) => active.has(r.personId))
    .map((r) => ({ residency: r, person: active.get(r.personId)! }))
}

async function audienceOf(deps: ServiceDeps, condominiumId: string, dispatch: Dispatch) {
  const people = await deps.repo.byIndex("people", "byCondominium", condominiumId)
  const byId = new Map(people.filter((p) => !p.removedAt).map((p) => [p.id, p]))
  const ids = new Set<string>()
  if (typeof dispatch.audience === "object") {
    for (const id of dispatch.audience.personIds) if (byId.has(id)) ids.add(id)
  } else {
    for (const { person } of await activeResidents(deps, condominiumId)) ids.add(person.id)
    if (dispatch.audience === "residents+staff" && STAFF_TYPES.has(dispatch.type)) {
      const staff = await deps.repo.byIndex("staff", "byCondominium", condominiumId)
      for (const s of staff)
        if (s.role === "doorman" && s.personId && byId.has(s.personId)) ids.add(s.personId)
    }
  }
  return [...ids].map((id) => byId.get(id)!)
}

async function prefsOf(deps: ServiceDeps, personId: string) {
  const [prefs] = await deps.repo.byIndex("notificationPrefs", "byPerson", personId)
  return prefs ?? DEFAULT_PREFS
}

export async function notify(deps: ServiceDeps, condominiumId: string, dispatch: Dispatch) {
  const now = nowIso(deps)
  const key = prefKeyOf(dispatch.type)
  const general = key === "notices" || key === "meetings" || key === "polls"

  for (const person of await audienceOf(deps, condominiumId, dispatch)) {
    const prefs = await prefsOf(deps, person.id)
    const appOnly = APP_ONLY.has(dispatch.type)
    const inApp = key === null || prefs.app[key]
    if (inApp) {
      await save(deps, "notifications", {
        id: deps.uuid(),
        condominiumId,
        personId: person.id,
        type: dispatch.type,
        title: cut(dispatch.title, 120),
        body: cut(dispatch.body, 200),
        target: dispatch.target,
        createdAt: now,
        readAt: null,
      })
    }
    const personal = PERSONAL.has(dispatch.type)
    const whatsappOn =
      !appOnly && (key === null || (personal && prefs.whatsapp[key as "deliveries" | "visitors"]))
    if (!general && whatsappOn) {
      await save(deps, "outbox", {
        id: deps.uuid(),
        condominiumId,
        toPhone: person.phone,
        kind: "private",
        body: `Térreo: ${dispatch.title}\n${dispatch.body}`,
        createdAt: now,
      })
    }
  }

  if (dispatch.toGroup && general) {
    await save(deps, "outbox", {
      id: deps.uuid(),
      condominiumId,
      toPhone: null,
      kind: "group",
      body: dispatch.groupText ?? `📢 ${dispatch.title}\n${dispatch.body}`,
      createdAt: now,
    })
  }
}
