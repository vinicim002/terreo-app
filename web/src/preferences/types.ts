export const PROFILES = ["resident", "front-desk", "manager"] as const
export type Profile = (typeof PROFILES)[number]

export const LOCALES = ["pt", "en", "es"] as const
export type Locale = (typeof LOCALES)[number]

export const THEMES = ["light", "dark", "system"] as const
export type Theme = (typeof THEMES)[number]

export const FONT_SCALES = [0, 1, 2, 3] as const
export type FontScale = (typeof FONT_SCALES)[number]

/** Preferências guardadas só no aparelho (data-model.md → DevicePreferences). */
export interface DevicePreferences {
  profile: Profile | null
  locale: Locale
  theme: Theme
  highContrast: boolean
  fontScale: FontScale
}

export const PREFS_KEY = "terreo:prefs"
