import { describe, expect, it } from "vitest"
import { EXAMPLE_ACCOUNTS, SEED_VERSION, buildSeed } from "@/services/local/seed"
import {
  ApartmentSchema,
  EmergencyContactSchema,
  ManagerAssignmentSchema,
  PersonSchema,
  PetSchema,
  ResidencySchema,
  RuleSchema,
  StaffSchema,
  VehicleSchema,
} from "@/services/schemas"

const seed = buildSeed()
const byNumber = (n: string) => seed.apartments.find((a) => a.number === n)!
const residentsOf = (n: string) => seed.residencies.filter((r) => r.apartmentId === byNumber(n).id)
const person = (id: string) => seed.people.find((p) => p.id === id)!

describe("dados de exemplo v3 — base da spec 002", () => {
  it("está na versão 3 e passa nos esquemas", () => {
    expect(SEED_VERSION).toBe(3)
    seed.apartments.forEach((a) => ApartmentSchema.parse(a))
    seed.people.forEach((p) => PersonSchema.parse(p))
    seed.residencies.forEach((r) => ResidencySchema.parse(r))
    seed.staff.forEach((s) => StaffSchema.parse(s))
    seed.managers.forEach((m) => ManagerAssignmentSchema.parse(m))
    seed.vehicles.forEach((v) => VehicleSchema.parse(v))
    seed.pets.forEach((p) => PetSchema.parse(p))
    seed.emergencyContacts.forEach((c) => EmergencyContactSchema.parse(c))
    seed.rules.forEach((r) => RuleSchema.parse(r))
  })

  it("tem a síndica morando no 1201 (dois papéis)", () => {
    expect(seed.managers).toHaveLength(1)
    const sindica = seed.managers[0].personId
    const [responsavel] = residentsOf("1201")
    expect(responsavel.personId).toBe(sindica)
    expect(responsavel.isResponsible).toBe(true)
  })

  it("tem 3 porteiros com pessoa e 2 faxineiros sem", () => {
    const porteiros = seed.staff.filter((s) => s.role === "doorman")
    expect(porteiros).toHaveLength(3)
    porteiros.forEach((s) => expect(person(s.personId!)).toBeDefined())
    expect(seed.staff.filter((s) => s.role === "cleaner").every((s) => s.personId === null)).toBe(
      true,
    )
  })

  it("tem 44 apartamentos ativos, o 902 pendente e 3 sem cadastro", () => {
    for (const n of ["303", "704", "1102"]) {
      expect(residentsOf(n)).toHaveLength(0)
      expect(byNumber(n).responsibleResidentId).toBeNull()
    }
    const [pendente] = residentsOf("902")
    expect(person(pendente.personId).firstAccessAt).toBeNull()
    const ativos = seed.apartments.filter((a) => {
      const rs = seed.residencies.filter((r) => r.apartmentId === a.id)
      return rs.some((r) => r.isResponsible && person(r.personId).firstAccessAt)
    })
    expect(ativos).toHaveLength(44)
  })

  it("tem um responsável por apartamento com moradores, com as duas permissões", () => {
    for (const apt of seed.apartments) {
      const rs = seed.residencies.filter((r) => r.apartmentId === apt.id)
      if (rs.length === 0) continue
      const resp = rs.filter((r) => r.isResponsible)
      expect(resp, apt.number).toHaveLength(1)
      expect(apt.responsibleResidentId).toBe(resp[0].id)
      expect(resp[0].canRegisterDeliveries && resp[0].canVotePolls).toBe(true)
    }
  })

  it("tem celulares únicos, todos fictícios (DDD 00)", () => {
    const phones = seed.people.map((p) => p.phone)
    expect(new Set(phones).size).toBe(phones.length)
    phones.forEach((p) => expect(p).toMatch(/^\+5500\d{9}$/))
    seed.emergencyContacts.forEach((c) => expect(c.phone).toMatch(/^\+5500\d{9}$/))
  })

  it("tem 10 a 15 regras nos 6 temas", () => {
    expect(seed.rules.length).toBeGreaterThanOrEqual(10)
    expect(seed.rules.length).toBeLessThanOrEqual(15)
    expect(new Set(seed.rules.map((r) => r.topic)).size).toBe(6)
  })

  it("tem as contas de exemplo para a tela de entrada", () => {
    expect(EXAMPLE_ACCOUNTS.map((a) => a.key)).toEqual([
      "manager",
      "front-desk",
      "responsible",
      "family",
      "pending",
    ])
    for (const conta of EXAMPLE_ACCOUNTS) {
      expect(
        seed.people.some((p) => p.phone === conta.phone),
        conta.key,
      ).toBe(true)
    }
    const familiar = seed.people.find((p) => p.phone === EXAMPLE_ACCOUNTS[3].phone)!
    const r = seed.residencies.find((x) => x.personId === familiar.id)!
    expect(r.isResponsible).toBe(false)
    expect(r.kind).toBe("family")
    // Spec 003 (T011a): o familiar do 804 pode votar, para sugerir em enquetes oficiais.
    expect(r.canVotePolls).toBe(true)
  })
})

