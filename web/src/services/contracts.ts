// Interfaces dos serviços de dados (specs 001 e 002: contracts/servicos-dados.md e contracts/servicos.md).
// A implementação local (IndexedDB), a em memória e a futura HTTP seguem exatamente este contrato (RF-025 da 001).
import type {
  AgendaEvent,
  DeliveryStatus,
  InboundMessage,
  OnArrival,
  PackageSize,
  Store,
  NoticeKind,
  NotificationPrefs,
  NotificationTarget,
  NotificationType,
  Recurrence,
  Apartment,
  Condominium,
  EmergencyContact,
  OutboxMessage,
  Pet,
  ResidentKind,
  Role,
  Rule,
  RuleTopic,
  ShiftAssignment,
  Staff,
  Vehicle,
} from "./schemas"

export type { Role }

/** Quem está agindo. Sem actor, todo serviço lança `forbidden`, exceto `auth` (RF-030 da 002). */
export interface Actor {
  personId: string
  role: Role
}

export interface ServiceContext {
  condominiumId: string
  actor?: Actor
}

export type ServiceErrorCode =
  "not_found" | "forbidden" | "validation" | "unavailable" | "rate_limited"

export class ServiceError extends Error {
  constructor(
    readonly code: ServiceErrorCode,
    message: string,
    readonly details?: Record<string, string>,
  ) {
    super(message)
    this.name = "ServiceError"
  }
}

// ---------- Visões devolvidas às telas ----------

export interface PersonView {
  id: string
  name: string
  phone: string
  photo: string | null
}

export interface SessionView {
  person: PersonView
  roles: Role[]
  /** null quando há mais de um papel e nenhum foi escolhido. */
  activeRole: Role | null
  needsWelcome: boolean
  needsRulesAcceptance: boolean
  /** Número do apartamento de cada papel de morador (apartmentId → número), para a escolha de papel. */
  apartmentNumbers: Record<string, string>
}

export interface ResidentView {
  residencyId: string
  personId: string
  apartmentId: string
  name: string
  phone: string
  photo: string | null
  kind: ResidentKind
  isResponsible: boolean
  canRegisterDeliveries: boolean
  canVotePolls: boolean
  status: "pending" | "active"
  lastInviteAt: string
}

export interface ApartmentOverview {
  apartmentId: string
  number: string
  floor: number
  responsible: { name: string; kind: ResidentKind } | null
  people: number
  status: "active" | "pending" | "none"
  lastInviteAt: string | null
}

export interface DirectoryEntry {
  number: string
  people: { name: string; photo: string | null; kind: ResidentKind }[]
  vehicles: { plate: string; model: string; color: string }[]
}

// ---------- Serviços da spec 001 ----------

export interface CondominiumService {
  getCurrent(ctx: ServiceContext): Promise<Condominium>
}

export interface ApartmentService {
  list(
    ctx: ServiceContext,
    filter?: { floor?: number; withoutResponsible?: boolean },
  ): Promise<Apartment[]>
  getByNumber(ctx: ServiceContext, number: string): Promise<Apartment>
  get(ctx: ServiceContext, id: string): Promise<Apartment>
}

export interface StaffService {
  list(ctx: ServiceContext): Promise<Staff[]>
  onDutyAt(ctx: ServiceContext, at: Date): Promise<Staff[]>
  /** Quem trabalha agora e os próximos turnos de hoje e amanhã (spec 004, research R6). */
  board(ctx: ServiceContext, at: Date): Promise<{ now: ShiftView[]; next: ShiftView[] }>
}

export interface ScheduleService {
  listWeek(ctx: ServiceContext): Promise<ShiftAssignment[]>
}

/** Só usado pelo painel de desenvolvimento (não exige actor fora do modo real). */
export interface DevDataService {
  resetSeed(): Promise<void>
  counts(ctx: ServiceContext): Promise<Record<string, number>>
  /** Esquece os códigos pedidos por um celular (atalho dos testes trocar de conta sem esperar 60 s). */
  forgetCodes(phone: string): Promise<void>
}

// ---------- Serviços da spec 002 ----------

export type RequestCodeResult =
  { status: "unknown" } | { status: "sent"; phone: string; expiresAt: string; resendAt: string }

export type VerifyCodeResult =
  | { status: "ok"; session: SessionView }
  | { status: "wrong"; attemptsLeft: number }
  | { status: "expired" }

