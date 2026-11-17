import { describe, expect, it } from "vitest"
import {
  addRecurrence,
  brasiliaToIso,
  dayKeyBrasilia,
  formatDateTime,
  monthGridBrasilia,
  relativeDayGroup,
  startOfDayBrasilia,
  timeBrasilia,
} from "@/i18n/datetime"

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

describe("dias e meses em Brasília (spec 003, research R5)", () => {
  it("usa o dia de Brasília, não o de UTC", () => {
    expect(dayKeyBrasilia(instante)).toBe("2026-11-14")
    expect(startOfDayBrasilia(instante).toISOString()).toBe("2026-11-14T03:00:00.000Z")
    expect(timeBrasilia(instante)).toBe("23:30")
    expect(brasiliaToIso("2026-11-19", "08:00")).toBe("2026-11-19T11:00:00.000Z")
  })

  it("monta o mês em semanas de domingo a sábado", () => {
    const grid = monthGridBrasilia(2026, 11) // 1º de novembro de 2026 é domingo
    expect(grid[0][0]).toBe("2026-11-01")
    expect(grid.every((w) => w.length === 7)).toBe(true)
    expect(grid.flat().filter(Boolean)).toHaveLength(30)
    const fev = monthGridBrasilia(2027, 2) // 1º de fevereiro de 2027 é segunda
    expect(fev[0][0]).toBeNull()
    expect(fev[0][1]).toBe("2027-02-01")
  })

  it("repete por semana, mês, semestre e ano mantendo a hora", () => {
    const base = brasiliaToIso("2026-11-17", "07:00")
    expect(dayKeyBrasilia(addRecurrence(base, "weekly", 2))).toBe("2026-12-01")
    expect(dayKeyBrasilia(addRecurrence(base, "monthly", 3))).toBe("2027-02-17")
    expect(dayKeyBrasilia(addRecurrence(base, "semiannual", 1))).toBe("2027-05-17")
    expect(dayKeyBrasilia(addRecurrence(base, "yearly", 1))).toBe("2027-11-17")
    expect(timeBrasilia(addRecurrence(base, "monthly", 3))).toBe("07:00")
  })

  it("dia 31 em mês de 30 cai no último dia (caso-limite)", () => {
    const base = brasiliaToIso("2026-10-31", "09:00")
    expect(dayKeyBrasilia(addRecurrence(base, "monthly", 1))).toBe("2026-11-30")
    expect(dayKeyBrasilia(addRecurrence(base, "monthly", 4))).toBe("2027-02-28")
  })

  it("agrupa em hoje, ontem e antes", () => {
    const agora = new Date("2026-11-17T15:00:00Z")
    expect(relativeDayGroup("2026-11-17T03:30:00Z", agora)).toBe("today")
    expect(relativeDayGroup("2026-11-17T02:30:00Z", agora)).toBe("yesterday")
    expect(relativeDayGroup("2026-11-15T20:00:00Z", agora)).toBe("earlier")
  })
})
