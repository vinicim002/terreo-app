"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useSession } from "@/auth/session"
import { IntlProvider } from "@/i18n/IntlProvider"
import { PreferencesApplier } from "@/preferences/PreferencesApplier"
import { useTrackNavigation } from "@/navigation/history"

export function AppProviders({ children }: { children: ReactNode }) {
  useTrackNavigation()
  // Bandeiras no Windows, que não desenha bandeiras com emoji: carrega a fonte do próprio app (sem site externo),
  // só onde faltam. Nos outros aparelhos não faz nada.
  useEffect(() => {
    polyfillCountryFlagEmojis("Twemoji Country Flags", "/fonts/TwemojiCountryFlags.woff2")
  }, [])
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
    // Só quando muda de fato. Não usar clear(): ele apagaria as consultas que as telas acabaram de começar (na
    // versão compilada a sessão fica pronta depois de as telas montarem) e elas ficariam sem resposta. O reset tira os
    // dados da pessoa anterior e busca de novo os das telas abertas; as consultas paradas são removidas.
    if (previous.current === who) return
    previous.current = who
    queryClient.removeQueries({ type: "inactive" })
    void queryClient.resetQueries()
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
