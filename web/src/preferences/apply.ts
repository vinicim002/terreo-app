import type { DevicePreferences } from "./types"

export function resolveTheme(theme: DevicePreferences["theme"], systemDark: boolean) {
  if (theme === "light" || theme === "dark") return theme
  return systemDark ? "dark" : "light"
}

/** Aplica tema, contraste, letra e idioma na raiz da página (os mesmos atributos do script anti-piscar). */
export function applyToDocument(prefs: DevicePreferences, systemDark: boolean) {
  const root = document.documentElement
  root.dataset.theme = resolveTheme(prefs.theme, systemDark)
  if (prefs.highContrast) root.dataset.contrast = "high"
  else delete root.dataset.contrast
  root.dataset.font = String(prefs.fontScale)
  root.lang = prefs.locale === "pt" ? "pt-BR" : prefs.locale
}
