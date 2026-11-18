/**
 * Dados de exemplo do Edifício Taquaretinga (data-model.md das specs 001 a 004).
 * TUDO É FICTÍCIO: nomes inventados e celulares com DDD inexistente (00).
 * Os números do prédio (48 apartamentos, 12 andares) são provisórios — mude só aqui.
 */
import type {
  Apartment,
  Condominium,
  EmergencyContact,
  ManagerAssignment,
  Person,
  Pet,
  Residency,
  ResidentKind,
  Rule,
  RuleTopic,
  ShiftAssignment,
  Staff,
  Vehicle,
} from "../schemas"
import { buildCommunicationSeed, type CommunicationSeed } from "./seed-communication"
import { buildFrontDeskSeed, type FrontDeskSeed } from "./seed-front-desk"

/** Mude ao alterar os dados: aparelhos com versão diferente recriam os dados de exemplo. */
export const SEED_VERSION = 4

export const FLOORS = 12
export const UNITS_PER_FLOOR = 4
/** Apartamentos ainda sem cadastro. */
const WITHOUT_RESPONSIBLE = new Set(["303", "704", "1102"])
/** Apartamento com o responsável ainda com convite pendente. */
const PENDING = "902"
/** Apartamento da síndica. */
const MANAGER_HOME = "1201"

/** Data fixa dos acessos de exemplo, para os dados serem iguais em todo aparelho. */
const PAST = "2026-11-01T12:00:00.000Z"

/** UUIDs determinísticos (versão 4 válida): os mesmos em todos os aparelhos e testes. */
function id(kind: number, n: number) {
  return `00000000-0000-4000-8${kind.toString(16).padStart(3, "0")}-${n.toString(16).padStart(12, "0")}`
}
/** Celular fictício: +55 00 9xxxx-xxxx. */
const phone = (n: number) => `+5500${String(900000000 + n).padStart(9, "0")}`

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

export interface SeedData extends CommunicationSeed, FrontDeskSeed {
  condominium: Condominium
  apartments: Apartment[]
  people: Person[]
  residencies: Residency[]
  staff: Staff[]
  managers: ManagerAssignment[]
  shifts: ShiftAssignment[]
  vehicles: Vehicle[]
  pets: Pet[]
  emergencyContacts: EmergencyContact[]
  rules: Rule[]
}

/** Contas prontas para entrar nos modos dev e demo (tela de entrada). */
export const EXAMPLE_ACCOUNTS = [
  { key: "manager", phone: "" },
  { key: "front-desk", phone: "" },
  { key: "responsible", phone: "" },
  { key: "family", phone: "" },
  { key: "pending", phone: "" },
] as {
  key: "manager" | "front-desk" | "responsible" | "family" | "pending"
  phone: string
  name?: string
}[]

