"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useDataCounts, useInboundMessages, useResetSeed } from "@/hooks/data"
import { EXAMPLE_ACCOUNTS } from "@/services/local/seed"
import { getServices } from "@/services"
import { formatPhone } from "@/phone/phone"

const LABELS: Record<string, string> = {
  condominiums: "Condomínios",
  apartments: "Apartamentos",
  people: "Pessoas",
  residencies: "Moradores",
  staff: "Funcionários",
  managers: "Síndicos",
  shifts: "Turnos da escala",
  vehicles: "Carros",
  pets: "Animais",
  emergencyContacts: "Contatos de emergência",
  rules: "Regras",
  notices: "Avisos",
  noticeReads: "Leituras de avisos",
  polls: "Enquetes",
  pollVotes: "Votos",
  pollSuggestions: "Sugestões de voto",
  meetings: "Reuniões",
  agendaEvents: "Eventos da agenda",
  notifications: "Notificações",
  notificationPrefs: "Preferências de notificação",
  deliveries: "Entregas",
  visitors: "Visitantes",
  travelModes: "Modo viagem",
  memos: "Recados da portaria",
  lostItems: "Achados e perdidos",
  inboundMessages: "Mensagens recebidas",
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

const OUTBOX_LABEL = {
  otp: "Código",
  invite: "Convite",
  group: "Grupo",
  private: "Privado",
} as const

/**
 * Mensagens de WhatsApp simuladas enviadas neste navegador: códigos e convites (spec 002, RF-008), grupo do
 * condomínio e privado (spec 003, RF-027).
 */
export function OutboxPanel() {
  const { data } = useQuery({
    queryKey: ["dev", "outbox"],
    queryFn: () => getServices().outbox?.list() ?? Promise.resolve([]),
    refetchInterval: 3_000,
  })
  return (
    <div className="rounded-xl border border-border bg-card p-4" data-testid="outbox">
      <h2 className="font-semibold">WhatsApp simulado (últimas mensagens)</h2>
      {!data?.length && (
        <p className="text-sm text-muted-foreground">Nenhuma mensagem enviada ainda.</p>
      )}
      <ul className="mt-2 flex flex-col gap-2 text-sm">
        {data?.slice(0, 15).map((m) => (
          <li key={m.id} className="rounded-lg bg-muted p-2">
            <span className="font-semibold">{OUTBOX_LABEL[m.kind]}</span>{" "}
            {m.toPhone ? `para ${formatPhone(m.toPhone)}` : "do condomínio"} ·{" "}
            {new Date(m.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            <br />
            {m.body}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Simula uma mensagem recebida no WhatsApp do condomínio (spec 004, RF-002; "SOS" da spec 005): na Etapa 3, o
 * webhook do WhatsApp chama a mesma função no servidor.
 */
export function InboxSimulator() {
  const [phone, setPhone] = useState(EXAMPLE_ACCOUNTS[3]?.phone ?? "")
  const [text, setText] = useState("iFood 4821")
  const [result, setResult] = useState<string | null>(null)
  const client = useQueryClient()
  const { data } = useInboundMessages()
  if (!getServices().whatsappInbox) return null
  const send = async (message: string) => {
    const r = await getServices().whatsappInbox!.receive(phone, message)
    setResult(`${r.result}: ${r.reply}`)
    await client.invalidateQueries()
  }
  return (
    <div className="rounded-xl border border-border bg-card p-4" data-testid="inbox-simulator">
      <h2 className="font-semibold">Simular mensagem recebida no WhatsApp</h2>
      <form
        className="mt-2 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void send(text)
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Celular de quem manda
          <select
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="min-h-11 rounded-lg border border-input bg-card px-2 font-normal"
          >
            {EXAMPLE_ACCOUNTS.map((a) => (
              <option key={a.key} value={a.phone}>
                {a.name} ({a.key})
              </option>
            ))}
            <option value="+5500999999999">Número desconhecido</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Mensagem
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-11 rounded-lg border border-input bg-card px-2 font-normal"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary">
            Receber mensagem
          </button>
          {/* Spec 005, RF-007a: pedido de ajuda pelo WhatsApp. */}
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setText("SOS")
              void send("SOS")
            }}
          >
            Simular &quot;SOS&quot;
          </button>
        </div>
      </form>
      {result && (
        <p role="status" className="mt-2 text-sm">
          {result}
        </p>
      )}
      <ul className="mt-2 flex flex-col gap-1 text-sm">
        {data?.slice(0, 5).map((m) => (
          <li key={m.id} className="rounded-lg bg-muted p-2">
            {m.text} → <strong>{m.result}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