export interface AuthService {
  requestCode(phone: string): Promise<RequestCodeResult>
  verifyCode(phone: string, code: string, deviceId: string): Promise<VerifyCodeResult>
  current(deviceId: string): Promise<SessionView | null>
  chooseRole(deviceId: string, role: Role): Promise<SessionView>
  signOut(deviceId: string): Promise<void>
}

export interface OnboardingService {
  markWelcomeSeen(ctx: ServiceContext): Promise<void>
  acceptRules(ctx: ServiceContext): Promise<void>
}

export interface PeopleService {
  updateOwnProfile(
    ctx: ServiceContext,
    patch: { name?: string; photo?: string | null },
  ): Promise<PersonView>
}

export interface InviteInput {
  name: string
  phone: string
  kind: ResidentKind
  canRegisterDeliveries: boolean
  canVotePolls: boolean
}

export interface ResidencyPatch {
  name?: string
  kind?: ResidentKind
  phone?: string
  canRegisterDeliveries?: boolean
  canVotePolls?: boolean
}

export interface ResidencyService {
  listByApartment(ctx: ServiceContext, apartmentId: string): Promise<ResidentView[]>
  get(ctx: ServiceContext, residencyId: string): Promise<ResidentView>
  invite(ctx: ServiceContext, input: InviteInput): Promise<ResidentView>
  update(ctx: ServiceContext, residencyId: string, patch: ResidencyPatch): Promise<ResidentView>
  remove(ctx: ServiceContext, residencyId: string): Promise<void>
  resendInvite(ctx: ServiceContext, residencyId: string): Promise<ResidentView>
}

export interface ApartmentAdminService {
  overview(
    ctx: ServiceContext,
    input?: { filter?: "all" | "none" | "tenants"; search?: string },
  ): Promise<{
    totals: { apartments: number; floors: number; all: number; none: number; tenants: number }
    items: ApartmentOverview[]
  }>
  registerResponsible(
    ctx: ServiceContext,
    apartmentId: string,
    input: { name: string; phone: string; kind: "owner" | "tenant" },
  ): Promise<ResidentView>
  setResponsible(ctx: ServiceContext, apartmentId: string, residencyId: string): Promise<void>
}

export type VehicleInput = {
  id?: string
  apartmentId: string
  plate: string
  model: string
  color: string
}
export type PetInput = { id?: string; apartmentId: string; name: string; kind: Pet["kind"] }
export type EmergencyContactInput = {
  apartmentId: string
  name: string
  relationship: string
  phone: string
}

export interface ApartmentDataService {
  listVehicles(ctx: ServiceContext, apartmentId: string): Promise<Vehicle[]>
  saveVehicle(ctx: ServiceContext, input: VehicleInput): Promise<Vehicle>
  removeVehicle(ctx: ServiceContext, id: string): Promise<void>
  listPets(ctx: ServiceContext, apartmentId: string): Promise<Pet[]>
  savePet(ctx: ServiceContext, input: PetInput): Promise<Pet>
  removePet(ctx: ServiceContext, id: string): Promise<void>
  getEmergencyContact(ctx: ServiceContext, apartmentId: string): Promise<EmergencyContact | null>
  saveEmergencyContact(ctx: ServiceContext, input: EmergencyContactInput): Promise<EmergencyContact>
  removeEmergencyContact(ctx: ServiceContext, apartmentId: string): Promise<void>
}

export interface FrontDeskDirectoryService {
  apartment(ctx: ServiceContext, number: string): Promise<DirectoryEntry>
}

export interface RulesService {
  list(ctx: ServiceContext, search?: string): Promise<{ topic: RuleTopic; rules: Rule[] }[]>
}

export interface OutboxService {
  latestTo(phone: string): Promise<OutboxMessage | null>
  list(): Promise<OutboxMessage[]>
}

// ---------- Serviços da spec 003 (contracts/servicos.md) ----------

export interface NoticeInput {
  kind: NoticeKind
  /** Obrigatório quando `kind = other`. */
  customKind?: string | null
  title: string
  body: string
  important: boolean
  sendToGroup: boolean
  requireConfirmation: boolean
  /** Dia do assunto (`AAAA-MM-DD`), para o lembrete da véspera e a agenda. */
  referenceDate: string | null
  remindDayBefore: boolean
  /** null = publicar agora. */
  publishAt: string | null
}

