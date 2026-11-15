import {
  FONT_SCALES,
  LOCALES,
  PROFILES,
  THEMES,
  type DevicePreferences,
  type Locale,
  PREFS_KEY,
} from "./types"

export { PREFS_KEY }

export const DEFAULT_PREFERENCES: DevicePreferences = {
  profile: null,
  locale: "pt",
  theme: "system",
  highContrast: false,
  fontScale: 0,
}

/** Idioma inicial: inglês ou espanhol se o celular estiver nesses idiomas; senão, português. */
export function detectLocale(language: string | undefined | null): Locale {
  const lang = (language ?? "").toLowerCase()
  if (lang.startsWith("en")) return "en"
  if (lang.startsWith("es")) return "es"
  return "pt"
}

function pick<T>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

/** Lê as preferências, aceitando cada campo só se for válido. Nunca lança erro. */
export function readPreferences(
  storage: Pick<Storage, "getItem"> | null,
  language: string | undefined | null,
): DevicePreferences {
  const base = { ...DEFAULT_PREFERENCES, locale: detectLocale(language) }
  let raw: Record<string, unknown> = {}
  try {
    const text = storage?.getItem(PREFS_KEY)
    const parsed: unknown = text ? JSON.parse(text) : {}
    if (parsed && typeof parsed === "object") raw = parsed as Record<string, unknown>
  } catch {
    return base
  }
  return {
    profile: pick<DevicePreferences["profile"]>(PROFILES, raw.profile, null),
    locale: pick(LOCALES, raw.locale, base.locale),
    theme: pick(THEMES, raw.theme, base.theme),
    highContrast: raw.highContrast === true,
    fontScale: pick(FONT_SCALES, raw.fontScale, base.fontScale),
  }
}

/** Grava as preferências. Devolve false se o armazenamento não estiver disponível. */
export function writePreferences(
  storage: Pick<Storage, "setItem"> | null,
  prefs: DevicePreferences,
): boolean {
  try {
    if (!storage) return false
    storage.setItem(PREFS_KEY, JSON.stringify(prefs))
    return true
  } catch {
    return false
  }
}

/** Confere se o localStorage pode ser usado (modo anônimo e cota cheia podem bloquear). */
export function isStorageAvailable(): boolean {
  try {
    const key = `${PREFS_KEY}:probe`
    window.localStorage.setItem(key, "1")
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}
