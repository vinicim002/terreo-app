// Interfaces dos serviços de dados (specs 001 e 002: contracts/servicos-dados.md e contracts/servicos.md).
// A implementação local (IndexedDB), a em memória e a futura HTTP seguem exatamente este contrato (RF-025 da 001).
import type {
  Apartment,
  Condominium,
  EmergencyContact,
  OutboxMessage,
  Pet,
  ResidentKind,
  Role,
  Rule,
  RuleTopic,
  ShiftAssignment,
  Staff,
  Vehicle,
} from "./schemas"

export type { Role }

/** Quem está agindo. Sem actor, todo serviço lança `forbidden`, exceto `auth` (RF-030 da 002). */
export interface Actor {
  personId: string
  role: Role
}

export interface ServiceContext {
  condominiumId: string
  actor?: Actor
}

export type ServiceErrorCode =
  "not_found" | "forbidden" | "validation" | "unavailable" | "rate_limited"

export class ServiceError extends Error {
  constructor(
    readonly code: ServiceErrorCode,
    message: string,
    readonly details?: Record<string, string>,
  ) {
    super(message)
    this.name = "ServiceError"
  }
}

// ---------- Visões devolvidas às telas ----------

export interface PersonView {
  id: string
  name: string
  phone: string
  photo: string | null
}

export interface SessionView {
  person: PersonView
  roles: Role[]
  /** null quando há mais de um papel e nenhum foi escolhido. */
  activeRole: Role | null
  needsWelcome: boolean
  needsRulesAcceptance: boolean
  /** Número do apartamento de cada papel de morador (apartmentId → número), para a escolha de papel. */
  apartmentNumbers: Record<string, string>
}

export interface ResidentView {
  residencyId: string
  personId: string
  apartmentId: string
  name: string
  phone: string
  photo: string | null
  kind: ResidentKind
  isResponsible: boolean
  canRegisterDeliveries: boolean
  canVotePolls: boolean
  status: "pending" | "active"
  lastInviteAt: string
}

export interface ApartmentOverview {
  apartmentId: string
  number: string
  floor: number
  responsible: { name: string; kind: ResidentKind } | null
  people: number
  status: "active" | "pending" | "none"
  lastInviteAt: string | null
}

export interface DirectoryEntry {
  number: string
  people: { name: string; photo: string | null; kind: ResidentKind }[]
  vehicles: { plate: string; model: string; color: string }[]
}

// ---------- Serviços da spec 001 ----------

export interface CondominiumService {
  getCurrent(ctx: ServiceContext): Promise<Condominium>
}

export interface ApartmentService {
  list(
    ctx: ServiceContext,
    filter?: { floor?: number; withoutResponsible?: boolean },
  ): Promise<Apartment[]>
  getByNumber(ctx: ServiceContext, number: string): Promise<Apartment>
  get(ctx: ServiceContext, id: string): Promise<Apartment>
}

export interface StaffService {
  list(ctx: ServiceContext): Promise<Staff[]>
  onDutyAt(ctx: ServiceContext, at: Date): Promise<Staff[]>
}

export interface ScheduleService {
  listWeek(ctx: ServiceContext): Promise<ShiftAssignment[]>
}

/** Só usado pelo painel de desenvolvimento (não exige actor fora do modo real). */
export interface DevDataService {
  resetSeed(): Promise<void>
  counts(ctx: ServiceContext): Promise<Record<string, number>>
}

// ---------- Serviços da spec 002 ----------

export type RequestCodeResult =
  { status: "unknown" } | { status: "sent"; phone: string; expiresAt: string; resendAt: string }

export type VerifyCodeResult =
  | { status: "ok"; session: SessionView }
  | { status: "wrong"; attemptsLeft: number }
  | { status: "expired" }

export interface AuthService {
  requestCode(phone: string): Promise<RequestCodeResult>
  verifyCode(phone: string, code: string, deviceId: string): Promise<VerifyCodeResult>
  current(deviceId: string): Promise<SessionView | null>
  chooseRole(deviceId: string, role: Role): Promise<SessionView>
  signOut(deviceId: string): Promise<void>
}

