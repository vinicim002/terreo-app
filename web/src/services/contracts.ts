// Interfaces dos serviços de dados (contracts/servicos-dados.md). A implementação local
// (IndexedDB), a em memória e a futura HTTP seguem exatamente este contrato (RF-025).
import type { Apartment, Condominium, Resident, ShiftAssignment, Staff } from "./schemas"

export interface ServiceContext {
  condominiumId: string
}

export type ServiceErrorCode = "not_found" | "forbidden" | "validation" | "unavailable"

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

export interface CondominiumService {
  getCurrent(ctx: ServiceContext): Promise<Condominium>
}

export interface ApartmentService {
  list(
    ctx: ServiceContext,
    filter?: { floor?: number; withoutResponsible?: boolean },
  ): Promise<Apartment[]>
  getByNumber(ctx: ServiceContext, number: string): Promise<Apartment>
}

export interface ResidentService {
  listByApartment(ctx: ServiceContext, apartmentId: string): Promise<Resident[]>
  get(ctx: ServiceContext, id: string): Promise<Resident>
}

export interface StaffService {
  list(ctx: ServiceContext): Promise<Staff[]>
  /** Quem está de plantão no instante informado, pela escala, no horário de Brasília. */
  onDutyAt(ctx: ServiceContext, at: Date): Promise<Staff[]>
}

export interface ScheduleService {
  listWeek(ctx: ServiceContext): Promise<ShiftAssignment[]>
}

/** Só usado pelo painel de desenvolvimento. */
export interface DevDataService {
  resetSeed(): Promise<void>
  counts(ctx: ServiceContext): Promise<Record<string, number>>
}

export interface Services {
  condominium: CondominiumService
  apartments: ApartmentService
  residents: ResidentService
  staff: StaffService
  schedule: ScheduleService
  dev: DevDataService
}
