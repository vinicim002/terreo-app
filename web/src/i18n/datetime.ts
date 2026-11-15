import type { Locale } from "@/preferences/types"

export const TIME_ZONE = "America/Sao_Paulo"

const INTL_LOCALE: Record<Locale, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" }

/** Data e hora no fuso de Brasília, no formato do idioma (RF-013). */
export function formatDateTime(date: Date, locale: Locale): string {
  const parts = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(",", "")
    .replace(/ /g, " ")
  return parts
}