export interface OnboardingService {
  markWelcomeSeen(ctx: ServiceContext): Promise<void>
  acceptRules(ctx: ServiceContext): Promise<void>
}

export interface PeopleService {
  updateOwnProfile(
    ctx: ServiceContext,
    patch: { name?: string; photo?: string | null },
  ): Promise<PersonView>
}

export interface InviteInput {
  name: string
  phone: string
  kind: ResidentKind
  canRegisterDeliveries: boolean
  canVotePolls: boolean
}

export interface ResidencyPatch {
  name?: string
  kind?: ResidentKind
  phone?: string
  canRegisterDeliveries?: boolean
  canVotePolls?: boolean
}

export interface ResidencyService {
  listByApartment(ctx: ServiceContext, apartmentId: string): Promise<ResidentView[]>
  get(ctx: ServiceContext, residencyId: string): Promise<ResidentView>
  invite(ctx: ServiceContext, input: InviteInput): Promise<ResidentView>
  update(ctx: ServiceContext, residencyId: string, patch: ResidencyPatch): Promise<ResidentView>
  remove(ctx: ServiceContext, residencyId: string): Promise<void>
  resendInvite(ctx: ServiceContext, residencyId: string): Promise<ResidentView>
}

export interface ApartmentAdminService {
  overview(
    ctx: ServiceContext,
    input?: { filter?: "all" | "none" | "tenants"; search?: string },
  ): Promise<{
    totals: { apartments: number; floors: number; all: number; none: number; tenants: number }
    items: ApartmentOverview[]
  }>
  registerResponsible(
    ctx: ServiceContext,
    apartmentId: string,
    input: { name: string; phone: string; kind: "owner" | "tenant" },
  ): Promise<ResidentView>
  setResponsible(ctx: ServiceContext, apartmentId: string, residencyId: string): Promise<void>
}

export type VehicleInput = {
  id?: string
  apartmentId: string
  plate: string
  model: string
  color: string
}
export type PetInput = { id?: string; apartmentId: string; name: string; kind: Pet["kind"] }
export type EmergencyContactInput = {
  apartmentId: string
  name: string
  relationship: string
  phone: string
}

export interface ApartmentDataService {
  listVehicles(ctx: ServiceContext, apartmentId: string): Promise<Vehicle[]>
  saveVehicle(ctx: ServiceContext, input: VehicleInput): Promise<Vehicle>
  removeVehicle(ctx: ServiceContext, id: string): Promise<void>
  listPets(ctx: ServiceContext, apartmentId: string): Promise<Pet[]>
  savePet(ctx: ServiceContext, input: PetInput): Promise<Pet>
  removePet(ctx: ServiceContext, id: string): Promise<void>
  getEmergencyContact(ctx: ServiceContext, apartmentId: string): Promise<EmergencyContact | null>
  saveEmergencyContact(ctx: ServiceContext, input: EmergencyContactInput): Promise<EmergencyContact>
  removeEmergencyContact(ctx: ServiceContext, apartmentId: string): Promise<void>
}

export interface FrontDeskDirectoryService {
  apartment(ctx: ServiceContext, number: string): Promise<DirectoryEntry>
}

export interface RulesService {
  list(ctx: ServiceContext, search?: string): Promise<{ topic: RuleTopic; rules: Rule[] }[]>
}

export interface OutboxService {
  latestTo(phone: string): Promise<OutboxMessage | null>
  list(): Promise<OutboxMessage[]>
}

export interface Services {
  condominium: CondominiumService
  apartments: ApartmentService
  residents: ResidencyService
  staff: StaffService
  schedule: ScheduleService
  dev: DevDataService
  auth: AuthService
  onboarding: OnboardingService
  people: PeopleService
  admin: ApartmentAdminService
  apartmentData: ApartmentDataService
  directory: FrontDeskDirectoryService
  rules: RulesService
  /** Só existe nos modos dev e demo. */
  outbox?: OutboxService
}
