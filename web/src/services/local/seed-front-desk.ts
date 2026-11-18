/**
 * Dados de exemplo da portaria (spec 004, data-model.md; RF-026). TUDO É FICTÍCIO.
 * As datas são relativas a `now`, como na comunicação (spec 003).
 */
import { brasiliaToIso, dayKeyBrasilia, startOfDayBrasilia } from "@/i18n/datetime"
import type {
  Apartment,
  Delivery,
  FrontDeskMemo,
  InboundMessage,
  LostItem,
  Notification,
  Person,
  Residency,
  TravelMode,
  Visitor,
} from "../schemas"

export interface FrontDeskSeed {
  deliveries: Delivery[]
  visitors: Visitor[]
  travelModes: TravelMode[]
  memos: FrontDeskMemo[]
  lostItems: LostItem[]
  inboundMessages: InboundMessage[]
  /** Notificações da portaria para as contas de exemplo (somadas às da comunicação). */
  frontDeskNotifications: Notification[]
}

export interface FrontDeskBase {
  condominiumId: string
  apartments: Apartment[]
  people: Person[]
  residencies: Residency[]
  managerPersonId: string
  doormanPersonIds: string[]
  id: (kind: number, n: number) => string
}

/**
 * Foto de exemplo de uma caixa (160 × 120, desenhada uma vez e embutida): o seed também roda nos testes em Node,
 * onde não há canvas para gerar imagens (achado O2 da análise).
 */
export const SAMPLE_BOX_PHOTO =
  "data:image/jpeg;base64,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"

const DAY = 86_400_000

