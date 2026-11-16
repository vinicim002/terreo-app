// Ponto único de acesso aos serviços (contracts/servicos-dados.md da 001 e servicos.md da 002).
// As telas não chamam isto diretamente: usam os hooks de src/hooks/data.ts e src/auth/session.ts.
import { APP_MODE } from "@/config/app-mode"
import type { Actor, ServiceContext, Services } from "./contracts"
import { createLocalServices } from "./local"
import { TAQUARETINGA_ID } from "./local/seed"

let services: Services | null = null
let usingMemory = false
let currentActor: Actor | undefined

export function getServices(): Services {
  // Na Etapa 3, aqui entra a implementação HTTP com o mesmo contrato.
  services ??= createLocalServices({
    onFallback: () => {
      usingMemory = true
    },
  })
  return services
}

/** true quando o IndexedDB falhou e os dados estão só em memória. */
export function isUsingMemoryFallback() {
  return usingMemory
}

/** Quem está conectado neste aparelho; atualizado por useSession (src/auth/session.ts). */
export function setCurrentActor(actor: Actor | undefined) {
  currentActor = actor
}

/** Condomínio atual e quem está agindo. Piloto: sempre o Taquaretinga. */
export function getServiceContext(): ServiceContext {
  return { condominiumId: currentActor?.role.condominiumId ?? TAQUARETINGA_ID, actor: currentActor }
}

export { ServiceError } from "./contracts"
export type { Actor, ServiceContext, Services } from "./contracts"

/** Modo do app em que os serviços foram montados (para as telas decidirem o que mostrar). */
export const SERVICES_MODE = APP_MODE
