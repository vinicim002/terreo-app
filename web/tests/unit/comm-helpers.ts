// Ajudas dos testes da spec 003: entrar com cada conta e um aviso de exemplo.
import { PHONE, setup, signIn } from "./auth-helpers"
import type { NoticeInput, Services } from "@/services/contracts"

export async function accounts(services: Services) {
  const manager = await signIn(services, PHONE.manager, "aparelho-sindica", "manager")
  const resident = await signIn(services, PHONE.responsible, "aparelho-804")
  const family = await signIn(services, PHONE.family, "aparelho-804-familia")
  const frontDesk = await signIn(services, PHONE["front-desk"], "aparelho-portaria")
  return {
    manager: manager.ctx,
    resident: resident.ctx,
    family: family.ctx,
    frontDesk: frontDesk.ctx,
    ids: {
      manager: manager.session.person.id,
      resident: resident.session.person.id,
      family: family.session.person.id,
      frontDesk: frontDesk.session.person.id,
    },
  }
}

export function noticeInput(patch: Partial<NoticeInput> = {}): NoticeInput {
  return {
    kind: "water",
    title: "Falta d'água na quinta",
    body: "Reparo na rede da rua.",
    important: false,
    sendToGroup: true,
    requireConfirmation: false,
    referenceDate: null,
    remindDayBefore: false,
    publishAt: null,
    ...patch,
  }
}

/** Ambiente com relógio controlado e as quatro contas conectadas. */
export async function commSetup() {
  const env = setup()
  const acc = await accounts(env.services)
  return { ...env, ...acc }
}

export async function outbox(services: Services, kind?: "group" | "private") {
  const all = await services.outbox!.list()
  return kind ? all.filter((m) => m.kind === kind) : all
}

/** Repositório direto, para preparar casos (tirar permissão, mudar responsável). */
export async function repoOf(env: { clock: { now: Date } }) {
  const { createLocalRepository } = await import("@/services/local")
  return createLocalRepository(undefined, () => env.clock.now)
}

export const code = async (p: Promise<unknown>) => {
  try {
    await p
    return "ok"
  } catch (e) {
    const err = e as { code?: string; details?: Record<string, string> }
    return err.code ?? String(e)
  }
}
