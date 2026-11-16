import { describe, expect, it } from "vitest"
import { formatPlate, isValidPlate, normalizePlate } from "@/domain/plate"

// research R6 e data-model.md (Vehicle.plate).
describe("placa", () => {
  it.each([
    ["ABC-1234", "ABC1234"],
    ["abc1234", "ABC1234"],
    ["ABC1D23", "ABC1D23"],
    [" abc 1d23 ", "ABC1D23"],
  ])("%s é guardada como %s (maiúsculas sem hífen)", (entrada, guardada) => {
    expect(normalizePlate(entrada)).toBe(guardada)
    expect(isValidPlate(normalizePlate(entrada))).toBe(true)
  })

  it.each(["AB1234", "ABCD123", "ABC12345", "1BC1234", ""])("recusa %s", (entrada) => {
    expect(isValidPlate(normalizePlate(entrada))).toBe(false)
  })

  it("exibe com hífen no formato antigo e sem hífen no Mercosul", () => {
    expect(formatPlate("ABC1234")).toBe("ABC-1234")
    expect(formatPlate("ABC1D23")).toBe("ABC1D23")
  })
})
