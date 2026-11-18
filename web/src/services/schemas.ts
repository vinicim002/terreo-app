import { z } from "zod"

// Esquemas do data-model.md (specs 001 e 002). São a fonte dos tipos usados pelos serviços e pelas telas.
const uuid = z.uuid()
const isoDateTime = z.iso.datetime()
const nullableDate = isoDateTime.nullable()
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário no formato HH:mm")
/** E.164: + seguido de 10 a 15 dígitos. */
export const E164 = z.string().regex(/^\+\d{10,15}$/, "Telefone no formato E.164")
const name = z.string().trim().min(2).max(120) // obrigatório, 2–120 caracteres

export const CondominiumSchema = z.object({
  id: uuid,
  name,
  shortAddress: z.string().max(160).nullable(),
  floors: z.int().min(1),
  unitsPerFloor: z.int().min(1),
  timezone: z.literal("America/Sao_Paulo"),
})

export const ApartmentSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  number: z.string().min(1), // único por condomínio
  floor: z.int().min(1), // 1 ≤ floor ≤ Condominium.floors
  responsibleResidentId: uuid.nullable(), // → Residency responsável; nulo = sem responsável
})

/** Pessoa que entra com o celular (spec 002). Sem CPF, nascimento ou documento (RF-024). */
export const PersonSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  name,
  phone: E164, // único por condomínio (RF-017)
  photo: z
    .string()
    .regex(/^data:image\/jpeg;base64,/)
    .nullable(), // no máximo 512 × 512 px (RF-025)
  firstAccessAt: nullableDate, // nulo = convite pendente
  welcomeSeenAt: nullableDate,
  rulesAcceptedAt: nullableDate,
  removedAt: nullableDate,
  /** Síndico e porteiro-chefe: mostrar o celular nos contatos (spec 005, esclarecimento 2). Ausente = não. */
  showPhoneInContacts: z.boolean().optional(),
})

export const ResidentKindSchema = z.enum(["owner", "tenant", "family"])

/** Morador de um apartamento (substitui o Resident da spec 001). */
export const ResidencySchema = z.object({
  id: uuid,
  condominiumId: uuid,
  personId: uuid,
  apartmentId: uuid,
  kind: ResidentKindSchema,
  isResponsible: z.boolean(), // no máximo um por apartamento
  canRegisterDeliveries: z.boolean(), // padrão true; sempre true se isResponsible
  canVotePolls: z.boolean(), // padrão false; sempre true se isResponsible
  invitedById: uuid.nullable(),
  invitedAt: isoDateTime,
  lastInviteAt: isoDateTime,
})

export const StaffSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  name,
  role: z.enum(["doorman", "cleaner"]),
  isHead: z.boolean(),
  photoUrl: z.string().nullable(),
  personId: uuid.nullable(), // porteiros entram com o celular; faxineiros, nulo
})

export const ManagerAssignmentSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  personId: uuid,
})

export const ShiftAssignmentSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  staffId: uuid,
  weekday: z.int().min(0).max(6), // 0 (domingo) a 6 (sábado)
  startTime: hhmm,
  endTime: hhmm, // se menor que startTime, o turno termina no dia seguinte
})

export const VehicleSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  apartmentId: uuid,
  // maiúsculas sem hífen; antiga ou Mercosul; única por condomínio
  plate: z.string().regex(/^([A-Z]{3}\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/),
  model: z.string().trim().min(1).max(60),
  color: z.string().trim().min(1).max(30),
})

export const PetKindSchema = z.enum(["dog", "cat", "bird", "other"])

export const PetSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  apartmentId: uuid,
  name: z.string().trim().min(1).max(60),
  kind: PetKindSchema,
})

export const EmergencyContactSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  apartmentId: uuid, // único por apartamento
  name,
  relationship: z.string().trim().min(2).max(40),
  phone: E164,
})

export const RuleTopicSchema = z.enum([
  "coexistence",
  "elevator-moves",
  "waste",
  "pets",
  "garage",
  "common-areas",
])

