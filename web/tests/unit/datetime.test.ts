import { describe, expect, it } from "vitest"
import { formatDateTime } from "@/i18n/datetime"

// RF-013: datas sempre no fuso de Brasília, no formato do idioma escolhido.
const instante = new Date("2026-11-15T02:30:00Z") // 23:30 do dia 14 em Brasília

describe("formatação de datas", () => {
  it("mostra no fuso de Brasília em português", () => {
    expect(formatDateTime(instante, "pt")).toBe("14/11/2026 23:30")
  })

  it("usa o formato de cada idioma, sempre no fuso de Brasília", () => {
    expect(formatDateTime(instante, "en")).toBe("11/14/2026 11:30 PM")
    expect(formatDateTime(instante, "es")).toBe("14/11/2026 23:30")
  })
})
