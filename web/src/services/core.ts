// Regras dos serviços, iguais para a implementação local (IndexedDB) e em memória.
// Cada uma só fornece um repositório; a futura implementação HTTP seguirá o mesmo contrato.
import { ServiceError, type ServiceContext, type Services } from "./contracts"
import {
  ApartmentSchema,
  CondominiumSchema,
  ResidentSchema,
  ShiftAssignmentSchema,
  StaffSchema,
  type Apartment,
  type Condominium,
  type Resident,
  type ShiftAssignment,
  type Staff,
} from "./schemas"
import { TIME_ZONE } from "@/i18n/datetime"

export interface StoreMap {
  condominiums: Condominium
  apartments: Apartment
  residents: Resident
  staff: Staff
  shifts: ShiftAssignment
}
export type StoreName = keyof StoreMap
export const STORES: StoreName[] = ["condominiums", "apartments", "residents", "staff", "shifts"]

export interface Repository {
  /** Registros do condomínio (para "condominiums", o próprio condomínio). */
  byCondominium<S extends StoreName>(store: S, condominiumId: string): Promise<StoreMap[S][]>
  get<S extends StoreName>(store: S, id: string): Promise<StoreMap[S] | undefined>
  resetSeed(): Promise<void>
}

const SCHEMAS = {
  condominiums: CondominiumSchema,
  apartments: ApartmentSchema,
  residents: ResidentSchema,
  staff: StaffSchema,
  shifts: ShiftAssignmentSchema,
} as const

function validate<S extends StoreName>(store: S, value: unknown): StoreMap[S] {
  const parsed = SCHEMAS[store].safeParse(value)
  if (!parsed.success) throw new ServiceError("validation", `Dado inválido em ${store}.`)
  return parsed.data as StoreMap[S]
}

const notFound = (what: string) => new ServiceError("not_found", `${what} não encontrado.`)

/** Dia da semana (0 = domingo) e minutos do dia no fuso de Brasília. */
function brasiliaClock(at: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at)
  const get = (type: string) => parts.find((p) => p.type === type)!.value
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"))
  return { weekday, minutes: Number(get("hour")) * 60 + Number(get("minute")) }
}

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))

/** O turno contém o instante? Turnos com fim menor que o início terminam no dia seguinte. */
export function shiftCovers(shift: ShiftAssignment, weekday: number, minutes: number) {
  const start = toMinutes(shift.startTime)
  const end = toMinutes(shift.endTime)
  if (start < end) return shift.weekday === weekday && minutes >= start && minutes < end
  const previous = (weekday + 6) % 7
  return (
    (shift.weekday === weekday && minutes >= start) || (shift.weekday === previous && minutes < end)
  )
}

export function createServices(repo: Repository): Services {
  const list = async <S extends StoreName>(store: S, ctx: ServiceContext) =>
    (await repo.byCondominium(store, ctx.condominiumId)).map((v) => validate(store, v))

  const getOwned = async <S extends StoreName>(
    store: S,
    ctx: ServiceContext,
    id: string,
    what: string,
  ) => {
    const value = await repo.get(store, id)
    // Um id de outro condomínio responde como inexistente, nunca devolve o dado (RF-026).
    if (!value || (value as { condominiumId?: string }).condominiumId !== ctx.condominiumId)
      throw notFound(what)
    return validate(store, value)
  }

  return {
    condominium: {
      async getCurrent(ctx) {
        const [condo] = await list("condominiums", ctx)
        if (!condo) throw notFound("Condomínio")
        return condo
      },
    },
    apartments: {
      async list(ctx, filter = {}) {
        return (await list("apartments", ctx))
          .filter((a) => filter.floor === undefined || a.floor === filter.floor)
          .filter((a) => !filter.withoutResponsible || a.responsibleResidentId === null)
          .sort(
            (a, b) =>
              a.floor - b.floor || a.number.localeCompare(b.number, "pt-BR", { numeric: true }),
          )
      },
      async getByNumber(ctx, number) {
        const found = (await list("apartments", ctx)).find((a) => a.number === number)
        if (!found) throw notFound("Apartamento")
        return found
      },
    },
    residents: {
      async listByApartment(ctx, apartmentId) {
        return (await list("residents", ctx))
          .filter((r) => r.apartmentId === apartmentId)
          .sort(
            (a, b) =>
              Number(b.isResponsible) - Number(a.isResponsible) ||
              a.name.localeCompare(b.name, "pt-BR"),
          )
      },
      get: (ctx, id) => getOwned("residents", ctx, id, "Morador"),
    },
    staff: {
      list: (ctx) => list("staff", ctx),
      async onDutyAt(ctx, at) {
        const { weekday, minutes } = brasiliaClock(at)
        const onDuty = new Set(
          (await list("shifts", ctx))
            .filter((s) => shiftCovers(s, weekday, minutes))
            .map((s) => s.staffId),
        )
        return (await list("staff", ctx)).filter((s) => onDuty.has(s.id))
      },
    },
    schedule: {
      async listWeek(ctx) {
        return (await list("shifts", ctx)).sort(
          (a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime),
        )
      },
    },
    dev: {
      resetSeed: () => repo.resetSeed(),
      async counts(ctx) {
        const entries = await Promise.all(
          STORES.map(async (s) => [s, (await list(s, ctx)).length] as const),
        )
        return Object.fromEntries(entries)
      },
    },
  }
}
