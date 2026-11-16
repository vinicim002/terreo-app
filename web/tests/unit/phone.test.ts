import { describe, expect, it } from "vitest"
import { formatPhone, isAcceptedPhone, normalizePhone } from "@/phone/phone"

// RF-001a e research R5.
describe("celular", () => {
  it.each(["(21) 98765-4321", "21987654321", "+55 21 98765-4321", "21 9 8765 4321"])(
    "%s vira +5521987654321",
    (entrada) => {
      expect(normalizePhone(entrada, "BR", "real")).toEqual({ ok: true, e164: "+5521987654321" })
    },
  )

  it("recusa número sem DDD, avisando que falta o DDD", () => {
    expect(normalizePhone("98765-4321", "BR", "real")).toEqual({
      ok: false,
      reason: "missing-area",
    })
  })

  it("recusa número inválido", () => {
    expect(normalizePhone("123", "BR", "real")).toEqual({ ok: false, reason: "invalid" })
    expect(normalizePhone("", "BR", "real")).toEqual({ ok: false, reason: "invalid" })
  })

  it("aceita número de outro país pelo país escolhido", () => {
    expect(normalizePhone("912 345 678", "PT", "real")).toEqual({ ok: true, e164: "+351912345678" })
    expect(normalizePhone("+351 912 345 678", "BR", "real")).toEqual({
      ok: true,
      e164: "+351912345678",
    })
  })

  it("aceita os celulares fictícios (DDD 00) só em dev e demo", () => {
    expect(isAcceptedPhone("+5500900000001", "dev")).toBe(true)
    expect(isAcceptedPhone("+5500900000001", "demo")).toBe(true)
    expect(isAcceptedPhone("+5500900000001", "real")).toBe(false)
    expect(normalizePhone("(00) 90000-0001", "BR", "demo")).toEqual({
      ok: true,
      e164: "+5500900000001",
    })
    expect(normalizePhone("(00) 90000-0001", "BR", "real").ok).toBe(false)
  })

  it("formata para exibir", () => {
    expect(formatPhone("+5521987654321")).toBe("(21) 98765-4321")
    expect(formatPhone("+351912345678")).toBe("+351 912 345 678")
    expect(formatPhone("+5500900000001")).toBe("(00) 90000-0001")
  })
})