export const RuleSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  topic: RuleTopicSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  order: z.int().min(0),
})

export const OtpRequestSchema = z.object({
  id: uuid,
  phone: E164,
  codeHash: z.string().min(1), // o código em si não é guardado
  salt: z.string().min(1),
  createdAt: isoDateTime,
  expiresAt: isoDateTime,
  attempts: z.int().min(0).max(5),
  consumedAt: nullableDate,
  invalidatedAt: nullableDate,
})

export const RoleSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("resident"),
    condominiumId: uuid,
    residencyId: uuid,
    apartmentId: uuid,
  }),
  z.object({ kind: z.literal("front-desk"), condominiumId: uuid, staffId: uuid }),
  z.object({ kind: z.literal("manager"), condominiumId: uuid }),
])

export const SessionSchema = z.object({
  id: uuid,
  personId: uuid,
  deviceId: z.string().min(8),
  activeRole: RoleSchema.nullable(),
  createdAt: isoDateTime,
  lastSeenAt: isoDateTime,
  endedAt: nullableDate,
  endReason: z.enum(["signed-out", "removed", "phone-changed", "inactive"]).nullable(),
})

export const OutboxMessageSchema = z.object({
  id: uuid,
  condominiumId: uuid.nullable(),
  toPhone: E164.nullable(), // nulo nas mensagens ao grupo do condomínio (spec 003)
  kind: z.enum(["otp", "invite", "group", "private"]),
  body: z.string(),
  createdAt: isoDateTime,
})

// ---------- Spec 003: comunicação (data-model.md) ----------

const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato AAAA-MM-DD")

export const NoticeKindSchema = z.enum([
  "water",
  "elevator",
  "power",
  "meeting",
  "general",
  "other",
])

export const NoticeSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  authorId: uuid,
  kind: NoticeKindSchema,
  /** Nome do tipo quando `kind = other` (ex.: "Obras"), 2–30 caracteres. */
  customKind: z.string().trim().min(2).max(30).nullable(),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(1).max(2000),
  important: z.boolean(),
  sendToGroup: z.boolean(),
  requireConfirmation: z.boolean(),
  referenceDate: dayKey.nullable(), // dia do assunto (lembrete e agenda)
  remindDayBefore: z.boolean(), // exige referenceDate
  publishAt: isoDateTime,
  publishedAt: nullableDate,
  editedAt: nullableDate,
  version: z.int().min(1),
  resolvedAt: nullableDate,
  resolutionNote: z.string().trim().max(500).nullable(),
  reminderSentAt: nullableDate,
  deletedAt: nullableDate,
})

export const NoticeReadSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  noticeId: uuid,
  personId: uuid,
  version: z.int().min(1),
  readAt: isoDateTime,
  confirmedAt: nullableDate,
})

export const PollOptionSchema = z.object({ id: uuid, label: z.string().trim().min(1).max(80) })

export const PollSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  authorId: uuid,
  question: z.string().trim().min(5).max(200),
  options: z
    .array(PollOptionSchema)
    .min(2)
    .max(6)
    .refine(
      (opts) => new Set(opts.map((o) => o.label.toLocaleLowerCase())).size === opts.length,
      "Opções repetidas",
    ),
  official: z.boolean(),
  showPartial: z.boolean(),
  createdAt: isoDateTime,
  closesAt: isoDateTime,
  closedAt: nullableDate,
})

export const PollVoteSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  pollId: uuid,
  optionId: uuid,
  personId: uuid,
  apartmentId: uuid.nullable(), // preenchido nas oficiais
  votedAt: isoDateTime,
})

export const PollSuggestionSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  pollId: uuid,
  optionId: uuid,
  personId: uuid,
  apartmentId: uuid,
  suggestedAt: isoDateTime,
})

