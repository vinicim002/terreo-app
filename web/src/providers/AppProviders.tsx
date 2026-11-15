"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { IntlProvider } from "@/i18n/IntlProvider"
import { useTrackNavigation } from "@/navigation/history"

export function AppProviders({ children }: { children: ReactNode }) {
  useTrackNavigation()
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      <IntlProvider>{children}</IntlProvider>
    </QueryClientProvider>
  )
}
