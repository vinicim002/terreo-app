"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { applyToDocument } from "./apply"
import { usePreferences } from "./store"

/**
 * Reaplica tema, contraste, letra e idioma no <html> depois de montar e a cada troca de tela.
 * O script anti-piscar aplica antes da primeira pintura; se o React renderizar o layout raiz de novo
 * no navegador, os atributos se perderiam sem isto.
 */
export function PreferencesApplier() {
  const [prefs] = usePreferences()
  const pathname = usePathname()
  useEffect(() => {
    let dark = false
    try {
      dark = window.matchMedia("(prefers-color-scheme: dark)").matches
    } catch {}
    applyToDocument(prefs, dark)
  }, [prefs, pathname])
  return null
}
