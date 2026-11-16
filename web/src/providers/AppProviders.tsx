"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useSession } from "@/auth/session"
import { IntlProvider } from "@/i18n/IntlProvider"
import { PreferencesApplier } from "@/preferences/PreferencesApplier"
import { useTrackNavigation } from "@/navigation/history"

export function AppProviders({ children }: { children: ReactNode }) {
  useTrackNavigation()
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }),
  )
  // Dados de uma pessoa (ou de um papel) nunca aparecem para outra: limpa o cache ao trocar.
  const state = useSession()
  const who =
    state.status === "ready" && state.session
      ? `${state.session.person.id}:${JSON.stringify(state.session.activeRole)}`
      : "ninguém"
  const previous = useRef(who)
  useEffect(() => {
    // Só quando muda de fato: limpar na primeira montagem apagaria consultas que acabaram de começar.
    if (previous.current === who) return
    previous.current = who
    queryClient.clear()
  }, [who, queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      <IntlProvider>
        <PreferencesApplier />
        {children}
      </IntlProvider>
    </QueryClientProvider>
  )
}
