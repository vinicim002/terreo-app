# Contrato: serviços (acréscimos da spec 004)

Mesmas regras das specs anteriores: assíncronos, Zod, `ServiceContext` com `actor`, `authorize` com a matriz
(`contracts/permissoes.md`), erros `not_found | forbidden | validation | unavailable | rate_limited`. As leituras chamam
`runDue` (research R2).

```ts
type Store = "ifood" | "mercado-livre" | "shopee" | "amazon" | "correios" | "other"
type OnArrival = "elevator" | "front-desk" | "call"
type DeliveryStatus = "awaiting" | "at-desk" | "delivered" | "picked-up" | "not-arrived"

interface DeliveryView {
  id: string; apartment: string; origin: "app" | "whatsapp" | "front-desk" | "mail"
  store: Store | null; storeName: string | null; code: string | null; note: string | null
  onArrival: OnArrival | null; size: "envelope" | "small" | "medium" | "large" | null
  photo: string | null; status: DeliveryStatus
  createdAt: string; createdBy: string                  // nome
  arrivedAt: string | null; receivedBy: string | null   // nome do porteiro
  pickedUpAt: string | null; pickedUpBy: string | null
  daysAtDesk: number | null
}

interface DeliveryService {
  /** Morador: do próprio apartamento, em grupos. */
  mine(ctx): Promise<{ awaiting: DeliveryView[]; atDesk: DeliveryView[]; done: DeliveryView[] }>
  registerCode(ctx, input: { store: Store; storeName?: string; code: string; note?: string; onArrival: OnArrival; confirmDuplicate?: boolean }): Promise<DeliveryView>
      // duplicado (mesma loja e apto, aguardando, no mesmo dia) sem confirmDuplicate → validation details.code = "duplicate"
  cancelCode(ctx, id: string): Promise<void>
  pickUp(ctx, id: string): Promise<DeliveryView>                       // morador do apto
  // Portaria
  byApartment(ctx, apartmentNumber: string): Promise<DeliveryView[]>    // aguardando e na portaria
  markArrived(ctx, id: string): Promise<DeliveryView>
  receive(ctx, input: { apartmentNumber: string; size: "envelope" | "small" | "medium" | "large"; store: Store; storeName?: string; photo: string | null; notifyResident: boolean }): Promise<DeliveryView>
  mail(ctx, apartmentNumber: string): Promise<DeliveryView>
  registerPickup(ctx, id: string, personId: string): Promise<DeliveryView>   // pessoa ativa do apto
}

interface VisitorView {
  id: string; apartment: string; kind: "visit" | "provider"; name: string; day: string
  fromTime: string; toTime: string; people: number
  status: "expected" | "arrived" | "no-show" | "cancelled"; walkIn: boolean
  createdBy: string; arrivedAt: string | null; releasedBy: string | null
  canCancel: boolean
}

interface VisitorService {
  mine(ctx): Promise<{ expected: VisitorView[]; history: VisitorView[] }>
  register(ctx, input: { kind: "visit" | "provider"; name: string; day: string; fromTime: string; toTime: string; people: number }): Promise<VisitorView>
  cancel(ctx, id: string): Promise<void>
  // Portaria
  today(ctx): Promise<{ expected: VisitorView[]; arrived: VisitorView[] }>
  checkIn(ctx, id: string): Promise<VisitorView>
  walkIn(ctx, input: { apartmentNumber: string; name: string }): Promise<VisitorView>
}

interface TravelView { from: string; to: string; createdBy: string }

interface TravelService {
  mine(ctx): Promise<TravelView | null>
  start(ctx, input: { from: string; to: string }): Promise<TravelView>
  end(ctx): Promise<void>
}

interface DeskApartment {
  number: string; floor: number
  awaiting: number; atDesk: number; travelUntil: string | null
}

interface FrontDeskService {
  /** Números do dia e grade de apartamentos (portaria). */
  overview(ctx): Promise<{ awaiting: number; atDesk: number; expectedVisitors: number; apartments: DeskApartment[] }>
  /** Painel de um apartamento: moradores (como a consulta da spec 002), entregas, viagem. */
  apartment(ctx, number: string): Promise<{
    number: string; people: { personId: string; name: string; photo: string | null; kind: string }[]
    deliveries: DeliveryView[]; travelUntil: string | null
  }>
}

interface MemoView { id: string; text: string; author: string; createdAt: string; seen: boolean; noticeId: string | null }

interface MemoService {
  send(ctx, text: string): Promise<MemoView>               // portaria → notifica síndicos (memo, só no app)
  list(ctx): Promise<MemoView[]>                           // síndico
  markSeen(ctx, id: string): Promise<void>
  linkNotice(ctx, id: string, noticeId: string): Promise<void>
}

interface LostItemView {
  id: string; kind: "found" | "lost"; description: string; place: string | null; photo: string | null
  status: "open" | "claimed" | "returned" | "found"; apartment: string | null; createdAt: string
  mine: boolean                                            // perdido do meu apto, ou eu disse "é meu"
}

interface LostFoundService {
  list(ctx): Promise<{ found: LostItemView[]; lost: LostItemView[]; returned: LostItemView[] }>
  registerFound(ctx, input: { description: string; place: string | null; photo: string | null }): Promise<LostItemView>
  claim(ctx, id: string): Promise<LostItemView>            // morador: "É meu" → avisa portaria
  markReturned(ctx, id: string, apartmentNumber: string): Promise<LostItemView>
  reportLost(ctx, input: { description: string; place: string | null }): Promise<LostItemView>
  markFound(ctx, id: string): Promise<LostItemView>        // portaria: "Encontrei" → avisa o dono
}

interface ShiftView { staffId: string; name: string; role: "doorman" | "cleaner"; photoUrl: string | null; startsAt: string; endsAt: string }

interface StaffService {   // acrescenta à da spec 001
  board(ctx, at: Date): Promise<{ now: ShiftView[]; next: ShiftView[] }>   // próximos de hoje e amanhã
}

/** Só dev/demo agora; na Etapa 3, o webhook do WhatsApp chama a mesma função no servidor. */
interface WhatsappInboxService {
  receive(fromPhone: string, text: string): Promise<{ result: "registered" | "unknown-phone" | "no-permission" | "not-understood"; reply: string }>
  list(): Promise<InboundMessage[]>
}
```

## Regras comuns

- Avisos de entrega e correspondência seguem o esclarecimento 1 (quem cadastrou + responsável; sem código e
  correspondência: todos do apto), sempre no privado/app pela preferência "Entregas", nunca no grupo.
- `parseDeliveryMessage(text)` é uma função pura exportada, testada à parte (research R3).
- Fotos chegam já reduzidas; o serviço recusa `photo` que não seja `data:image/jpeg` (`validation`).
- Números de apartamento inexistentes → `not_found`.
