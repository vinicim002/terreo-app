/**
 * Dados de exemplo da segurança (spec 005, data-model.md; RF-022). TUDO É FICTÍCIO.
 * As datas são relativas a `now`, como na comunicação (spec 003). Os números das concessionárias são exemplos e
 * precisam ser conferidos com o síndico antes do lançamento.
 */
import type {
  Apartment,
  Contact,
  EmergencyAlert,
  GeneralAlert,
  GeneralAlertSeen,
  Person,
  Residency,
} from "../schemas"

export interface SecuritySeed {
  emergencyAlerts: EmergencyAlert[]
  generalAlerts: GeneralAlert[]
  generalAlertSeen: GeneralAlertSeen[]
  contacts: Contact[]
}

export interface SecurityBase {
  condominiumId: string
  apartments: Apartment[]
  people: Person[]
  residencies: Residency[]
  managerPersonId: string
  doormanPersonIds: string[]
  id: (kind: number, n: number) => string
}

const MIN = 60_000
const DAY = 86_400_000

/** [grupo, nome, descrição, número, é celular, é a portaria]. Números das concessionárias: exemplos a conferir. */
const CONTACTS: [Contact["group"], string, string | null, string, boolean, boolean][] = [
  ["building", "Portaria", "24h", "+550033331000", false, true],
  ["emergency", "SAMU", "Emergência médica", "192", false, false],
  ["emergency", "Bombeiros", "Incêndio e resgate", "193", false, false],
  ["emergency", "Polícia Militar", null, "190", false, false],
  ["emergency", "Defesa Civil", "Deslizamentos e alagamentos", "199", false, false],
  ["emergency", "Light (energia)", "Falta de luz", "08000210196", false, false],
  ["emergency", "Naturgy (gás)", "Vazamento de gás", "08000240197", false, false],
  ["emergency", "Águas do Rio", "Falta d'água e vazamentos", "08001950195", false, false],
]

export function buildSecuritySeed(base: SecurityBase, now: Date): SecuritySeed {
  const { condominiumId, id } = base
  const at = (ms: number) => new Date(now.getTime() - ms).toISOString()
  const apt = (number: string) => base.apartments.find((a) => a.number === number)!
  const responsibleOf = (number: string) =>
    base.residencies.find((r) => r.apartmentId === apt(number).id && r.isResponsible)!.personId
  const jonas = base.doormanPersonIds[0]

  const contacts: Contact[] = CONTACTS.map(
    ([group, name, description, phone, isMobile, frontDesk], i) => ({
      id: id(26, i + 1),
      condominiumId,
      group,
      name,
      description,
      phone,
      isMobile,
      frontDesk,
      order: group === "building" ? 0 : i - 1,
    }),
  )

  // Pedido de ajuda resolvido há 3 dias: atendido em 1 minuto (História 4).
  const raised = 3 * DAY
  const emergencyAlerts: EmergencyAlert[] = [
    {
      id: id(27, 1),
      condominiumId,
      apartmentId: apt("501").id,
      kind: "health",
      origin: "app",
      createdById: responsibleOf("501"),
      createdAt: at(raised),
      status: "resolved",
      acknowledgedAt: at(raised - MIN),
      acknowledgedById: jonas,
      resolvedAt: at(raised - 25 * MIN),
      resolvedById: jonas,
      resolutionNote: "Pressão baixa. A filha chegou e acompanhou até o hospital.",
      cancelledAt: null,
      cancelledById: null,
      repeatedAt: null,
    },
  ]

  // Alerta geral encerrado há 10 dias, em 25 minutos.
  const sent = 10 * DAY
  const generalAlerts: GeneralAlert[] = [
    {
      id: id(28, 1),
      condominiumId,
      kind: "gas",
      message: "Cheiro de gás no 2º andar. Não usem o elevador e deixem as janelas abertas.",
      createdById: jonas,
      createdAt: at(sent),
      status: "closed",
      closedAt: at(sent - 25 * MIN),
      closedById: jonas,
      closingMessage: "Vazamento contido pela companhia de gás. Situação controlada.",
    },
  ]

  return { emergencyAlerts, generalAlerts, generalAlertSeen: [], contacts }
}