export const MeetingSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  authorId: uuid,
  startsAt: isoDateTime,
  place: z.string().trim().min(2).max(120),
  agenda: z.array(z.string().trim().min(2).max(200)).min(1).max(15),
  summary: z.string().trim().min(1).max(5000).nullable(),
  summaryAt: nullableDate,
  reminderSentAt: nullableDate,
  cancelledAt: nullableDate,
})

export const RecurrenceSchema = z.enum(["none", "weekly", "monthly", "semiannual", "yearly"])

export const AgendaEventSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  title: z.string().trim().min(2).max(80),
  kind: z.enum(["maintenance", "routine"]),
  startsAt: isoDateTime,
  durationMinutes: z.int().min(15).max(1440).nullable(),
  recurrence: RecurrenceSchema,
  cancelledAt: nullableDate,
})

export const NotificationTypeSchema = z.enum([
  "notice",
  "notice-updated",
  "notice-resolved",
  "notice-reminder",
  "meeting",
  "meeting-reminder",
  "meeting-summary",
  "poll",
  "poll-closed",
  "delivery",
  "delivery-reminder",
  "mail",
  "visitor",
  "lost-found",
  "memo",
  "emergency",
  "emergency-update",
  "general-alert",
  "general-alert-closed",
])

export const NotificationTargetSchema = z.object({
  kind: z.enum([
    "notice",
    "poll",
    "meeting",
    "delivery",
    "visitor",
    "lost-item",
    "memo",
    "emergency",
    "general-alert",
  ]),
  id: uuid,
})

export const NotificationSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  personId: uuid,
  type: NotificationTypeSchema,
  title: z.string().max(120),
  body: z.string().max(200),
  target: NotificationTargetSchema.nullable(),
  createdAt: isoDateTime,
  readAt: nullableDate,
})

export const NotificationPrefsSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  personId: uuid,
  app: z.object({
    notices: z.boolean(),
    meetings: z.boolean(),
    polls: z.boolean(),
    deliveries: z.boolean(),
    visitors: z.boolean(),
  }),
  // Só tipos pessoais: assuntos gerais vão ao grupo, nunca ao privado (esclarecimento 2).
  whatsapp: z.object({ deliveries: z.boolean(), visitors: z.boolean() }).strict(),
})

// ---------- Spec 004: portaria (data-model.md) ----------

const photo = z
  .string()
  .regex(/^data:image\/jpeg;base64,/)
  .nullable()
const optionalText = (max: number) => z.string().trim().min(1).max(max).nullable()

export const StoreSchema = z.enum([
  "ifood",
  "mercado-livre",
  "shopee",
  "amazon",
  "correios",
  "other",
])
export const OnArrivalSchema = z.enum(["elevator", "front-desk", "call"])
export const PackageSizeSchema = z.enum(["envelope", "small", "medium", "large"])
export const DeliveryStatusSchema = z.enum([
  "awaiting",
  "at-desk",
  "delivered",
  "picked-up",
  "not-arrived",
])

export const DeliverySchema = z
  .object({
    id: uuid,
    condominiumId: uuid,
    apartmentId: uuid,
    origin: z.enum(["app", "whatsapp", "front-desk", "mail"]),
    store: StoreSchema.nullable(),
    storeName: z.string().trim().min(2).max(40).nullable(),
    code: z
      .string()
      .regex(/^[A-Za-z0-9-]{1,30}$/)
      .nullable(),
    note: optionalText(140),
    onArrival: OnArrivalSchema.nullable(),
    size: PackageSizeSchema.nullable(),
    photo,
    status: DeliveryStatusSchema,
    notifyResident: z.boolean(),
    createdById: uuid,
    createdAt: isoDateTime,
    arrivedAt: nullableDate,
    receivedById: uuid.nullable(),
    pickedUpAt: nullableDate,
    pickedUpById: uuid.nullable(),
    pickupRegisteredById: uuid.nullable(),
    lastReminderDay: dayKey.nullable(),
    deletedAt: nullableDate,
  })
  .refine((d) => d.store !== "other" || !!d.storeName, {
    path: ["storeName"],
    message: "Informe a loja",
  })
  .refine((d) => d.store === "other" || d.storeName === null, { path: ["storeName"] })
  .refine((d) => !["app", "whatsapp"].includes(d.origin) || (!!d.code && !!d.onArrival), {
    path: ["code"],
  })

