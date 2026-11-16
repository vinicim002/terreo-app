// Entrada com celular e código (research R3 e R4 da spec 002), simulando o que o servidor fará na Etapa 3:
// código de 6 dígitos guardado só como hash, 10 min de validade, 5 erros, reenvio após 60 s, 5 pedidos por hora,
// mensagem "enviada" pelo WhatsApp do condomínio para a caixa de saída simulada, sessão por aparelho.
import { E164, type Person, type Role, type Session } from "./schemas"
import { nowIso, save, type ServiceDeps } from "./base"
import { ServiceError, type AuthService, type SessionView } from "./contracts"
import { isAcceptedPhone } from "@/phone/phone"
import { loadPerson, rolesOf, sameRole, sessionView } from "./views"
import { sha256Hex as sha256 } from "@/lib/crypto"

export const OTP_TTL_MS = 10 * 60_000
export const OTP_RESEND_MS = 60_000
export const OTP_MAX_ATTEMPTS = 5
export const OTP_MAX_PER_HOUR = 5
export const SESSION_IDLE_DAYS = 180

function randomSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("")
}

export function randomOtp() {
  return String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0")
}

export function authService(deps: ServiceDeps): AuthService {
  const repo = deps.repo

  /** Pessoa que pode entrar com o celular: não removida e com algum papel. Piloto: um condomínio. */
  async function personForPhone(phone: string): Promise<Person | null> {
    for (const p of await repo.byIndex("people", "byPhone", phone)) {
      if (p.removedAt) continue
      if ((await rolesOf(deps, p)).length > 0) return p
    }
    return null
  }

  async function openSession(
    deviceId: string,
  ): Promise<{ session: Session; person: Person } | null> {
    const open = (await repo.byIndex("sessions", "byDevice", deviceId)).filter((s) => !s.endedAt)
    open.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const session = open[0]
    if (!session) return null
    const person = await repo.get("people", session.personId)
    if (!person || person.removedAt) {
      await repo.put("sessions", { ...session, endedAt: nowIso(deps), endReason: "removed" })
      return null
    }
    const idleMs = deps.now().getTime() - new Date(session.lastSeenAt).getTime()
    if (idleMs > SESSION_IDLE_DAYS * 86_400_000) {
      await repo.put("sessions", { ...session, endedAt: nowIso(deps), endReason: "inactive" })
      return null
    }
    return { session, person }
  }

  return {
    async requestCode(phone) {
      if (!E164.safeParse(phone).success || !isAcceptedPhone(phone, deps.mode)) {
        throw new ServiceError("validation", "Número inválido.", { phone: "invalid" })
      }
      const person = await personForPhone(phone)
      // Número desconhecido, removido ou de outro condomínio: mesma resposta, sem enviar (RF-002, RF-009).
      if (!person) return { status: "unknown" }

      const now = deps.now()
      const requests = await repo.byIndex("otpRequests", "byPhone", phone)
      const lastHour = requests.filter(
        (r) => now.getTime() - new Date(r.createdAt).getTime() < 3_600_000,
      )
      if (lastHour.length >= OTP_MAX_PER_HOUR) {
        throw new ServiceError("rate_limited", "Muitos pedidos de código. Tente mais tarde.", {
          retry: "hour",
        })
      }
      const latest = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      if (latest && now.getTime() - new Date(latest.createdAt).getTime() < OTP_RESEND_MS) {
        const resendAt = new Date(
          new Date(latest.createdAt).getTime() + OTP_RESEND_MS,
        ).toISOString()
        throw new ServiceError("rate_limited", "Aguarde para pedir outro código.", { resendAt })
      }
      // Um código novo invalida os anteriores ainda abertos.
      for (const r of requests) {
        if (!r.consumedAt && !r.invalidatedAt)
          await repo.put("otpRequests", { ...r, invalidatedAt: now.toISOString() })
      }
      const code = deps.otpCode()
      const salt = randomSalt()
      const createdAt = now.toISOString()
      const expiresAt = new Date(now.getTime() + OTP_TTL_MS).toISOString()
      await save(deps, "otpRequests", {
        id: deps.uuid(),
        phone,
        codeHash: await sha256(salt + code),
        salt,
        createdAt,
        expiresAt,
        attempts: 0,
        consumedAt: null,
        invalidatedAt: null,
      })
      await save(deps, "outbox", {
        id: deps.uuid(),
        condominiumId: person.condominiumId,
        toPhone: phone,
        kind: "otp",
        body: `Térreo: seu código de acesso é ${code}. Ele vale por 10 minutos. Não compartilhe com ninguém.`,
        createdAt,
      })
      return {
        status: "sent",
        phone,
        expiresAt,
        resendAt: new Date(now.getTime() + OTP_RESEND_MS).toISOString(),
      }
    },

    async verifyCode(phone, code, deviceId) {
      const now = deps.now()
      const open = (await repo.byIndex("otpRequests", "byPhone", phone))
        .filter((r) => !r.consumedAt && !r.invalidatedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      const request = open[0]
      if (!request) return { status: "expired" }
      if (now.getTime() > new Date(request.expiresAt).getTime()) {
        await repo.put("otpRequests", { ...request, invalidatedAt: now.toISOString() })
        return { status: "expired" }
      }
      if ((await sha256(request.salt + code.trim())) !== request.codeHash) {
        const attempts = request.attempts + 1
        await repo.put("otpRequests", {
          ...request,
          attempts,
          invalidatedAt: attempts >= OTP_MAX_ATTEMPTS ? now.toISOString() : null,
        })
        return { status: "wrong", attemptsLeft: Math.max(0, OTP_MAX_ATTEMPTS - attempts) }
      }
      const person = await personForPhone(phone)
      if (!person) return { status: "expired" }
      await repo.put("otpRequests", { ...request, consumedAt: now.toISOString() })
      // Primeiro acesso: o convite deixa de estar pendente (H3-3).
      const updated: Person = person.firstAccessAt
        ? person
        : { ...person, firstAccessAt: now.toISOString() }
      if (updated !== person) await save(deps, "people", updated)
      // Uma sessão por aparelho: encerra a anterior deste aparelho.
      for (const s of await repo.byIndex("sessions", "byDevice", deviceId)) {
        if (!s.endedAt)
          await repo.put("sessions", { ...s, endedAt: now.toISOString(), endReason: "signed-out" })
      }
      const roles = await rolesOf(deps, updated)
      const session = await save(deps, "sessions", {
        id: deps.uuid(),
        personId: updated.id,
        deviceId,
        activeRole: roles.length === 1 ? roles[0] : null,
        createdAt: now.toISOString(),
        lastSeenAt: now.toISOString(),
        endedAt: null,
        endReason: null,
      })
      return { status: "ok", session: await sessionView(deps, session, updated) }
    },

    async current(deviceId) {
      const found = await openSession(deviceId)
      if (!found) return null
      const session = { ...found.session, lastSeenAt: nowIso(deps) }
      await repo.put("sessions", session)
      return sessionView(deps, session, found.person)
    },

    async chooseRole(deviceId, role: Role): Promise<SessionView> {
      const found = await openSession(deviceId)
      if (!found) throw new ServiceError("forbidden", "Sessão encerrada.")
      const roles = await rolesOf(deps, found.person)
      if (!roles.some((r) => sameRole(r, role)))
        throw new ServiceError("forbidden", "Papel não pertence à pessoa.")
      const session = { ...found.session, activeRole: role, lastSeenAt: nowIso(deps) }
      await repo.put("sessions", session)
      return sessionView(deps, session, await loadPerson(deps, found.person.id))
    },

    async signOut(deviceId) {
      for (const s of await repo.byIndex("sessions", "byDevice", deviceId)) {
        if (!s.endedAt)
          await repo.put("sessions", { ...s, endedAt: nowIso(deps), endReason: "signed-out" })
      }
    },
  }
}