/** `now`: data de referência das datas da comunicação (spec 003). */
export function buildSeed(now: Date = new Date()): SeedData {
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
  const people: Person[] = []
  const residencies: Residency[] = []
  let n = 0
  for (let floor = 1; floor <= FLOORS; floor++) {
    for (let unit = 1; unit <= UNITS_PER_FLOOR; unit++) {
      const index = apartments.length
      const number = `${floor}${String(unit).padStart(2, "0")}`
      const apartmentId = id(1, index + 1)
      let responsibleResidentId: string | null = null
      if (!WITHOUT_RESPONSIBLE.has(number)) {
        const lastName = LAST_NAMES[index % LAST_NAMES.length]
        const count = number === PENDING || number === MANAGER_HOME ? 1 : 1 + (index % 4) // de 1 a 4 pessoas
        for (let p = 0; p < count; p++) {
          n += 1
          const isResponsible = p === 0
          const pending = number === PENDING
          const kind: ResidentKind = isResponsible
            ? index % 3 === 0
              ? "tenant"
              : "owner"
            : "family"
          const personName =
            number === MANAGER_HOME
              ? "Helena Duarte"
              : `${FIRST_NAMES[(index * 3 + p * 7) % FIRST_NAMES.length]} ${lastName}`
          const person: Person = {
            id: id(2, n),
            condominiumId,
            name: personName,
            phone: phone(n),
            photo: null,
            firstAccessAt: pending ? null : PAST,
            welcomeSeenAt: pending ? null : PAST,
            rulesAcceptedAt: pending ? null : PAST,
            removedAt: null,
          }
          const residency: Residency = {
            id: id(5, n),
            condominiumId,
            personId: person.id,
            apartmentId,
            kind: number === MANAGER_HOME ? "owner" : kind,
            isResponsible,
            canRegisterDeliveries: true,
            // Spec 003: o familiar da conta de exemplo "family" (804) pode votar, para sugerir em enquetes oficiais.
            canVotePolls: isResponsible || (number === "804" && p === 1),
            invitedById: null,
            invitedAt: PAST,
            lastInviteAt: PAST,
          }
          if (isResponsible) responsibleResidentId = residency.id
          people.push(person)
          residencies.push(residency)
        }
      }
      apartments.push({ id: apartmentId, condominiumId, number, floor, responsibleResidentId })
    }
  }

  // Porteiros entram com o próprio celular (esclarecimento da spec 002); faxineiros não entram.
  const doormen = [
    { name: "Jonas Siqueira", isHead: true },
    { name: "Caio Antunes", isHead: false },
    { name: "Pedro Rangel", isHead: false },
  ].map((d, i) => {
    const person: Person = {
      id: id(6, i + 1),
      condominiumId,
      name: d.name,
      phone: phone(9001 + i),
      photo: null,
      firstAccessAt: PAST,
      welcomeSeenAt: null,
      rulesAcceptedAt: null,
      removedAt: null,
    }
    people.push(person)
    return person
  })
  const staff: Staff[] = [
    ...doormen.map((p, i) => ({
      id: id(3, i + 1),
      condominiumId,
      name: p.name,
      role: "doorman" as const,
      isHead: i === 0,
      photoUrl: null,
      personId: p.id,
    })),
    {
      id: id(3, 4),
      condominiumId,
      name: "Marta Souto",
      role: "cleaner",
      isHead: false,
      photoUrl: null,
      personId: null,
    },
    {
      id: id(3, 5),
      condominiumId,
      name: "Lia Barreto",
      role: "cleaner",
      isHead: false,
      photoUrl: null,
      personId: null,
    },
  ]
  const [jonas, caio, pedro, marta, lia] = staff

  const apt = (number: string) => apartments.find((a) => a.number === number)!
  const residentsOf = (number: string) =>
    residencies.filter((r) => r.apartmentId === apt(number).id)
  const managerPerson = residentsOf(MANAGER_HOME)[0].personId
  const managers: ManagerAssignment[] = [{ id: id(7, 1), condominiumId, personId: managerPerson }]

  // Escala provisória dos porteiros (semelhante ao mockup), domingo (0) a sábado (6).
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

  const vehicles: Vehicle[] = [
    {
      id: id(8, 1),
      condominiumId,
      apartmentId: apt("804").id,
      plate: "KXY2B34",
      model: "Onix",
      color: "Prata",
    },
    {
      id: id(8, 2),
      condominiumId,
      apartmentId: apt("1201").id,
      plate: "RIO4E56",
      model: "Corolla",
      color: "Branco",
    },
    {
      id: id(8, 3),
      condominiumId,
      apartmentId: apt("502").id,
      plate: "LMN4321",
      model: "Gol",
      color: "Vermelho",
    },
  ]
  const pets: Pet[] = [
    { id: id(9, 1), condominiumId, apartmentId: apt("804").id, name: "Thor", kind: "dog" },
    { id: id(9, 2), condominiumId, apartmentId: apt("201").id, name: "Mimi", kind: "cat" },
  ]
  const emergencyContacts: EmergencyContact[] = [
    {
      id: id(10, 1),
      condominiumId,
      apartmentId: apt("1201").id,
      name: "Paula Duarte",
      relationship: "Filha",
      phone: phone(9901),
    },
  ]

  const RULES: [RuleTopic, string, string][] = [
    [
      "coexistence",
      "Horário de silêncio",
      "De domingo a quinta, das 22h às 8h; sexta, sábado e véspera de feriado, das 23h às 9h. Evite barulho de obras, música alta e arrastar móveis nesse período.",
    ],
    [
      "coexistence",
      "Respeito aos vizinhos e funcionários",
      "Trate vizinhos, porteiros e faxineiros com respeito. Reclamações vão para o síndico pelo app.",
    ],
    [
      "elevator-moves",
      "Uso do elevador",
      "O elevador de serviço é para mudanças, compras grandes, animais e obras. Não segure a porta por mais do que o necessário.",
    ],
    [
      "elevator-moves",
      "Mudanças",
      "Mudanças são agendadas com o síndico pelo app, de segunda a sábado, das 8h às 18h, com 48 horas de antecedência.",
    ],
    [
      "elevator-moves",
      "Obras nos apartamentos",
      "Obras com barulho só de segunda a sexta, das 9h às 17h. Avise o síndico antes de começar.",
    ],
    [
      "waste",
      "Lixo comum",
      "Lixo bem fechado, no depósito do térreo, até as 20h. Não deixe sacos no corredor.",
    ],
    [
      "waste",
      "Recicláveis e entulho",
      "Recicláveis separados no contêiner azul. Entulho de obra não vai no lixo comum: combine a retirada com o síndico.",
    ],
    [
      "pets",
      "Animais de estimação",
      "Animais circulam nas áreas comuns no colo ou na guia e usam o elevador de serviço. A sujeira é recolhida pelo dono.",
    ],
    [
      "garage",
      "Garagem",
      "Cada apartamento usa só a própria vaga. Velocidade máxima de 10 km/h e farol baixo ligado.",
    ],
    [
      "garage",
      "Visitantes na garagem",
      "Carros de visitantes só entram com autorização do morador e da portaria.",
    ],
    [
      "common-areas",
      "Áreas comuns",
      "Hall, escadas e corredores ficam livres. Não deixe objetos, bicicletas ou sapatos nos corredores.",
    ],
    [
      "common-areas",
      "Problemas no prédio",
      'Lâmpada queimada, vazamento ou portão com defeito: avise pelo app em "Avisar problema".',
    ],
  ]
  const rules: Rule[] = RULES.map(([topic, title, body], i) => ({
    id: id(11, i + 1),
    condominiumId,
    topic,
    title,
    body,
    order: i,
  }))

  const communication = buildCommunicationSeed(
    {
      condominiumId,
      apartments,
      people,
      residencies,
      managerPersonId: managerPerson,
      frontDeskPersonId: staff[0].personId!,
      id,
    },
    now,
  )

  const frontDesk = buildFrontDeskSeed(
    {
      condominiumId,
      apartments,
      people,
      residencies,
      managerPersonId: managerPerson,
      doormanPersonIds: staff.filter((s) => s.role === "doorman").map((s) => s.personId!),
      id,
    },
    now,
  )

  return {
    ...communication,
    ...frontDesk,
    condominium,
    apartments,
    people,
    residencies,
    staff,
    managers,
    shifts,
    vehicles,
    pets,
    emergencyContacts,
    rules,
  }
}

// Contas de exemplo: preenchidas a partir dos dados (mesmos ids em todo aparelho).
;(() => {
  const seed = buildSeed()
  const apt = (number: string) => seed.apartments.find((a) => a.number === number)!
  const personOf = (residencyFilter: (r: Residency) => boolean) =>
    seed.people.find((p) => p.id === seed.residencies.find(residencyFilter)!.personId)!
  const set = (key: (typeof EXAMPLE_ACCOUNTS)[number]["key"], person: Person) => {
    const account = EXAMPLE_ACCOUNTS.find((a) => a.key === key)!
    account.phone = person.phone
    account.name = person.name
  }
  set(
    "manager",
    seed.people.find((p) => p.id === seed.managers[0].personId)!,
  )
  set(
    "front-desk",
    seed.people.find((p) => p.id === seed.staff[0].personId)!,
  )
  set(
    "responsible",
    personOf((r) => r.apartmentId === apt("804").id && r.isResponsible),
  )
  set(
    "family",
    personOf((r) => r.apartmentId === apt("804").id && !r.isResponsible),
  )
  set(
    "pending",
    personOf((r) => r.apartmentId === apt("902").id),
  )
})()
