"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useDataCounts, useResetSeed } from "@/hooks/data"

const LABELS: Record<string, string> = {
  condominiums: "Condomínios",
  apartments: "Apartamentos",
  residents: "Moradores",
  staff: "Funcionários",
  shifts: "Turnos da escala",
}

/** Situação da API (GET /api/health) — RF-002, RF-032. */
export function ApiStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ["dev", "health"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" })
        return (await res.json()) as { status: string; checks: Record<string, string> }
      } catch {
        return { status: "down", checks: {} }
      }
    },
    refetchInterval: 10_000,
  })
  const ok = data?.status === "ok"
  return (
    <div className="rounded-xl border border-border bg-card p-4" data-testid="api-status">
      <h2 className="font-semibold">Situação da API</h2>
      {isLoading ? (
        <p className="text-muted-foreground">Verificando…</p>
      ) : (
        <p className={ok ? "text-link" : "text-destructive"}>
          {ok ? "No ar" : data?.status === "degraded" ? "Com problemas" : "Fora do ar"}
          {data?.checks &&
            Object.entries(data.checks).map(([k, v]) => (
              <span key={k} className="ml-2 text-sm text-muted-foreground">
                {k}: {v}
              </span>
            ))}
        </p>
      )}
    </div>
  )
}

/** Contagem dos dados locais e restauração dos dados de exemplo, com confirmação — RF-027. */
export function SeedTools() {
  const counts = useDataCounts()
  const reset = useResetSeed()
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="rounded-xl border border-border bg-card p-4" data-testid="seed-tools">
      <h2 className="font-semibold">Dados de exemplo (neste navegador)</h2>
      <ul className="my-2 grid grid-cols-2 gap-1 text-sm">
        {Object.entries(counts.data ?? {}).map(([k, v]) => (
          <li key={k}>
            {LABELS[k] ?? k}: <strong>{v}</strong>
          </li>
        ))}
      </ul>
      {confirming ? (
        <div className="flex flex-wrap gap-2">
          <span className="w-full text-sm">
            Apagar os dados locais e recriar os dados de exemplo?
          </span>
          <button
            type="button"
            className="btn-primary"
            onClick={() => reset.mutate(undefined, { onSettled: () => setConfirming(false) })}
          >
            Confirmar
          </button>
          <button type="button" className="btn-outline" onClick={() => setConfirming(false)}>
            Cancelar
          </button>
        </div>
      ) : (
        <button type="button" className="btn-outline" onClick={() => setConfirming(true)}>
          Restaurar dados de exemplo
        </button>
      )}
      {reset.isSuccess && !confirming && (
        <p role="status" className="mt-2 text-sm">
          Dados de exemplo restaurados.
        </p>
      )}
    </div>
  )
}