export interface NoticeView {
  id: string
  kind: NoticeKind
  customKind: string | null
  title: string
  body: string
  important: boolean
  sendToGroup: boolean
  requireConfirmation: boolean
  referenceDate: string | null
  remindDayBefore: boolean
  status: "scheduled" | "published" | "resolved"
  publishAt: string
  publishedAt: string | null
  editedAt: string | null
  resolvedAt: string | null
  resolutionNote: string | null
  author: { name: string }
  /** Da versão atual do aviso. */
  me: { read: boolean; confirmed: boolean }
}

export interface NoticeStats {
  readApartments: number
  totalApartments: number
  confirmations: { personName: string; apartment: string; at: string }[]
  /** Apartamentos sem confirmação (só em avisos com confirmação). */
  pendingApartments: string[]
}

export type NoticeFilter = "all" | "unread" | "scheduled"

export interface NoticeService {
  list(ctx: ServiceContext, filter: NoticeFilter): Promise<{ items: NoticeView[]; unread: number }>
  /** Abre o aviso e marca como lido (RF-006). */
  get(ctx: ServiceContext, id: string): Promise<NoticeView>
  confirm(ctx: ServiceContext, id: string): Promise<NoticeView>
  create(ctx: ServiceContext, input: NoticeInput): Promise<NoticeView>
  update(ctx: ServiceContext, id: string, input: NoticeInput): Promise<NoticeView>
  resolve(ctx: ServiceContext, id: string, note: string | null): Promise<NoticeView>
  remove(ctx: ServiceContext, id: string): Promise<void>
  stats(ctx: ServiceContext, id: string): Promise<NoticeStats>
}

export interface PollOptionView {
  id: string
  label: string
  /** null quando o resultado está oculto. */
  votes: number | null
  percent: number | null
}

export interface PollView {
  id: string
  question: string
  official: boolean
  showPartial: boolean
  options: PollOptionView[]
  totalVotes: number | null
  status: "open" | "closed"
  closesAt: string
  closedAt: string | null
  winner: { optionIds: string[]; tie: boolean } | null
  me: {
    canVote: boolean
    canSuggest: boolean
    /** Oficial: o voto do apartamento (dado pelo responsável). */
    vote: { optionId: string; byName: string } | null
    /** optionId que eu sugeri. */
    suggestion: string | null
    /** Só para o responsável: sugestões das pessoas do apartamento. */
    householdSuggestions: { personName: string; optionId: string }[]
  }
}

export interface PollInput {
  question: string
  options: string[]
  closesAt: string
  official: boolean
  showPartial: boolean
}

export interface PollService {
  list(ctx: ServiceContext): Promise<{ open: PollView[]; closed: PollView[] }>
  get(ctx: ServiceContext, id: string): Promise<PollView>
  vote(ctx: ServiceContext, id: string, optionId: string): Promise<PollView>
  suggest(ctx: ServiceContext, id: string, optionId: string): Promise<PollView>
  create(ctx: ServiceContext, input: PollInput): Promise<PollView>
  close(ctx: ServiceContext, id: string): Promise<PollView>
}

export interface MeetingView {
  id: string
  startsAt: string
  place: string
  agenda: string[]
  summary: string | null
  summaryAt: string | null
  status: "upcoming" | "past" | "cancelled"
}

export interface MeetingInput {
  startsAt: string
  place: string
  agenda: string[]
}

export interface MeetingService {
  list(ctx: ServiceContext): Promise<{ upcoming: MeetingView[]; past: MeetingView[] }>
  get(ctx: ServiceContext, id: string): Promise<MeetingView>
  create(ctx: ServiceContext, input: MeetingInput): Promise<MeetingView>
  update(ctx: ServiceContext, id: string, input: MeetingInput): Promise<MeetingView>
  setSummary(ctx: ServiceContext, id: string, summary: string): Promise<MeetingView>
  cancel(ctx: ServiceContext, id: string): Promise<void>
}

export interface AgendaItem {
  /** Ocorrência (ISO, UTC). */
  date: string
  kind: "meeting" | "maintenance" | "routine" | "notice"
  title: string
  recurrence: Recurrence
  target: { kind: "meeting" | "notice" | "event"; id: string }
}