describe("dados de exemplo v3 — comunicação (spec 003, RF-030)", () => {
  const agora = new Date("2026-11-16T12:00:00Z")
  const s = buildSeed(agora)

  it("passa nos esquemas", async () => {
    const schemas = await import("@/services/schemas")
    s.notices.forEach((x) => schemas.NoticeSchema.parse(x))
    s.noticeReads.forEach((x) => schemas.NoticeReadSchema.parse(x))
    s.polls.forEach((x) => schemas.PollSchema.parse(x))
    s.pollVotes.forEach((x) => schemas.PollVoteSchema.parse(x))
    s.meetings.forEach((x) => schemas.MeetingSchema.parse(x))
    s.agendaEvents.forEach((x) => schemas.AgendaEventSchema.parse(x))
    s.notifications.forEach((x) => schemas.NotificationSchema.parse(x))
  })

  it("tem avisos lido, não lido, importante com confirmação, resolvido e agendado (US1, US2)", () => {
    const publicados = s.notices.filter((n) => n.publishedAt)
    expect(publicados.every((n) => new Date(n.publishedAt!) <= agora)).toBe(true)
    const agendado = s.notices.find((n) => !n.publishedAt)!
    expect(new Date(agendado.publishAt) > agora).toBe(true)
    const agua = s.notices.find((n) => n.kind === "water")!
    expect(agua).toMatchObject({
      important: true,
      requireConfirmation: true,
      remindDayBefore: true,
    })
    expect(s.notices.some((n) => n.resolvedAt && n.resolutionNote)).toBe(true)
    expect(s.noticeReads.some((r) => r.noticeId === agua.id && r.confirmedAt)).toBe(true)
    expect(s.noticeReads.every((r) => new Date(r.readAt) <= agora)).toBe(true)
  })

  it("deixa a conta responsible com aviso não lido e sem voto na fachada", () => {
    const resp = s.people.find((p) => p.phone === EXAMPLE_ACCOUNTS[2].phone)!
    const energia = s.notices.find((n) => n.kind === "power")!
    expect(s.noticeReads.some((r) => r.noticeId === energia.id && r.personId === resp.id)).toBe(
      false,
    )
    const fachada = s.polls.find((p) => p.official && !p.closedAt)!
    expect(fachada.question).toBe("Qual cor para a nova pintura da fachada?")
    expect(s.pollVotes.some((v) => v.pollId === fachada.id && v.personId === resp.id)).toBe(false)
    expect(s.pollVotes.filter((v) => v.pollId === fachada.id)).toHaveLength(12)
  })

  it("tem uma enquete aberta e duas encerradas (US3)", () => {
    expect(s.polls.filter((p) => !p.closedAt)).toHaveLength(1)
    expect(s.polls.filter((p) => p.closedAt)).toHaveLength(2)
    // Oficiais: no máximo um voto por apartamento.
    for (const p of s.polls.filter((x) => x.official)) {
      const aptos = s.pollVotes.filter((v) => v.pollId === p.id).map((v) => v.apartmentId)
      expect(new Set(aptos).size).toBe(aptos.length)
    }
  })

  it("tem reunião futura, reunião passada com resumo e eventos que se repetem (US4)", () => {
    expect(s.meetings.some((m) => new Date(m.startsAt) > agora && !m.summary)).toBe(true)
    expect(s.meetings.some((m) => new Date(m.startsAt) < agora && m.summary)).toBe(true)
    expect(s.agendaEvents.map((e) => e.recurrence).sort()).toEqual([
      "semiannual",
      "weekly",
      "yearly",
    ])
  })

  it("tem notificações lidas e não lidas para as contas de exemplo (US5)", () => {
    const resp = s.people.find((p) => p.phone === EXAMPLE_ACCOUNTS[2].phone)!
    const dele = s.notifications.filter((n) => n.personId === resp.id)
    expect(dele.some((n) => n.readAt)).toBe(true)
    expect(dele.some((n) => !n.readAt)).toBe(true)
    const portaria = s.people.find((p) => p.phone === EXAMPLE_ACCOUNTS[1].phone)!
    const daPortaria = s.notifications.filter((n) => n.personId === portaria.id)
    expect(daPortaria.length).toBeGreaterThan(0)
    expect(daPortaria.every((n) => n.type.startsWith("notice"))).toBe(true)
  })
})
