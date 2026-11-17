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

// ---------- Spec 003: dias e meses no fuso de Brasília (research R5) ----------
// Brasília não tem horário de verão desde 2019: o deslocamento é sempre −03:00.
const OFFSET_MS = 3 * 60 * 60 * 1000

/** Partes da data no fuso de Brasília. */
function brParts(iso: string | Date) {
  const shifted = new Date(new Date(iso).getTime() - OFFSET_MS)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  }
}

/** Início do dia (00:00 em Brasília) que contém a data, em UTC. */
export function startOfDayBrasilia(iso: string | Date): Date {
  const { year, month, day } = brParts(iso)
  return new Date(Date.UTC(year, month - 1, day) + OFFSET_MS)
}

/** Data em Brasília como `AAAA-MM-DD`. */
export function dayKeyBrasilia(iso: string | Date): string {
  const { year, month, day } = brParts(iso)
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** Meia-noite em Brasília de um `AAAA-MM-DD`, em UTC. */
export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d) + OFFSET_MS)
}

/** Data e hora locais de Brasília (`AAAA-MM-DD` e `HH:mm`) → ISO em UTC. */
export function brasiliaToIso(day: string, time: string): string {
  const [h, min] = time.split(":").map(Number)
  return new Date(fromDayKey(day).getTime() + (h * 60 + min) * 60_000).toISOString()
}

/** Hora `HH:mm` em Brasília. */
export function timeBrasilia(iso: string | Date): string {
  const d = new Date(new Date(iso).getTime() - OFFSET_MS)
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}

/**
 * Semanas do mês (domingo a sábado) com as chaves `AAAA-MM-DD`; dias de fora do mês são null.
 * `month` vai de 1 a 12.
 */
export function monthGridBrasilia(year: number, month: number): (string | null)[][] {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: (string | null)[] = Array(first).fill(null)
  for (let d = 1; d <= days; d++)
    cells.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`)
  while (cells.length % 7) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export type Recurrence = "none" | "weekly" | "monthly" | "semiannual" | "yearly"

/**
 * N-ésima ocorrência de uma data que se repete, mantendo a hora de Brasília.
 * Dia inexistente no mês (31 em mês de 30) cai no último dia do mês.
 */
export function addRecurrence(iso: string, recurrence: Recurrence, n: number): string {
  if (recurrence === "none" || n === 0) return new Date(iso).toISOString()
  const base = new Date(iso)
  if (recurrence === "weekly") return new Date(base.getTime() + n * 7 * 86_400_000).toISOString()
  const months = recurrence === "monthly" ? n : recurrence === "semiannual" ? 6 * n : 12 * n
  const { year, month, day } = brParts(base)
  const timeMs = base.getTime() - startOfDayBrasilia(base).getTime()
  const total = month - 1 + months
  const y = year + Math.floor(total / 12)
  const m = (total % 12) + 1
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const key = `${y}-${String(m).padStart(2, "0")}-${String(Math.min(day, last)).padStart(2, "0")}`
  return new Date(fromDayKey(key).getTime() + timeMs).toISOString()
}

/** Grupo da central de notificações: hoje, ontem ou antes (em Brasília). */
export function relativeDayGroup(iso: string, now: Date): "today" | "yesterday" | "earlier" {
  const today = startOfDayBrasilia(now).getTime()
  const t = new Date(iso).getTime()
  if (t >= today) return "today"
  if (t >= today - 86_400_000) return "yesterday"
  return "earlier"
}

/** Data longa no idioma, no fuso de Brasília (ex.: "quinta-feira, 19 de novembro"). */
export function formatLongDate(iso: string | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso))
}

/** Data curta com hora (ex.: "19/11, 14:30"). */
export function formatShortDateTime(iso: string | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

/** Nome do mês e ano (ex.: "novembro de 2026"). */
export function formatMonthYear(year: number, month: number, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 15)))
}

export function intlLocale(locale: Locale) {
  return INTL_LOCALE[locale]
}