export interface AgendaEventInput {
  title: string
  kind: AgendaEvent["kind"]
  startsAt: string
  durationMinutes: number | null
  recurrence: Recurrence
}

export interface AgendaService {
  /** `month` de 1 a 12; chaves `AAAA-MM-DD` em Brasília. */
  month(
    ctx: ServiceContext,
    year: number,
    month: number,
  ): Promise<{ days: Record<string, AgendaItem[]> }>
  upcoming(ctx: ServiceContext, limit?: number): Promise<AgendaItem[]>
  createEvent(ctx: ServiceContext, input: AgendaEventInput): Promise<AgendaItem>
  cancelEvent(ctx: ServiceContext, id: string): Promise<void>
}

export interface NotificationView {
  id: string
  type: NotificationType
  title: string
  body: string
  target: NotificationTarget | null
  createdAt: string
  read: boolean
}

export type NotificationPrefsInput = Pick<NotificationPrefs, "app" | "whatsapp">

export interface NotificationService {
  list(ctx: ServiceContext): Promise<NotificationView[]>
  unreadCount(ctx: ServiceContext): Promise<number>
  markRead(ctx: ServiceContext, id: string): Promise<void>
  markAllRead(ctx: ServiceContext): Promise<void>
  getPrefs(ctx: ServiceContext): Promise<NotificationPrefsInput>
  setPrefs(ctx: ServiceContext, prefs: NotificationPrefsInput): Promise<NotificationPrefsInput>
}

// ---------- Serviços da spec 004 (contracts/servicos.md) ----------

export interface DeliveryView {
  id: string
  apartment: string
  origin: "app" | "whatsapp" | "front-desk" | "mail"
  store: Store | null
  storeName: string | null
  code: string | null
  note: string | null
  onArrival: OnArrival | null
  size: PackageSize | null
  photo: string | null
  status: DeliveryStatus
  createdAt: string
  createdBy: string
  arrivedAt: string | null
  receivedBy: string | null
  pickedUpAt: string | null
  pickedUpBy: string | null
  /** Dias inteiros na portaria (só "Na portaria"). */
  daysAtDesk: number | null
}

export interface CodeInput {
  store: Store
  storeName?: string | null
  code: string
  note?: string | null
  onArrival: OnArrival
  /** Confirma que é outro pedido quando já existe um igual aguardando no mesmo dia. */
  confirmDuplicate?: boolean
}

export interface ReceiveInput {
  apartmentNumber: string
  size: PackageSize
  store: Store
  storeName?: string | null
  photo: string | null
  notifyResident: boolean
}

export interface DeliveryService {
  mine(
    ctx: ServiceContext,
  ): Promise<{ awaiting: DeliveryView[]; atDesk: DeliveryView[]; done: DeliveryView[] }>
  registerCode(ctx: ServiceContext, input: CodeInput): Promise<DeliveryView>
  cancelCode(ctx: ServiceContext, id: string): Promise<void>
  pickUp(ctx: ServiceContext, id: string): Promise<DeliveryView>
  byApartment(ctx: ServiceContext, apartmentNumber: string): Promise<DeliveryView[]>
  markArrived(ctx: ServiceContext, id: string): Promise<DeliveryView>
  receive(ctx: ServiceContext, input: ReceiveInput): Promise<DeliveryView>
  mail(ctx: ServiceContext, apartmentNumber: string): Promise<DeliveryView>
  registerPickup(ctx: ServiceContext, id: string, personId: string): Promise<DeliveryView>
}

export interface VisitorView {
  id: string
  apartment: string
  kind: "visit" | "provider"
  name: string
  day: string
  fromTime: string
  toTime: string
  people: number
  status: "expected" | "arrived" | "no-show" | "cancelled"
  walkIn: boolean
  createdBy: string
  arrivedAt: string | null
  releasedBy: string | null
  canCancel: boolean
}

export interface VisitorInput {
  kind: "visit" | "provider"
  name: string
  day: string
  fromTime: string
  toTime: string
  people: number
}

export interface VisitorService {
  mine(ctx: ServiceContext): Promise<{ expected: VisitorView[]; history: VisitorView[] }>
  register(ctx: ServiceContext, input: VisitorInput): Promise<VisitorView>
  cancel(ctx: ServiceContext, id: string): Promise<void>
  today(ctx: ServiceContext): Promise<{ expected: VisitorView[]; arrived: VisitorView[] }>
  checkIn(ctx: ServiceContext, id: string): Promise<VisitorView>
  walkIn(
    ctx: ServiceContext,
    input: { apartmentNumber: string; name: string },
  ): Promise<VisitorView>
}

