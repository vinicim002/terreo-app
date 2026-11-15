"use client"

import { NextIntlClientProvider, IntlErrorCode, type AbstractIntlMessages } from "next-intl"
import type { ReactNode } from "react"
import en from "../../messages/en.json"
import es from "../../messages/es.json"
import pt from "../../messages/pt.json"
import { usePreferences } from "@/preferences/store"
import type { Locale } from "@/preferences/types"
import { TIME_ZONE } from "./datetime"

// research R2: os três idiomas vão no pacote, sem idioma no endereço; a troca é imediata.
const MESSAGES: Record<Locale, AbstractIntlMessages> = { pt, en, es }

/** Busca um texto em português pelo caminho "namespace.chave" (fallback de RF-011). */
function portuguese(path: string): string | undefined {
  let node: unknown = pt
  for (const part of path.split(".")) {
    if (node && typeof node === "object" && part in node)
      node = (node as Record<string, unknown>)[part]
    else return undefined
  }
  return typeof node === "string" ? node : undefined
}

export function IntlProvider({ children }: { children: ReactNode }) {
  const [{ locale }] = usePreferences()
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone={TIME_ZONE}
      onError={(error) => {
        if (error.code !== IntlErrorCode.MISSING_MESSAGE) console.error(error)
      }}
      getMessageFallback={({ namespace, key }) => {
        const path = namespace ? `${namespace}.${key}` : key
        // Nunca mostra a chave interna: cai para o português ou para um texto neutro.
        return portuguese(path) ?? "—"
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
