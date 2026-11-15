import { beforeEach, describe, expect, it } from "vitest"
import {
  DEFAULT_PREFERENCES,
  PREFS_KEY,
  detectLocale,
  readPreferences,
  writePreferences,
} from "@/preferences/storage"

describe("preferências do aparelho", () => {
  beforeEach(() => localStorage.clear())

  it("usa os padrões quando não há nada gravado", () => {
    const prefs = readPreferences(localStorage, "pt-BR")
    expect(prefs).toEqual({ ...DEFAULT_PREFERENCES, locale: "pt" })
    expect(DEFAULT_PREFERENCES).toMatchObject({
      profile: null,
      theme: "system",
      highContrast: false,
      fontScale: 0,
    })
  })

  it.each([
    ["en-US", "en"],
    ["en", "en"],
    ["es-AR", "es"],
    ["es", "es"],
    ["pt-BR", "pt"],
    ["fr-FR", "pt"],
    ["", "pt"],
  ])("idioma inicial para %s é %s", (lang, esperado) => {
    expect(detectLocale(lang)).toBe(esperado)
  })

  it("grava e lê de volta", () => {
    writePreferences(localStorage, {
      profile: "manager",
      locale: "es",
      theme: "dark",
      highContrast: true,
      fontScale: 3,
    })
    expect(readPreferences(localStorage, "pt-BR")).toEqual({
      profile: "manager",
      locale: "es",
      theme: "dark",
      highContrast: true,
      fontScale: 3,
    })
  })

  it("tolera JSON inválido e valores desconhecidos campo a campo", () => {
    localStorage.setItem(PREFS_KEY, "{isto não é json")
    expect(readPreferences(localStorage, "en-US")).toEqual({ ...DEFAULT_PREFERENCES, locale: "en" })

    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ profile: "admin", locale: "fr", theme: "dark", fontScale: 9 }),
    )
    expect(readPreferences(localStorage, "pt-BR")).toEqual({
      ...DEFAULT_PREFERENCES,
      locale: "pt",
      theme: "dark",
    })
  })

  it("funciona sem localStorage disponível", () => {
    const quebrado = {
      getItem: () => {
        throw new Error("SecurityError")
      },
      setItem: () => {
        throw new Error("QuotaExceededError")
      },
    } as unknown as Storage
    expect(readPreferences(quebrado, "es")).toEqual({ ...DEFAULT_PREFERENCES, locale: "es" })
    expect(() => writePreferences(quebrado, DEFAULT_PREFERENCES)).not.toThrow()
    expect(readPreferences(null, "pt")).toEqual({ ...DEFAULT_PREFERENCES, locale: "pt" })
  })
})