export interface TravelView {
  from: string
  to: string
  createdBy: string
}

export interface TravelService {
  mine(ctx: ServiceContext): Promise<TravelView | null>
  start(ctx: ServiceContext, input: { from: string; to: string }): Promise<TravelView>
  end(ctx: ServiceContext): Promise<void>
  /** Portaria: apartamentos em viagem agora. */
  active(ctx: ServiceContext): Promise<{ apartment: string; from: string; to: string }[]>
}

export interface DeskApartment {
  number: string
  floor: number
  awaiting: number
  atDesk: number
  travelUntil: string | null
}

export interface DeskApartmentDetail {
  number: string
  people: { personId: string; name: string; photo: string | null; kind: ResidentKind }[]
  deliveries: DeliveryView[]
  travelUntil: string | null
}

export interface FrontDeskService {
  overview(ctx: ServiceContext): Promise<{
    awaiting: number
    atDesk: number
    expectedVisitors: number
    apartments: DeskApartment[]
  }>
  apartment(ctx: ServiceContext, number: string): Promise<DeskApartmentDetail>
}

export interface MemoView {
  id: string
  text: string
  author: string
  createdAt: string
  seen: boolean
  noticeId: string | null
}

export interface MemoService {
  send(ctx: ServiceContext, text: string): Promise<MemoView>
  list(ctx: ServiceContext): Promise<MemoView[]>
  get(ctx: ServiceContext, id: string): Promise<MemoView>
  markSeen(ctx: ServiceContext, id: string): Promise<void>
  linkNotice(ctx: ServiceContext, id: string, noticeId: string): Promise<void>
}

export interface LostItemView {
  id: string
  kind: "found" | "lost"
  description: string
  place: string | null
  photo: string | null
  status: "open" | "claimed" | "returned" | "found"
  apartment: string | null
  createdAt: string
  /** Perdido do meu apartamento, ou eu disse "é meu". */
  mine: boolean
}

export interface LostFoundService {
  list(
    ctx: ServiceContext,
  ): Promise<{ found: LostItemView[]; lost: LostItemView[]; returned: LostItemView[] }>
  registerFound(
    ctx: ServiceContext,
    input: { description: string; place: string | null; photo: string | null },
  ): Promise<LostItemView>
  claim(ctx: ServiceContext, id: string): Promise<LostItemView>
  markReturned(ctx: ServiceContext, id: string, apartmentNumber: string): Promise<LostItemView>
  reportLost(
    ctx: ServiceContext,
    input: { description: string; place: string | null },
  ): Promise<LostItemView>
  markFound(ctx: ServiceContext, id: string): Promise<LostItemView>
}

export interface ShiftView {
  staffId: string
  name: string
  role: "doorman" | "cleaner"
  photoUrl: string | null
  startsAt: string
  endsAt: string
}

export type InboxResult = "registered" | "unknown-phone" | "no-permission" | "not-understood"

export interface WhatsappInboxService {
  receive(fromPhone: string, text: string): Promise<{ result: InboxResult; reply: string }>
  list(): Promise<InboundMessage[]>
}

export interface Services {
  condominium: CondominiumService
  apartments: ApartmentService
  residents: ResidencyService
  staff: StaffService
  schedule: ScheduleService
  dev: DevDataService
  auth: AuthService
  onboarding: OnboardingService
  people: PeopleService
  admin: ApartmentAdminService
  apartmentData: ApartmentDataService
  directory: FrontDeskDirectoryService
  rules: RulesService
  notices: NoticeService
  polls: PollService
  meetings: MeetingService
  agenda: AgendaService
  notifications: NotificationService
  deliveries: DeliveryService
  visitors: VisitorService
  travel: TravelService
  desk: FrontDeskService
  memos: MemoService
  lostFound: LostFoundService
  /** Só existe nos modos dev e demo (mensagens recebidas simuladas; na Etapa 3, o webhook). */
  whatsappInbox?: WhatsappInboxService
  /** Só existe nos modos dev e demo. */
  outbox?: OutboxService
}