export const VisitorSchema = z
  .object({
    id: uuid,
    condominiumId: uuid,
    apartmentId: uuid,
    kind: z.enum(["visit", "provider"]),
    name: z.string().trim().min(2).max(80),
    day: dayKey,
    fromTime: hhmm,
    toTime: hhmm,
    people: z.int().min(1).max(20),
    status: z.enum(["expected", "arrived", "no-show", "cancelled"]),
    walkIn: z.boolean(),
    createdById: uuid,
    createdAt: isoDateTime,
    arrivedAt: nullableDate,
    releasedById: uuid.nullable(),
  })
  .refine((v) => v.fromTime < v.toTime, {
    path: ["toTime"],
    message: "Horário final antes do inicial",
  })

export const TravelModeSchema = z
  .object({
    id: uuid,
    condominiumId: uuid,
    apartmentId: uuid,
    from: dayKey,
    to: dayKey,
    createdById: uuid,
    createdAt: isoDateTime,
    endedAt: nullableDate,
  })
  .refine((v) => v.from <= v.to, { path: ["to"], message: "Volta antes da ida" })
  .refine(
    (v) =>
      (Date.parse(`${v.to}T12:00:00Z`) - Date.parse(`${v.from}T12:00:00Z`)) / 86_400_000 <= 120,
    { path: ["to"], message: "No máximo 120 dias" },
  )

export const FrontDeskMemoSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  authorId: uuid,
  text: z.string().trim().min(2).max(1000),
  createdAt: isoDateTime,
  seenAt: nullableDate,
  noticeId: uuid.nullable(),
})

export const LostItemSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  kind: z.enum(["found", "lost"]),
  description: z.string().trim().min(3).max(200),
  place: optionalText(80),
  photo,
  status: z.enum(["open", "claimed", "returned", "found"]),
  apartmentId: uuid.nullable(),
  createdById: uuid,
  createdAt: isoDateTime,
  claimedAt: nullableDate,
  closedAt: nullableDate,
})

export const InboundMessageSchema = z.object({
  id: uuid,
  condominiumId: uuid.nullable(),
  fromPhone: E164,
  text: z.string().max(500),
  receivedAt: isoDateTime,
  result: z.enum(["registered", "unknown-phone", "no-permission", "not-understood", "sos"]),
  deliveryId: uuid.nullable(),
})

// ---------- Segurança (spec 005, data-model.md) ----------

export const EmergencyKindSchema = z.enum([
  "health",
  "fire",
  "intrusion",
  "leak",
  "other",
  "unknown",
])

export const EmergencyAlertSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  apartmentId: uuid, // um open/acknowledged por apartamento
  kind: EmergencyKindSchema,
  origin: z.enum(["app", "whatsapp"]),
  createdById: uuid,
  createdAt: isoDateTime,
  status: z.enum(["open", "acknowledged", "resolved", "cancelled"]),
  acknowledgedAt: nullableDate,
  acknowledgedById: uuid.nullable(),
  resolvedAt: nullableDate,
  resolvedById: uuid.nullable(),
  resolutionNote: z.string().trim().max(300).nullable(),
  cancelledAt: nullableDate,
  cancelledById: uuid.nullable(),
  repeatedAt: nullableDate,
})

export const GeneralAlertKindSchema = z.enum(["fire", "gas", "power", "security", "other"])

export const GeneralAlertSchema = z.object({
  id: uuid,
  condominiumId: uuid, // no máximo um open
  kind: GeneralAlertKindSchema,
  message: z.string().trim().min(5).max(280),
  createdById: uuid,
  createdAt: isoDateTime,
  status: z.enum(["open", "closed"]),
  closedAt: nullableDate,
  closedById: uuid.nullable(),
  closingMessage: z.string().trim().max(280).nullable(),
})

