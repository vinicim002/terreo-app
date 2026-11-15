// Ponto único de acesso aos serviços (contracts/servicos-dados.md). As telas não chamam
// isto diretamente: usam os hooks de src/hooks/data.ts.
import type { ServiceContext, Services } from "./contracts"
import { createLocalServices } from "./local"
import { TAQUARETINGA_ID } from "./local/seed"

let services: Services | null = null
let usingMemory = false

export function getServices(): Services {
  // Na Etapa 3, aqui entra a implementação HTTP com o mesmo contrato.
  services ??= createLocalServices(() => {
    usingMemory = true
  })
  return services
}

/** true quando o IndexedDB falhou e os dados estão só em memória. */
export function isUsingMemoryFallback() {
  return usingMemory
}

/** Condomínio atual. Até o login (Etapa 2), é sempre o Taquaretinga. */
export function getServiceContext(): ServiceContext {
  return { condominiumId: TAQUARETINGA_ID }
}

export { ServiceError } from "./contracts"
export type { Services, ServiceContext } from "./contracts"