export function buildFrontDeskSeed(base: FrontDeskBase, now: Date): FrontDeskSeed {
  const { condominiumId, id } = base
  const today = startOfDayBrasilia(now).getTime()
  const day = (offset: number) => dayKeyBrasilia(new Date(today + offset * DAY + 12 * 3_600_000))
  const at = (offset: number, time: string) => brasiliaToIso(day(offset), time)
  /** Um instante já passado, `hours` antes de agora. */
  const ago = (hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString()
  /** Como `ago`, mas sem passar para ontem: logo depois da meia-noite, fica no começo do dia de hoje. */
  const agoToday = (hours: number) =>
    new Date(
      Math.max(now.getTime() - hours * 3_600_000, Math.min(today + 60_000, now.getTime())),
    ).toISOString()

  const apt = (number: string) => base.apartments.find((a) => a.number === number)!
  const active = (r: Residency) => !!base.people.find((p) => p.id === r.personId)?.firstAccessAt
  const responsibleOf = (number: string) =>
    base.residencies.find((r) => r.apartmentId === apt(number).id && r.isResponsible && active(r))!
      .personId
  const familyOf804 = base.residencies.find(
    (r) => r.apartmentId === apt("804").id && !r.isResponsible,
  )!.personId
  const [jonas, caio] = base.doormanPersonIds

  // ---------- Entregas (Histórias 1 e 2) ----------
  const deliveries: Delivery[] = []
  const delivery = (
    number: string,
    data: Partial<Delivery> & Pick<Delivery, "origin" | "status" | "createdById" | "createdAt">,
  ) =>
    deliveries.push({
      id: id(20, deliveries.length + 1),
      condominiumId,
      apartmentId: apt(number).id,
      store: null,
      storeName: null,
      code: null,
      note: null,
      onArrival: null,
      size: null,
      photo: null,
      notifyResident: true,
      arrivedAt: null,
      receivedById: null,
      pickedUpAt: null,
      pickedUpById: null,
      pickupRegisteredById: null,
      lastReminderDay: null,
      deletedAt: null,
      ...data,
    })
  const resp804 = responsibleOf("804")
  // 804: dois códigos aguardando (um de cada pessoa).
  delivery("804", {
    origin: "app",
    status: "awaiting",
    store: "ifood",
    code: "4821",
    onArrival: "elevator",
    createdById: resp804,
    createdAt: agoToday(1),
  })
  delivery("804", {
    origin: "app",
    status: "awaiting",
    store: "mercado-livre",
    code: "MLB-73",
    onArrival: "front-desk",
    note: "Caixa grande, pode deixar na portaria",
    createdById: familyOf804,
    createdAt: agoToday(3),
  })
  // 804: caixa da Amazon na portaria com foto; Shopee retirada ontem.
  const amazon = ago(2)
  delivery("804", {
    origin: "front-desk",
    status: "at-desk",
    store: "amazon",
    size: "medium",
    photo: SAMPLE_BOX_PHOTO,
    createdById: jonas,
    createdAt: amazon,
    arrivedAt: amazon,
    receivedById: jonas,
  })
  delivery("804", {
    origin: "app",
    status: "picked-up",
    store: "shopee",
    code: "BR2611",
    onArrival: "front-desk",
    createdById: resp804,
    createdAt: at(-2, "10:00"),
    arrivedAt: at(-1, "14:10"),
    receivedById: jonas,
    pickedUpAt: at(-1, "18:05"),
    pickedUpById: resp804,
    pickupRegisteredById: resp804,
  })
  // Outros apartamentos: 5 códigos aguardando.
  for (const [number, store, code, onArrival] of [
    ["101", "ifood", "1290", "elevator"],
    ["202", "mercado-livre", "MLB-41", "front-desk"],
    ["404", "amazon", "AMZ-77", "front-desk"],
    ["601", "ifood", "5512", "call"],
    ["1004", "shopee", "BR9033", "front-desk"],
  ] as const)
    delivery(number, {
      origin: "app",
      status: "awaiting",
      store,
      code,
      onArrival,
      createdById: responsibleOf(number),
      createdAt: ago(2 + deliveries.length),
    })
  // Na portaria: uma há 4 dias (gera lembrete), uma de ontem, uma no 1003 (em viagem) e uma correspondência.
  delivery("502", {
    origin: "front-desk",
    status: "at-desk",
    store: "shopee",
    size: "small",
    createdById: caio,
    createdAt: at(-4, "16:00"),
    arrivedAt: at(-4, "16:00"),
    receivedById: caio,
  })
  delivery("701", {
    origin: "front-desk",
    status: "at-desk",
    store: "correios",
    size: "envelope",
    createdById: jonas,
    createdAt: at(-1, "11:20"),
    arrivedAt: at(-1, "11:20"),
    receivedById: jonas,
  })
  delivery("1003", {
    origin: "front-desk",
    status: "at-desk",
    store: "amazon",
    size: "large",
    createdById: jonas,
    createdAt: at(-1, "09:00"),
    arrivedAt: at(-1, "09:00"),
    receivedById: jonas,
  })
  const mail = ago(1.5)
  delivery("502", {
    origin: "mail",
    status: "at-desk",
    createdById: jonas,
    createdAt: mail,
    arrivedAt: mail,
    receivedById: jonas,
  })

  // ---------- Visitantes (História 3) ----------
  const visitors: Visitor[] = []
  const visitor = (
    number: string,
    data: Partial<Visitor> & Pick<Visitor, "name" | "day" | "fromTime" | "toTime">,
  ) =>
    visitors.push({
      id: id(21, visitors.length + 1),
      condominiumId,
      apartmentId: apt(number).id,
      kind: "visit",
      people: 1,
      status: "expected",
      walkIn: false,
      createdById: responsibleOf(number),
      createdAt: ago(20),
      arrivedAt: null,
      releasedById: null,
      ...data,
    })
  visitor("804", {
    name: "Mariana Costa",
    day: day(0),
    fromTime: "19:00",
    toTime: "21:00",
    people: 2,
  })
  visitor("302", {
    name: "Técnico da Claro",
    kind: "provider",
    day: day(0),
    fromTime: "08:00",
    toTime: "12:00",
  })
  visitor("804", {
    name: "Pedro Henrique",
    day: day(-1),
    fromTime: "20:00",
    toTime: "22:00",
    status: "arrived",
    arrivedAt: at(-1, "20:12"),
    releasedById: caio,
  })
  visitor("504", {
    name: "Rafael Dias",
    day: day(-2),
    fromTime: "15:00",
    toTime: "16:00",
    status: "no-show",
  })

  // ---------- Modo viagem (História 5) ----------
  const travelModes: TravelMode[] = [
    {
      id: id(22, 1),
      condominiumId,
      apartmentId: apt("1003").id,
      from: day(-1),
      to: day(6),
      createdById: responsibleOf("1003"),
      createdAt: at(-2, "21:00"),
      endedAt: null,
    },
  ]

  // ---------- Recados (História 4) ----------
  const memos: FrontDeskMemo[] = [
    {
      id: id(23, 1),
      condominiumId,
      authorId: jonas,
      text: "Lâmpada do hall do 3º andar queimada. O corredor fica escuro à noite.",
      createdAt: at(-1, "18:00"),
      seenAt: null,
      noticeId: null,
    },
  ]

  // ---------- Achados e perdidos (História 6) ----------
  const lost = (
    n: number,
    data: Partial<LostItem> & Pick<LostItem, "kind" | "description" | "createdAt">,
  ): LostItem => ({
    id: id(24, n),
    condominiumId,
    place: null,
    photo: null,
    status: "open",
    apartmentId: null,
    createdById: jonas,
    claimedAt: null,
    closedAt: null,
    ...data,
  })
  const lostItems: LostItem[] = [
    lost(1, {
      kind: "found",
      description: "Chaveiro com 3 chaves",
      place: "Hall do elevador",
      createdAt: ago(2),
    }),
    lost(2, {
      kind: "found",
      description: "Guarda-chuva azul",
      place: "Entrada do prédio",
      createdAt: at(-1, "08:30"),
      status: "claimed",
      apartmentId: apt("502").id,
      claimedAt: at(-1, "19:00"),
    }),
    lost(3, {
      kind: "found",
      description: "Bichinho de pelúcia",
      place: "Playground",
      createdAt: at(-7, "17:00"),
    }),
    lost(4, {
      kind: "lost",
      description: "Óculos de grau, armação preta",
      place: "Garagem ou elevador",
      createdAt: at(-2, "10:00"),
      apartmentId: apt("1203").id,
      createdById: responsibleOf("1203"),
    }),
  ]

  // ---------- Notificações das contas de exemplo ----------
  const frontDeskNotifications: Notification[] = []
  const add = (
    personId: string,
    data: Pick<Notification, "type" | "title" | "body" | "target" | "createdAt">,
  ) =>
    frontDeskNotifications.push({
      id: id(25, frontDeskNotifications.length + 1),
      condominiumId,
      personId,
      readAt: null,
      ...data,
    })
  for (const personId of [resp804, familyOf804])
    add(personId, {
      type: "delivery",
      title: "Encomenda na portaria",
      body: "Caixa média · Amazon (foto anexada). Passe na portaria para buscar.",
      target: { kind: "delivery", id: deliveries[2].id },
      createdAt: amazon,
    })
  add(base.managerPersonId, {
    type: "memo",
    title: "Recado da portaria",
    body: memos[0].text,
    target: { kind: "memo", id: memos[0].id },
    createdAt: memos[0].createdAt,
  })

  return {
    deliveries,
    visitors,
    travelModes,
    memos,
    lostItems,
    inboundMessages: [],
    frontDeskNotifications,
  }
}
