# Contrato: serviços (acréscimos da spec 005)

Mesmas regras das specs anteriores (`authorize` com `contracts/permissoes.md`, erros tipados, `runDue` nas leituras).

```ts
type EmergencyKind = "health" | "fire" | "intrusion" | "leak" | "other" | "unknown"

interface EmergencyView {
  id: string; apartment: string; floor: number; kind: EmergencyKind; origin: "app" | "whatsapp"
  createdBy: string; createdAt: string
  status: "open" | "acknowledged" | "resolved" | "cancelled"
  acknowledgedBy: string | null; acknowledgedAt: string | null
  resolvedAt: string | null; resolutionNote: string | null; cancelledAt: string | null
  repeated: boolean
  emergencyContact: { name: string; relationship: string; phone: string } | null   // só para portaria e síndico
  noDoormanOnDuty: boolean
  canCancel: boolean
}

interface EmergencyService {
  raise(ctx, kind: EmergencyKind): Promise<EmergencyView>          // morador; se já há um em aberto, devolve ele
  mine(ctx): Promise<{ current: EmergencyView | null; history: EmergencyView[] }>
  cancel(ctx, id: string): Promise<EmergencyView>
  // Portaria e síndico
  open(ctx): Promise<EmergencyView[]>                              // em aberto e atendidos (não resolvidos)
  acknowledge(ctx, id: string): Promise<EmergencyView>             // portaria; o primeiro vale
  resolve(ctx, id: string, note: string | null): Promise<EmergencyView>
  history(ctx): Promise<EmergencyView[]>                           // 90 dias
}

type GeneralAlertKind = "fire" | "gas" | "power" | "security" | "other"

interface GeneralAlertView {
  id: string; kind: GeneralAlertKind; message: string; createdBy: string; createdAt: string
  status: "open" | "closed"; closedAt: string | null; closingMessage: string | null
  seenByMe: boolean; canClose: boolean
}

interface GeneralAlertService {
  current(ctx): Promise<GeneralAlertView | null>                   // todos
  send(ctx, input: { kind: GeneralAlertKind; message: string }): Promise<GeneralAlertView>   // portaria, síndico
  close(ctx, id: string, message: string | null): Promise<GeneralAlertView>
  markSeen(ctx, id: string): Promise<void>
  history(ctx): Promise<GeneralAlertView[]>
}

interface ContactView {
  id: string | null                 // null nos que vêm do cadastro
  group: "building" | "emergency"; name: string; description: string | null
  phone: string | null; isMobile: boolean; frontDesk: boolean; fromRegistry: boolean
}

interface ContactService {
  list(ctx, search?: string): Promise<{ building: ContactView[]; emergency: ContactView[] }>
  save(ctx, input: { id?: string; group: "building" | "emergency"; name: string; description: string | null; phone: string; frontDesk?: boolean }): Promise<ContactView>
  remove(ctx, id: string): Promise<void>
  reorder(ctx, group: "building" | "emergency", ids: string[]): Promise<void>
  setShowMyPhone(ctx, show: boolean): Promise<void>                 // síndico ou porteiro-chefe
}
```

## Regras comuns

- `raise` e `send` passam por `notify` com os tipos novos (research R3); o contato de emergência recebe mensagem direta
  na caixa de saída.
- `whatsappInbox.receive` (spec 004) trata "SOS"/"socorro" antes dos códigos (research R6).
- Números: `normalizeDialable(text)` aceita serviços públicos (190–199, 3 a 4 dígitos), 0800 e telefones brasileiros;
  devolve o número para `tel:` e se é celular.
