// Alerta geral (spec 005, História 2): a portaria ou o síndico avisa o prédio inteiro de uma vez — no app (tela
// cheia), no grupo e no privado de todos, ignorando as preferências (RF-011, research R3) — e encerra depois.
import { timeBrasilia } from "@/i18n/datetime"
import { getIn, listIn, nowIso, save, type ServiceDeps } from "./base"
import { ServiceError, type GeneralAlertService, type GeneralAlertView } from "./contracts"
import { runDue } from "./due"
import { personName } from "./front-desk-shared"
import { notify } from "./notify"
import { authorize, type ActorInfo } from "./permissions"
import type { GeneralAlert, GeneralAlertKind } from "./schemas"

const DAY = 86_400_000

export const GENERAL_KIND_LABEL: Record<GeneralAlertKind, string> = {
  fire: "Incêndio",
  gas: "Vazamento de gás",
  power: "Falta de energia",
  security: "Segurança",
  other: "Alerta",
}

const invalid = (field: string, reason: string) =>
  new ServiceError("validation", "Dado inválido.", { [field]: reason })

export function generalAlertService(deps: ServiceDeps): GeneralAlertService {
  async function seenBy(personId: string) {
    const seen = await deps.repo.byIndex("generalAlertSeen", "byPerson", personId)
    return new Set(seen.map((s) => s.alertId))
  }

  async function view(alert: GeneralAlert, actor: ActorInfo, seen?: Set<string>) {
    const [createdBy, closedBy] = await Promise.all([
      personName(deps, alert.createdById),
      personName(deps, alert.closedById),
    ])
    const mine = seen ?? (await seenBy(actor.personId))
    const canClose =
      alert.status === "open" &&
      (actor.kind === "manager" ||
        (actor.kind === "front-desk" && alert.createdById === actor.personId))
    return {
      id: alert.id,
      kind: alert.kind,
      message: alert.message,
      createdBy: createdBy ?? "",
      createdAt: alert.createdAt,
      status: alert.status,
      closedAt: alert.closedAt,
      closedBy,
      closingMessage: alert.closingMessage,
      seenByMe: mine.has(alert.id),
      canClose,
    } satisfies GeneralAlertView
  }

  async function openOne(condominiumId: string) {
    return (await listIn(deps, "generalAlerts", condominiumId)).find((a) => a.status === "open")
  }

  async function markSeen(condominiumId: string, alertId: string, personId: string) {
    if ((await seenBy(personId)).has(alertId)) return
    await save(deps, "generalAlertSeen", {
      id: deps.uuid(),
      condominiumId,
      alertId,
      personId,
      seenAt: nowIso(deps),
    })
  }

  return {
    async current(ctx) {
      const actor = await authorize(deps, ctx, "generalAlert.view")
      await runDue(deps, ctx.condominiumId)
      const alert = await openOne(ctx.condominiumId)
      return alert ? view(alert, actor) : null
    },

    async send(ctx, input) {
      const actor = await authorize(deps, ctx, "generalAlert.send")
      const message = input.message.trim()
      if (message.length < 5) throw invalid("message", "too_short")
      if (message.length > 280) throw invalid("message", "too_long")
      if (await openOne(ctx.condominiumId))
        throw new ServiceError("conflict", "Já existe um alerta geral em aberto. Encerre antes.")
      const alert = await save(deps, "generalAlerts", {
        id: deps.uuid(),
        condominiumId: ctx.condominiumId,
        kind: input.kind,
        message,
        createdById: actor.personId,
        createdAt: nowIso(deps),
        status: "open",
        closedAt: null,
        closedById: null,
        closingMessage: null,
      })
      const who = (await personName(deps, actor.personId)) ?? "Portaria"
      const label = GENERAL_KIND_LABEL[alert.kind]
      await notify(deps, ctx.condominiumId, {
        type: "general-alert",
        audience: "everyone",
        title: `🚨 Alerta geral: ${label}`,
        body: message,
        target: { kind: "general-alert", id: alert.id },
        toGroup: true,
        groupText: `🚨 *ALERTA GERAL — ${label}*\n${message}\n— ${who}, ${timeBrasilia(alert.createdAt)}`,
      })
      await markSeen(ctx.condominiumId, alert.id, actor.personId) // quem enviou não precisa da tela cheia
      return view(alert, actor)
    },

    async close(ctx, id, message) {
      const alert = await getIn(deps, "generalAlerts", ctx.condominiumId, id, "Alerta")
      const actor = await authorize(deps, ctx, "generalAlert.close", {
        createdById: alert.createdById,
      })
      if (alert.status !== "open")
        throw new ServiceError("conflict", "Este alerta já foi encerrado.")
      const text = message?.trim() || null
      if (text && text.length > 280) throw invalid("closingMessage", "too_long")
      const saved = await save(deps, "generalAlerts", {
        ...alert,
        status: "closed",
        closedAt: nowIso(deps),
        closedById: actor.personId,
        closingMessage: text,
      })
      const label = GENERAL_KIND_LABEL[alert.kind]
      const body = text ?? "Situação controlada."
      await notify(deps, ctx.condominiumId, {
        type: "general-alert-closed",
        audience: "everyone",
        title: `✅ Alerta encerrado: ${label}`,
        body,
        target: { kind: "general-alert", id: alert.id },
        toGroup: true,
        groupText: `✅ *Alerta encerrado — ${label}*\n${body}`,
      })
      return view(saved, actor)
    },

    async markSeen(ctx, id) {
      const actor = await authorize(deps, ctx, "generalAlert.view")
      await getIn(deps, "generalAlerts", ctx.condominiumId, id, "Alerta")
      await markSeen(ctx.condominiumId, id, actor.personId)
    },

    async history(ctx) {
      const actor = await authorize(deps, ctx, "generalAlert.view")
      const now = deps.now().getTime()
      const seen = await seenBy(actor.personId)
      const list = (await listIn(deps, "generalAlerts", ctx.condominiumId))
        .filter((a) => now - new Date(a.createdAt).getTime() <= 90 * DAY)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return Promise.all(list.map((a) => view(a, actor, seen)))
    },
  }
}
