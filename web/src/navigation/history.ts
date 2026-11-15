"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

// Conta as navegações feitas dentro do app nesta aba. O histórico do navegador não serve:
// uma tela aberta direto pelo endereço tem a página anterior (de fora do app) no histórico.
// Conta caminhos distintos (e não execuções do efeito: no modo estrito do React elas se repetem).
let inAppNavigations = 0
let lastPath: string | null = null

export function useTrackNavigation() {
  const pathname = usePathname()
  useEffect(() => {
    if (pathname === lastPath) return
    lastPath = pathname
    inAppNavigations += 1
  }, [pathname])
}

/** true se há uma tela anterior do próprio app para voltar. */
export function canGoBackInApp() {
  return inAppNavigations > 1
}
