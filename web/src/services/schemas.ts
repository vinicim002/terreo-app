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
  toPhone: E164,
  kind: z.enum(["otp", "invite"]),
  body: z.string(),
  createdAt: isoDateTime,
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
