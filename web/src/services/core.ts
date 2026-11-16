// Monta todos os serviços sobre um repositório. A implementação HTTP da Etapa 3 seguirá o mesmo contrato.
import { APP_MODE, type AppMode } from "@/config/app-mode"
import { authService, randomOtp } from "./auth"
import type { Repository, ServiceDeps } from "./base"
import type { Services } from "./contracts"
import {
  apartmentAdminService,
  apartmentDataService,
  directoryService,
  onboardingService,
  outboxService,
  peopleService,
  residencyService,
  rulesService,
} from "./household"
import { uuid } from "@/lib/crypto"
import {
  apartmentService,
  condominiumService,
  devService,
  scheduleService,
  staffService,
} from "./legacy"

export { shiftCovers } from "./legacy"
export type { Repository, StoreMap, StoreName } from "./base"
export { STORES } from "./base"

export interface ServiceOptions {
  mode?: AppMode
  now?: () => Date
  uuid?: () => string
  otpCode?: () => string
}

export function createServices(repo: Repository, options: ServiceOptions = {}): Services {
  const deps: ServiceDeps = {
    repo,
    mode: options.mode ?? APP_MODE,
    now: options.now ?? (() => new Date()),
    uuid: options.uuid ?? (() => uuid()),
    otpCode: options.otpCode ?? randomOtp,
  }
  return {
    condominium: condominiumService(deps),
    apartments: apartmentService(deps),
    residents: residencyService(deps),
    staff: staffService(deps),
    schedule: scheduleService(deps),
    dev: devService(deps),
    auth: authService(deps),
    onboarding: onboardingService(deps),
    people: peopleService(deps),
    admin: apartmentAdminService(deps),
    apartmentData: apartmentDataService(deps),
    directory: directoryService(deps),
    rules: rulesService(deps),
    // A caixa de saída simulada só existe nos modos dev e demo (RF-008).
    outbox: deps.mode === "real" ? undefined : outboxService(deps),
  }
}
