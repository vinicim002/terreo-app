import { z } from "zod"

// Esquemas do data-model.md. São a fonte dos tipos usados pelos serviços e pelas telas.
const uuid = z.uuid()
const isoDateTime = z.iso.datetime()
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário no formato HH:mm")

export const CondominiumSchema = z.object({
  id: uuid,
  name: z.string().min(2).max(120), // obrigatório, 2–120 caracteres
  shortAddress: z.string().max(160).nullable(),
  floors: z.int().min(1),
  unitsPerFloor: z.int().min(1),
  timezone: z.literal("America/Sao_Paulo"),
})

export const ApartmentSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  number: z.string().min(1), // único por condomínio (conferido pelo serviço)
  floor: z.int().min(1), // 1 ≤ floor ≤ Condominium.floors (conferido pelo serviço)
  responsibleResidentId: uuid.nullable(), // → Resident do mesmo apartamento; nulo = sem responsável
})

export const ResidentKindSchema = z.enum(["owner", "tenant", "family"])

export const ResidentSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  apartmentId: uuid,
  name: z.string().min(2).max(120),
  // obrigatório, formato E.164 (+ seguido de 10 a 15 dígitos); único por condomínio
  phone: z.string().regex(/^\+\d{10,15}$/, "Telefone no formato E.164"),
  photoUrl: z.string().nullable(),
  kind: ResidentKindSchema,
  isResponsible: z.boolean(), // exatamente um true por apartamento com moradores
})

export const StaffSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  name: z.string().min(2).max(120),
  role: z.enum(["doorman", "cleaner"]),
  isHead: z.boolean(),
  photoUrl: z.string().nullable(),
})

export const ShiftAssignmentSchema = z.object({
  id: uuid,
  condominiumId: uuid,
  staffId: uuid,
  weekday: z.int().min(0).max(6), // 0 (domingo) a 6 (sábado)
  startTime: hhmm,
  endTime: hhmm, // se menor que startTime, o turno termina no dia seguinte
})

export const SeedMetaSchema = z.object({
  version: z.int().min(1),
  seededAt: isoDateTime,
})

export type Condominium = z.infer<typeof CondominiumSchema>
export type Apartment = z.infer<typeof ApartmentSchema>
export type Resident = z.infer<typeof ResidentSchema>
export type ResidentKind = z.infer<typeof ResidentKindSchema>
export type Staff = z.infer<typeof StaffSchema>
export type ShiftAssignment = z.infer<typeof ShiftAssignmentSchema>
export type SeedMeta = z.infer<typeof SeedMetaSchema>
