// Central de notificações e preferências (spec 003, História 5).
import { nowIso, save, type ServiceDeps } from "./base"
import {
  ServiceError,
  type NotificationPrefsInput,
  type NotificationService,
  type NotificationView,
} from "./contracts"
import { runDue } from "./due"
import { DEFAULT_PREFS } from "./notify"
import { authorize } from "./permissions"
import type { Notification } from "./schemas"

const view = (n: Notification): NotificationView => ({
  id: n.id,
  type: n.type,
  title: n.title,
  body: n.body,
  target: n.target,
  createdAt: n.createdAt,
  read: !!n.readAt,
})

export function notificationService(deps: ServiceDeps): NotificationService {
  async function mine(condominiumId: string, personId: string) {
    return (await deps.repo.byIndex("notifications", "byPerson", personId)).filter(
      (n) => n.condominiumId === condominiumId,
    )
  }

  return {
    async list(ctx) {
      const actor = await authorize(deps, ctx, "notification.own")
      await runDue(deps, ctx.condominiumId)
      return (await mine(ctx.condominiumId, actor.personId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(view)
    },

    async unreadCount(ctx) {
      const actor = await authorize(deps, ctx, "notification.own")
      await runDue(deps, ctx.condominiumId)
      return (await mine(ctx.condominiumId, actor.personId)).filter((n) => !n.readAt).length
    },

    async markRead(ctx, id) {
      const actor = await authorize(deps, ctx, "notification.own")
      const n = await deps.repo.get("notifications", id)
      if (!n || n.personId !== actor.personId || n.condominiumId !== ctx.condominiumId)
        throw new ServiceError("not_found", "Notificação não encontrada.")
      if (!n.readAt) await save(deps, "notifications", { ...n, readAt: nowIso(deps) })
    },

    async markAllRead(ctx) {
      const actor = await authorize(deps, ctx, "notification.own")
      const now = nowIso(deps)
      for (const n of await mine(ctx.condominiumId, actor.personId))
        if (!n.readAt) await save(deps, "notifications", { ...n, readAt: now })
    },

    async getPrefs(ctx) {
      const actor = await authorize(deps, ctx, "notification.own")
      const [prefs] = await deps.repo.byIndex("notificationPrefs", "byPerson", actor.personId)
      return prefs ? { app: prefs.app, whatsapp: prefs.whatsapp } : structuredClone(DEFAULT_PREFS)
    },

    async setPrefs(ctx, input: NotificationPrefsInput) {
      const actor = await authorize(deps, ctx, "notification.own")
      const [existing] = await deps.repo.byIndex("notificationPrefs", "byPerson", actor.personId)
      const saved = await save(deps, "notificationPrefs", {
        id: existing?.id ?? deps.uuid(),
        condominiumId: ctx.condominiumId,
        personId: actor.personId,
        app: input.app,
        whatsapp: input.whatsapp,
      })
      return { app: saved.app, whatsapp: saved.whatsapp }
    },
  }
}
