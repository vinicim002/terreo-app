import { IDBFactory } from "fake-indexeddb"
import { createLocalServices } from "@/services/local"
import { EXAMPLE_ACCOUNTS, TAQUARETINGA_ID } from "@/services/local/seed"
import type { AppMode } from "@/config/app-mode"
import type { Services, ServiceContext, SessionView } from "@/services/contracts"

export const PHONE = Object.fromEntries(EXAMPLE_ACCOUNTS.map((a) => [a.key, a.phone])) as Record<
  (typeof EXAMPLE_ACCOUNTS)[number]["key"],
  string
>

/** Serviços com relógio controlado e código previsível. */
export function setup(mode: AppMode = "dev") {
  globalThis.indexedDB = new IDBFactory()
  const clock = { now: new Date("2026-11-16T12:00:00Z") }
  let nextCode = "123456"
  const services = createLocalServices({ mode, now: () => clock.now, otpCode: () => nextCode })
  return {
    services,
    clock,
    advance: (ms: number) => (clock.now = new Date(clock.now.getTime() + ms)),
    setCode: (code: string) => (nextCode = code),
  }
}

/** Entra pelo fluxo completo e devolve o contexto de serviço da sessão. */
export async function signIn(
  services: Services,
  phone: string,
  device = "aparelho-teste-1",
  kind?: "resident" | "front-desk" | "manager",
): Promise<{ session: SessionView; ctx: ServiceContext }> {
  const sent = await services.auth.requestCode(phone)
  if (sent.status !== "sent") throw new Error("não enviou")
  const code = (await services.outbox!.latestTo(phone))!.body.match(/\d{6}/)![0]
  const result = await services.auth.verifyCode(phone, code, device)
  if (result.status !== "ok") throw new Error(result.status)
  let session = result.session
  if (kind && session.activeRole?.kind !== kind) {
    session = await services.auth.chooseRole(
      device,
      session.roles.find((r) => r.kind === kind)!,
    )
  }
  return {
    session,
    ctx: {
      condominiumId: TAQUARETINGA_ID,
      actor: { personId: session.person.id, role: session.activeRole! },
    },
  }
}
