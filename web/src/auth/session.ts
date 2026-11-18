"use client"

// Sessão deste aparelho (research R4 da spec 002): deviceId no localStorage, sessão nos serviços.
import { useSyncExternalStore } from "react"
import { APP_MODE } from "@/config/app-mode"
import { getServices, setCurrentActor } from "@/services"
import type { Role, SessionView } from "@/services/contracts"
import { uuid } from "@/lib/crypto"

const DEVICE_KEY = "terreo:device"
let memoryDeviceId: string | null = null

/** Identificador aleatório deste aparelho, criado uma vez. */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = uuid()
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    memoryDeviceId ??= uuid()
    return memoryDeviceId
  }
}

type State = { status: "loading" } | { status: "ready"; session: SessionView | null }

let state: State = { status: "loading" }
let started = false
const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  const session = next.status === "ready" ? next.session : null
  setCurrentActor(
    session?.activeRole ? { personId: session.person.id, role: session.activeRole } : undefined,
  )
  listeners.forEach((l) => l())
}

/** Aplica uma sessão recebida (entrada, troca de papel) ou null (saída). */
export function applySession(session: SessionView | null) {
  set({ status: "ready", session })
}

export async function refreshSession() {
  applySession(await getServices().auth.current(getDeviceId()))
}

export async function signOut() {
  await getServices().auth.signOut(getDeviceId())
  applySession(null)
}

export async function chooseRole(role: Role) {
  applySession(await getServices().auth.chooseRole(getDeviceId(), role))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!started) {
    started = true
    refreshSession().catch(() => applySession(null))
  }
  return () => listeners.delete(listener)
}

const LOADING: State = { status: "loading" }

/** Sessão atual. No build estático e até a primeira leitura, "loading". */
export function useSession(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => LOADING,
  )
}

export function roleHome(role: Role): string {
  return role.kind === "resident"
    ? "/resident/"
    : role.kind === "front-desk"
      ? "/front-desk/"
      : "/manager/"
}

// Atalho para os testes de ponta a ponta (research R8): só nos modos dev e demo, nunca no real.
if (typeof window !== "undefined" && APP_MODE !== "real") {
  ;(window as unknown as { __terreoDev?: unknown }).__terreoDev = {
    /** Entra com um celular dos dados de exemplo, pelo mesmo fluxo do código. */
    async signInAs(phone: string, roleKind?: Role["kind"]) {
      const services = getServices()
      // Trocar de conta várias vezes no mesmo teste não espera o intervalo entre códigos.
      await services.dev.forgetCodes(phone)
      const sent = await services.auth.requestCode(phone)
      if (sent.status !== "sent") throw new Error(`Número não cadastrado: ${phone}`)
      // A mensagem do código (não a última de qualquer tipo: com o relógio parado, avisos empatam na hora).
      const message = (await services.outbox!.list()).find(
        (m) => m.toPhone === phone && m.kind === "otp",
      )
      const code = message!.body.match(/\d{6}/)![0]
      const result = await services.auth.verifyCode(phone, code, getDeviceId())
      if (result.status !== "ok") throw new Error(`Código não aceito: ${result.status}`)
      let session = result.session
      if (roleKind && session.activeRole?.kind !== roleKind) {
        const role = session.roles.find((r) => r.kind === roleKind)
        if (!role) throw new Error(`Papel ${roleKind} não encontrado`)
        session = await services.auth.chooseRole(getDeviceId(), role)
      }
      applySession(session)
      return session
    },
  }
}
