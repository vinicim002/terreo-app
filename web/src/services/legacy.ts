// Serviços da spec 001 (condomínio, apartamentos, funcionários, escala, painel), agora exigindo
// alguém conectado (RF-030 da spec 002). O painel de desenvolvimento não exige, fora do modo real.
import { TIME_ZONE } from "@/i18n/datetime"
import { getIn, listIn, notFound, STORES, type ServiceDeps } from "./base"
import {
  ServiceError,
  type ApartmentService,
  type CondominiumService,
  type DevDataService,
  type ScheduleService,
  type StaffService,
} from "./contracts"
import { authorize } from "./permissions"
import type { ShiftAssignment } from "./schemas"

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

export function condominiumService(deps: ServiceDeps): CondominiumService {
  return {
    async getCurrent(ctx) {
      await authorize(deps, ctx, "condominium.view")
      const [condo] = await listIn(deps, "condominiums", ctx.condominiumId)
      if (!condo) throw notFound("Condomínio")
      return condo
    },
  }
}

export function apartmentService(deps: ServiceDeps): ApartmentService {
  return {
    async list(ctx, filter = {}) {
      await authorize(deps, ctx, "condominium.view")
      return (await listIn(deps, "apartments", ctx.condominiumId))
        .filter((a) => filter.floor === undefined || a.floor === filter.floor)
        .filter((a) => !filter.withoutResponsible || a.responsibleResidentId === null)
        .sort(
          (a, b) =>
            a.floor - b.floor || a.number.localeCompare(b.number, "pt-BR", { numeric: true }),
        )
    },
    async getByNumber(ctx, number) {
      await authorize(deps, ctx, "condominium.view")
      const found = (await listIn(deps, "apartments", ctx.condominiumId)).find(
        (a) => a.number === number,
      )
      if (!found) throw notFound("Apartamento")
      return found
    },
    async get(ctx, id) {
      await authorize(deps, ctx, "condominium.view")
      return getIn(deps, "apartments", ctx.condominiumId, id, "Apartamento")
    },
  }
}

export function staffService(deps: ServiceDeps): StaffService {
  return {
    async list(ctx) {
      await authorize(deps, ctx, "condominium.view")
      return listIn(deps, "staff", ctx.condominiumId)
    },
    async onDutyAt(ctx, at) {
      await authorize(deps, ctx, "condominium.view")
      const { weekday, minutes } = brasiliaClock(at)
      const onDuty = new Set(
        (await listIn(deps, "shifts", ctx.condominiumId))
          .filter((s) => shiftCovers(s, weekday, minutes))
          .map((s) => s.staffId),
      )
      return (await listIn(deps, "staff", ctx.condominiumId)).filter((s) => onDuty.has(s.id))
    },
  }
}

export function scheduleService(deps: ServiceDeps): ScheduleService {
  return {
    async listWeek(ctx) {
      await authorize(deps, ctx, "condominium.view")
      return (await listIn(deps, "shifts", ctx.condominiumId)).sort(
        (a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime),
      )
    },
  }
}

const COUNTED = STORES.filter((s) => !["otpRequests", "sessions", "outbox"].includes(s))

export function devService(deps: ServiceDeps): DevDataService {
  const guard = () => {
    if (deps.mode === "real") throw new ServiceError("forbidden", "Indisponível nesta versão.")
  }
  return {
    async resetSeed() {
      guard()
      await deps.repo.resetSeed()
    },
    async counts(ctx) {
      guard()
      const entries = await Promise.all(
        COUNTED.map(
          async (s) =>
            [s, (await deps.repo.byIndex(s, "byCondominium", ctx.condominiumId)).length] as const,
        ),
      )
      return Object.fromEntries(entries)
    },
  }
}
