# Contrato: serviços (acréscimos da spec 003)

Mesmas regras das specs 001 e 002: assíncronos, Zod, `ServiceContext` com `actor` obrigatório, `authorize` com a
matriz (`contracts/permissoes.md`), erros `not_found | forbidden | validation | unavailable | rate_limited`. Toda
leitura abaixo chama `runDue` antes (research R1).

```ts
type NoticeKind = "water" | "elevator" | "power" | "meeting" | "general"

interface NoticeInput {
  kind: NoticeKind; title: string; body: string; important: boolean
  sendToGroup: boolean; requireConfirmation: boolean
  referenceDate: string | null; remindDayBefore: boolean
  publishAt: string | null            // null = agora
}

interface NoticeView {
  id: string; kind: NoticeKind; title: string; body: string; important: boolean
  sendToGroup: boolean; requireConfirmation: boolean; referenceDate: string | null
  status: "scheduled" | "published" | "resolved"
  publishAt: string; publishedAt: string | null; editedAt: string | null
  resolvedAt: string | null; resolutionNote: string | null
  author: { name: string }
  me: { read: boolean; confirmed: boolean }      // da versão atual
}

interface NoticeStats {                          // só síndico
  readApartments: number; totalApartments: number
  confirmations: { personName: string; apartment: string; at: string }[]
  pendingApartments: string[]                    // números sem confirmação (avisos com confirmação)
}

interface NoticeService {
  list(ctx, filter: "all" | "unread" | "scheduled"): Promise<{ items: NoticeView[]; unread: number }>
  get(ctx, id: string): Promise<NoticeView>      // marca como lido (RF-006)
  confirm(ctx, id: string): Promise<NoticeView>  // forbidden para a portaria
  create(ctx, input: NoticeInput): Promise<NoticeView>                // síndico
  update(ctx, id: string, input: NoticeInput): Promise<NoticeView>    // síndico; publicado → versão +1 (RF-007a)
  resolve(ctx, id: string, note: string | null): Promise<NoticeView>  // síndico
  remove(ctx, id: string): Promise<void>                              // síndico
  stats(ctx, id: string): Promise<NoticeStats>                        // síndico
}

interface PollView {
  id: string; question: string; official: boolean; showPartial: boolean
  options: { id: string; label: string; votes: number | null; percent: number | null }[] // null se oculto
  totalVotes: number | null
  status: "open" | "closed"; closesAt: string; closedAt: string | null
  winner: { optionIds: string[]; tie: boolean } | null   // só encerrada
  me: {
    canVote: boolean; canSuggest: boolean
    vote: { optionId: string; byName: string } | null       // oficial: voto do apartamento
    suggestion: string | null                                // optionId sugerido por mim
    householdSuggestions: { personName: string; optionId: string }[] // só para o responsável
  }
}

interface PollService {
  list(ctx): Promise<{ open: PollView[]; closed: PollView[] }>   // forbidden para a portaria
  get(ctx, id: string): Promise<PollView>
  vote(ctx, id: string, optionId: string): Promise<PollView>     // RF-011, RF-012, RF-013
  suggest(ctx, id: string, optionId: string): Promise<PollView>  // oficiais, não responsável com permissão
  create(ctx, input: { question: string; options: string[]; closesAt: string; official: boolean; showPartial: boolean }): Promise<PollView>
  close(ctx, id: string): Promise<PollView>                      // síndico
}

interface MeetingView {
  id: string; startsAt: string; place: string; agenda: string[]
  summary: string | null; summaryAt: string | null; status: "upcoming" | "past" | "cancelled"
}

interface MeetingService {
  list(ctx): Promise<{ upcoming: MeetingView[]; past: MeetingView[] }>
  get(ctx, id: string): Promise<MeetingView>
  create(ctx, input: { startsAt: string; place: string; agenda: string[] }): Promise<MeetingView>  // síndico
  update(ctx, id: string, input: { startsAt: string; place: string; agenda: string[] }): Promise<MeetingView>
  setSummary(ctx, id: string, summary: string): Promise<MeetingView>  // validation se ainda não aconteceu
  cancel(ctx, id: string): Promise<void>
}

type AgendaItem = {
  date: string                        // ocorrência (UTC)
  kind: "meeting" | "maintenance" | "routine" | "notice"
  title: string; recurrence: "none" | "weekly" | "monthly" | "semiannual" | "yearly"
  target: { kind: "meeting" | "notice" | "event"; id: string }
}

interface AgendaService {
  month(ctx, year: number, month: number): Promise<{ days: Record<string, AgendaItem[]> }>  // chave AAAA-MM-DD (Brasília)
  upcoming(ctx, limit?: number): Promise<AgendaItem[]>          // padrão 10
  createEvent(ctx, input: { title: string; kind: "maintenance" | "routine"; startsAt: string; durationMinutes: number | null; recurrence: AgendaItem["recurrence"] }): Promise<AgendaItem>
  cancelEvent(ctx, id: string): Promise<void>
}

interface NotificationView {
  id: string; type: string; title: string; body: string
  target: { kind: "notice" | "poll" | "meeting"; id: string } | null
  createdAt: string; read: boolean
}

interface NotificationService {
  list(ctx): Promise<NotificationView[]>        // mais nova primeiro
  unreadCount(ctx): Promise<number>
  markRead(ctx, id: string): Promise<void>
  markAllRead(ctx): Promise<void>
  getPrefs(ctx): Promise<NotificationPrefs>
  setPrefs(ctx, prefs: NotificationPrefs): Promise<NotificationPrefs>   // emergency não existe nas prefs
}
```

## Regras comuns

- `notify` (interno, research R2) é o único caminho para criar `Notification` e mensagens `group`/`private`.
- Assuntos gerais nunca geram mensagem `private` (RF-026); `group` sai uma vez por envio.
- A portaria só recebe notificações de avisos; não recebe de enquetes nem reuniões.
- Datas recebidas em ISO 8601; o serviço recusa `publishAt` no passado na criação (`validation`, `details.publishAt =
  "past"`) — a tela oferece publicar agora (caso-limite).
