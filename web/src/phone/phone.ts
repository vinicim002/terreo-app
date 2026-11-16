// Celular por país (RF-001a, research R5). Tudo é guardado em E.164 (+5521987654321).
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min"
import { APP_MODE, type AppMode } from "@/config/app-mode"

export type { CountryCode }

export type PhoneResult =
  { ok: true; e164: string } | { ok: false; reason: "invalid" | "missing-area" }

/** Celulares fictícios dos dados de exemplo usam o DDD inexistente 00. */
const FICTIONAL = /^\+5500\d{9}$/

/** Número aceito: válido no país, ou fictício nos modos dev e demo. */
export function isAcceptedPhone(e164: string, mode: AppMode = APP_MODE): boolean {
  if (FICTIONAL.test(e164)) return mode !== "real"
  // Os metadados "min" validam só pelo comprimento; no Brasil, exige DDD + 8 ou 9 dígitos.
  if (e164.startsWith("+55") && !/^\+55[1-9]{2}\d{8,9}$/.test(e164)) return false
  return isValidPhoneNumber(e164)
}

export function normalizePhone(
  input: string,
  country: CountryCode = "BR",
  mode: AppMode = APP_MODE,
): PhoneResult {
  const digits = input.replace(/\D/g, "")
  if (!digits) return { ok: false, reason: "invalid" }
  // Fictícios (00) não passam pelo parser, que os considera impossíveis.
  if (country === "BR" && !input.trim().startsWith("+") && /^00\d{9}$/.test(digits)) {
    const e164 = `+55${digits}`
    return isAcceptedPhone(e164, mode) ? { ok: true, e164 } : { ok: false, reason: "invalid" }
  }
  if (input.trim().startsWith("+") && FICTIONAL.test(`+${digits}`)) {
    const e164 = `+${digits}`
    return isAcceptedPhone(e164, mode) ? { ok: true, e164 } : { ok: false, reason: "invalid" }
  }
  const parsed = parsePhoneNumberFromString(input, country)
  if (parsed && isAcceptedPhone(parsed.number, mode)) return { ok: true, e164: parsed.number }
  // No Brasil, 8 ou 9 dígitos é um número sem DDD.
  if (
    country === "BR" &&
    !input.trim().startsWith("+") &&
    (digits.length === 8 || digits.length === 9)
  ) {
    return { ok: false, reason: "missing-area" }
  }
  return { ok: false, reason: "invalid" }
}

/** Exibição: brasileiros no formato nacional; os demais com o código do país. */
export function formatPhone(e164: string): string {
  if (FICTIONAL.test(e164)) {
    const n = e164.slice(3)
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
  }
  const parsed = parsePhoneNumberFromString(e164)
  if (!parsed) return e164
  return parsed.country === "BR" ? parsed.formatNational() : parsed.formatInternational()
}

/** Países para o seletor, com o Brasil primeiro. */
export function countryOptions(locale: string) {
  const names = new Intl.DisplayNames([locale], { type: "region" })
  const all = getCountries()
    .map((code) => ({
      code,
      name: names.of(code) ?? code,
      dial: `+${getCountryCallingCode(code)}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale))
  const br = all.find((c) => c.code === "BR")!
  return [br, ...all.filter((c) => c.code !== "BR")]
}

/** País de um número já guardado (para editar). */
export function countryOf(e164: string): CountryCode {
  if (FICTIONAL.test(e164)) return "BR"
  return parsePhoneNumberFromString(e164)?.country ?? "BR"
}
