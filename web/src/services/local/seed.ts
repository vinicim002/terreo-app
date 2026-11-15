/**
 * Dados de exemplo do Edifício Taquaretinga (data-model.md, RF-027, RF-028, RF-028a).
 * TUDO É FICTÍCIO: nomes inventados e telefones com DDD inexistente (00).
 * Os números do prédio (48 apartamentos, 12 andares) são provisórios — mude só aqui.
 */
import type {
  Apartment,
  Condominium,
  Resident,
  ResidentKind,
  ShiftAssignment,
  Staff,
} from "../schemas"

/** Mude ao alterar os dados: aparelhos com versão diferente recriam os dados de exemplo. */
export const SEED_VERSION = 1

export const FLOORS = 12
export const UNITS_PER_FLOOR = 4
/** Apartamentos ainda sem responsável cadastrado. */
const WITHOUT_RESPONSIBLE = new Set(["303", "704", "1102"])

/** UUIDs determinísticos (versão 4 válida): os mesmos em todos os aparelhos e testes. */
function id(kind: number, n: number) {
  return `00000000-0000-4000-8${kind.toString(16).padStart(3, "0")}-${n.toString(16).padStart(12, "0")}`
}

export const TAQUARETINGA_ID = id(0, 1)

const FIRST_NAMES = [
  "Ana",
  "Bruno",
  "Carla",
  "Diego",
  "Elisa",
  "Fábio",
  "Gabriela",
  "Heitor",
  "Iara",
  "João",
  "Kátia",
  "Lucas",
  "Marina",
  "Nícolas",
  "Olívia",
  "Paulo",
  "Renata",
  "Samuel",
  "Tânia",
  "Vítor",
]
const LAST_NAMES = [
  "Amarante",
  "Bastos",
  "Corrêa",
  "Damasceno",
  "Esteves",
  "Falcão",
  "Guedes",
  "Holanda",
  "Ivo",
  "Jardim",
  "Lacerda",
  "Meireles",
  "Nogueira",
  "Orsini",
  "Prado",
  "Queiroz",
]

export interface SeedData {
  condominium: Condominium
  apartments: Apartment[]
  residents: Resident[]
  staff: Staff[]
  shifts: ShiftAssignment[]
}

export function buildSeed(): SeedData {
  const condominiumId = TAQUARETINGA_ID
  const condominium: Condominium = {
    id: condominiumId,
    name: "Edifício Taquaretinga",
    shortAddress: null,
    floors: FLOORS,
    unitsPerFloor: UNITS_PER_FLOOR,
    timezone: "America/Sao_Paulo",
  }

  const apartments: Apartment[] = []
  const residents: Resident[] = []
  let residentN = 0
  for (let floor = 1; floor <= FLOORS; floor++) {
    for (let unit = 1; unit <= UNITS_PER_FLOOR; unit++) {
      const index = apartments.length
      const number = `${floor}${String(unit).padStart(2, "0")}`
      const apartmentId = id(1, index + 1)
      let responsibleResidentId: string | null = null
      if (!WITHOUT_RESPONSIBLE.has(number)) {
        const lastName = LAST_NAMES[index % LAST_NAMES.length]
        const people = 1 + (index % 4) // de 1 a 4 moradores
        for (let p = 0; p < people; p++) {
          residentN += 1
          const isResponsible = p === 0
          const kind: ResidentKind = isResponsible
            ? index % 3 === 0
              ? "tenant"
              : "owner"
            : "family"
          const resident: Resident = {
            id: id(2, residentN),
            condominiumId,
            apartmentId,
            name: `${FIRST_NAMES[(index * 3 + p * 7) % FIRST_NAMES.length]} ${lastName}`,
            phone: `+5500${String(900000000 + residentN).padStart(9, "0")}`,
            photoUrl: null,
            kind,
            isResponsible,
          }
          if (isResponsible) responsibleResidentId = resident.id
          residents.push(resident)
        }
      }
      apartments.push({ id: apartmentId, condominiumId, number, floor, responsibleResidentId })
    }
  }

  const staff: Staff[] = [
    {
      id: id(3, 1),
      condominiumId,
      name: "Jonas Siqueira",
      role: "doorman",
      isHead: true,
      photoUrl: null,
    },
    {
      id: id(3, 2),
      condominiumId,
      name: "Caio Antunes",
      role: "doorman",
      isHead: false,
      photoUrl: null,
    },
    {
      id: id(3, 3),
      condominiumId,
      name: "Pedro Rangel",
      role: "doorman",
      isHead: false,
      photoUrl: null,
    },
    {
      id: id(3, 4),
      condominiumId,
      name: "Marta Souto",
      role: "cleaner",
      isHead: false,
      photoUrl: null,
    },
    {
      id: id(3, 5),
      condominiumId,
      name: "Lia Barreto",
      role: "cleaner",
      isHead: false,
      photoUrl: null,
    },
  ]
  const [jonas, caio, pedro, marta, lia] = staff

  // Escala provisória dos porteiros (semelhante ao mockup), domingo (0) a sábado (6),
  // nos turnos fixos do minimundo. O rodízio real das folgas será confirmado com o síndico.
  const DOORMEN: Record<string, Staff[]> = {
    "06:00-14:00": [pedro, jonas, jonas, jonas, jonas, jonas, caio],
    "14:00-22:00": [jonas, caio, caio, caio, caio, pedro, jonas],
    "22:00-06:00": [caio, pedro, pedro, pedro, pedro, caio, pedro],
  }
  const shifts: ShiftAssignment[] = []
  let shiftN = 0
  for (const [range, byWeekday] of Object.entries(DOORMEN)) {
    const [startTime, endTime] = range.split("-")
    byWeekday.forEach((person, weekday) => {
      shifts.push({
        id: id(4, ++shiftN),
        condominiumId,
        staffId: person.id,
        weekday,
        startTime,
        endTime,
      })
    })
  }
  // Faxineiros (provisório): 08:00–17:00 de segunda a sexta e 08:00–12:00 aos sábados.
  for (const person of [marta, lia]) {
    for (let weekday = 1; weekday <= 6; weekday++) {
      shifts.push({
        id: id(4, ++shiftN),
        condominiumId,
        staffId: person.id,
        weekday,
        startTime: "08:00",
        endTime: weekday === 6 ? "12:00" : "17:00",
      })
    }
  }

  return { condominium, apartments, residents, staff, shifts }
}