export const GeneralAlertSeenSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  alertId: uuid,
  personId: uuid, // único por (alerta, pessoa)
  seenAt: isoDateTime,
})

export const ContactGroupSchema = z.enum(["building", "emergency"])

export const ContactSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  group: ContactGroupSchema,
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(60).nullable(),
  /** Número discável: serviço público (3 dígitos), 0800 ou telefone em E.164. */
  phone: z.string().regex(/^(1\d\d|0800\d{7}|\+\d{10,15})$/),
  isMobile: z.boolean(),
  frontDesk: z.boolean(), // o número da portaria (no máximo um)
  order: z.int().min(0),
})

export const SeedMetaSchema = z.object({
  version: z.int().min(1),
  seededAt: isoDateTime,
})

export type Condominium = z.infer<typeof CondominiumSchema>
export type Apartment = z.infer<typeof ApartmentSchema>
export type Person = z.infer<typeof PersonSchema>
export type ResidentKind = z.infer<typeof ResidentKindSchema>
export type Residency = z.infer<typeof ResidencySchema>
export type Staff = z.infer<typeof StaffSchema>
export type ManagerAssignment = z.infer<typeof ManagerAssignmentSchema>
export type ShiftAssignment = z.infer<typeof ShiftAssignmentSchema>
export type Vehicle = z.infer<typeof VehicleSchema>
export type PetKind = z.infer<typeof PetKindSchema>
export type Pet = z.infer<typeof PetSchema>
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>
export type RuleTopic = z.infer<typeof RuleTopicSchema>
export type Rule = z.infer<typeof RuleSchema>
export type OtpRequest = z.infer<typeof OtpRequestSchema>
export type Role = z.infer<typeof RoleSchema>
export type Session = z.infer<typeof SessionSchema>
export type OutboxMessage = z.infer<typeof OutboxMessageSchema>
export type SeedMeta = z.infer<typeof SeedMetaSchema>

export type NoticeKind = z.infer<typeof NoticeKindSchema>
export type Notice = z.infer<typeof NoticeSchema>
export type NoticeRead = z.infer<typeof NoticeReadSchema>
export type Poll = z.infer<typeof PollSchema>
export type PollVote = z.infer<typeof PollVoteSchema>
export type PollSuggestion = z.infer<typeof PollSuggestionSchema>
export type Meeting = z.infer<typeof MeetingSchema>
export type Recurrence = z.infer<typeof RecurrenceSchema>
export type AgendaEvent = z.infer<typeof AgendaEventSchema>
export type NotificationType = z.infer<typeof NotificationTypeSchema>
export type NotificationTarget = z.infer<typeof NotificationTargetSchema>
export type Notification = z.infer<typeof NotificationSchema>
export type NotificationPrefs = z.infer<typeof NotificationPrefsSchema>
export type Store = z.infer<typeof StoreSchema>
export type OnArrival = z.infer<typeof OnArrivalSchema>
export type PackageSize = z.infer<typeof PackageSizeSchema>
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>
export type Delivery = z.infer<typeof DeliverySchema>
export type Visitor = z.infer<typeof VisitorSchema>
export type TravelMode = z.infer<typeof TravelModeSchema>
export type FrontDeskMemo = z.infer<typeof FrontDeskMemoSchema>
export type LostItem = z.infer<typeof LostItemSchema>
export type InboundMessage = z.infer<typeof InboundMessageSchema>
export type EmergencyKind = z.infer<typeof EmergencyKindSchema>
export type EmergencyAlert = z.infer<typeof EmergencyAlertSchema>
export type GeneralAlertKind = z.infer<typeof GeneralAlertKindSchema>
export type GeneralAlert = z.infer<typeof GeneralAlertSchema>
export type GeneralAlertSeen = z.infer<typeof GeneralAlertSeenSchema>
export type ContactGroup = z.infer<typeof ContactGroupSchema>
export type Contact = z.infer<typeof ContactSchema>
