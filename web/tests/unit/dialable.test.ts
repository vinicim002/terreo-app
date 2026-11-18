import { describe, expect, it } from "vitest"
import {
  displayPhone,
  isBrazilianMobile,
  normalizeDialable,
  telLink,
  whatsappLink,
} from "@/services/dialable"

// research R7 da spec 005: números discáveis dos contatos.
describe("normalizeDialable", () => {
  it("aceita serviços públicos de 3 dígitos", () => {
    for (const n of ["190", "192", "193", "199"])
      expect(normalizeDialable(n)).toEqual({ tel: n, display: n, isMobile: false })
  })

  it("aceita 0800 com ou sem espaços", () => {
    expect(normalizeDialable("0800 021 0196")).toEqual({
      tel: "08000210196",
      display: "0800 021 0196",
      isMobile: false,
    })
    expect(normalizeDialable("08000240197")?.tel).toBe("08000240197")
  })

  it("aceita celulares e fixos brasileiros em vários formatos", () => {
    expect(normalizeDialable("(21) 98765-4321")).toEqual({
      tel: "+5521987654321",
      display: "(21) 98765-4321",
      isMobile: true,
    })
    expect(normalizeDialable("+55 21 98765-4321")?.tel).toBe("+5521987654321")
    expect(normalizeDialable("5521987654321")?.tel).toBe("+5521987654321")
    expect(normalizeDialable("021 3333-1000")).toEqual({
      tel: "+552133331000",
      display: "(21) 3333-1000",
      isMobile: false,
    })
  })

  it("recusa números que não dá para discar", () => {
    for (const n of [
      "",
      "12",
      "1234",
      "abc",
      "(00) 98765-4321",
      "(21) 8765-43210",
      "+1 202 555 0100",
      "21 1234-5678",
    ])
      expect(normalizeDialable(n)).toBeNull()
  })
})

describe("exibição e links", () => {
  it("formata e monta os links", () => {
    expect(displayPhone("+5500900009001")).toBe("(00) 90000-9001")
    expect(isBrazilianMobile("+5521987654321")).toBe(true)
    expect(isBrazilianMobile("+552133331000")).toBe(false)
    expect(telLink("192")).toBe("tel:192")
    expect(whatsappLink("+5521987654321")).toBe("https://wa.me/5521987654321")
  })
})
