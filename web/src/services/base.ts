// Base comum dos serviços: repositório (IndexedDB ou memória), dependências e validação.
import { ServiceError } from "./contracts"
import {
  ApartmentSchema,
  CondominiumSchema,
  EmergencyContactSchema,
  ManagerAssignmentSchema,
  OtpRequestSchema,
  OutboxMessageSchema,
  PersonSchema,
  PetSchema,
  ResidencySchema,
  RuleSchema,
  SessionSchema,
  ShiftAssignmentSchema,
  StaffSchema,
  VehicleSchema,
  type Apartment,
  type Condominium,
  type EmergencyContact,
  type ManagerAssignment,
  type OtpRequest,
  type OutboxMessage,
  type Person,
  type Pet,
  type Residency,
  type Rule,
  type Session,
  type ShiftAssignment,
  type Staff,
  type Vehicle,
} from "./schemas"
import type { AppMode } from "@/config/app-mode"

export interface StoreMap {
  condominiums: Condominium
  apartments: Apartment
  people: Person
  residencies: Residency
  staff: Staff
  managers: ManagerAssignment
  shifts: ShiftAssignment
  vehicles: Vehicle
  pets: Pet
  emergencyContacts: EmergencyContact
  rules: Rule
  otpRequests: OtpRequest
  sessions: Session
  outbox: OutboxMessage
}
export type StoreName = keyof StoreMap
export const STORES = [
  "condominiums",
  "apartments",
  "people",
  "residencies",
  "staff",
  "managers",
  "shifts",
  "vehicles",
  "pets",
  "emergencyContacts",
  "rules",
  "otpRequests",
  "sessions",
  "outbox",
] as const satisfies readonly StoreName[]

/** Índices por loja: nome do índice → campo. */
export const INDEXES: { [S in StoreName]: Partial<Record<IndexName, string>> } = {
  condominiums: { byCondominium: "id" },
  apartments: { byCondominium: "condominiumId" },
  people: { byCondominium: "condominiumId", byPhone: "phone" },
  residencies: { byCondominium: "condominiumId", byPerson: "personId", byApartment: "apartmentId" },
  staff: { byCondominium: "condominiumId", byPerson: "personId" },
  managers: { byCondominium: "condominiumId", byPerson: "personId" },
  shifts: { byCondominium: "condominiumId" },
  vehicles: { byCondominium: "condominiumId", byApartment: "apartmentId" },
  pets: { byCondominium: "condominiumId", byApartment: "apartmentId" },
  emergencyContacts: { byCondominium: "condominiumId", byApartment: "apartmentId" },
  rules: { byCondominium: "condominiumId" },
  otpRequests: { byPhone: "phone" },
  sessions: { byPerson: "personId", byDevice: "deviceId" },
  outbox: { byPhone: "toPhone" },
}
export type IndexName = "byCondominium" | "byPhone" | "byPerson" | "byApartment" | "byDevice"

export interface Repository {
  byIndex<S extends StoreName>(store: S, index: IndexName, value: string): Promise<StoreMap[S][]>
  get<S extends StoreName>(store: S, id: string): Promise<StoreMap[S] | undefined>
  all<S extends StoreName>(store: S): Promise<StoreMap[S][]>
  put<S extends StoreName>(store: S, value: StoreMap[S]): Promise<void>
  remove<S extends StoreName>(store: S, id: string): Promise<void>
  resetSeed(): Promise<void>
}

export interface ServiceDeps {
  repo: Repository
  mode: AppMode
  now: () => Date
  uuid: () => string
  /** Código de 6 dígitos (injetável nos testes). */
  otpCode: () => string
}

const SCHEMAS = {
  condominiums: CondominiumSchema,
  apartments: ApartmentSchema,
  people: PersonSchema,
  residencies: ResidencySchema,
  staff: StaffSchema,
  managers: ManagerAssignmentSchema,
  shifts: ShiftAssignmentSchema,
  vehicles: VehicleSchema,
  pets: PetSchema,
  emergencyContacts: EmergencyContactSchema,
  rules: RuleSchema,
  otpRequests: OtpRequestSchema,
  sessions: SessionSchema,
  outbox: OutboxMessageSchema,
} as const

export function validate<S extends StoreName>(store: S, value: unknown): StoreMap[S] {
  const parsed = SCHEMAS[store].safeParse(value)
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path.join(".") ?? ""
    throw new ServiceError(
      "validation",
      `Dado inválido em ${store}.`,
      field ? { [field]: "invalid" } : undefined,
    )
  }
  return parsed.data as StoreMap[S]
}

export const notFound = (what: string) => new ServiceError("not_found", `${what} não encontrado.`)

/** Lê registros do condomínio, validados. */
export async function listIn<S extends StoreName>(
  deps: ServiceDeps,
  store: S,
  condominiumId: string,
) {
  return (await deps.repo.byIndex(store, "byCondominium", condominiumId)).map((v) =>
    validate(store, v),
  )
}

/** Grava validando antes. */
export async function save<S extends StoreName>(deps: ServiceDeps, store: S, value: StoreMap[S]) {
  const valid = validate(store, value)
  await deps.repo.put(store, valid)
  return valid
}

/** Busca por id garantindo o condomínio: de outro condomínio responde como inexistente (RF-026 da 001). */
export async function getIn<S extends StoreName>(
  deps: ServiceDeps,
  store: S,
  condominiumId: string,
  id: string,
  what: string,
) {
  const value = await deps.repo.get(store, id)
  if (!value || (value as { condominiumId?: string }).condominiumId !== condominiumId)
    throw notFound(what)
  return validate(store, value)
}

/** Texto sem acentos e em minúsculas, para buscas. */
export function fold(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

export const nowIso = (deps: ServiceDeps) => deps.now().toISOString()
