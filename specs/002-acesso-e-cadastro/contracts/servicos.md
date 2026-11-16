# Contrato: serviços de dados (acréscimos da spec 002)

Continua `specs/001-base-do-app/contracts/servicos-dados.md`. Mesmas regras: assíncronos, validados por Zod, filtro
por condomínio, `ServiceError` com `not_found | forbidden | validation | unavailable` (mais `rate_limited` nesta spec).
A permissão de cada operação segue `contracts/permissoes.md` e é conferida **no serviço** (RF-030).

```ts
type Role =
  | { kind: "resident"; condominiumId: string; residencyId: string; apartmentId: string }
  | { kind: "front-desk"; condominiumId: string; staffId: string }
  | { kind: "manager"; condominiumId: string }

interface Actor { personId: string; role: Role }

// O contexto passa a levar quem está agindo. Sem actor, só `auth` funciona.
type ServiceContext = { condominiumId: string; actor?: Actor }

type ServiceErrorCode = "not_found" | "forbidden" | "validation" | "unavailable" | "rate_limited"

interface AuthService {
  /** unknown: número sem pessoa ativa/pendente (sem envio). sent: código enviado. */
  requestCode(phone: string): Promise<
    | { status: "unknown" }
    | { status: "sent"; phone: string; expiresAt: string; resendAt: string }
  >                                                              // rate_limited após 5 pedidos/hora
  verifyCode(phone: string, code: string, deviceId: string): Promise<
    | { status: "ok"; session: SessionView }
    | { status: "wrong"; attemptsLeft: number }
    | { status: "expired" }                                      // expirou, 5 erros ou substituído
  >
  current(deviceId: string): Promise<SessionView | null>         // atualiza lastSeenAt; null se inválida
  chooseRole(deviceId: string, role: Role): Promise<SessionView> // forbidden se o papel não é da pessoa
  signOut(deviceId: string): Promise<void>
}

interface SessionView {
  person: { id: string; name: string; photo: string | null; phone: string }
  roles: Role[]
  activeRole: Role | null             // null quando há mais de um papel e nenhum escolhido
  needsWelcome: boolean               // morador ativo sem welcomeSeenAt
  needsRulesAcceptance: boolean       // morador sem rulesAcceptedAt
}

interface OnboardingService {
  markWelcomeSeen(ctx: ServiceContext): Promise<void>
  acceptRules(ctx: ServiceContext): Promise<void>                // grava rulesAcceptedAt
}

interface PeopleService {
  updateOwnProfile(ctx, patch: { name?: string; photo?: string | null }): Promise<PersonView>
}

interface ResidencyService {
  /** Pessoas do apartamento do ator (morador) ou de qualquer apartamento (síndico). */
  listByApartment(ctx, apartmentId: string): Promise<ResidentView[]>
  get(ctx, residencyId: string): Promise<ResidentView>
  invite(ctx, input: {                                           // só o responsável do apartamento
    name: string; phone: string; kind: "family" | "tenant" | "owner"
    canRegisterDeliveries: boolean; canVotePolls: boolean
  }): Promise<ResidentView>                                      // validation se celular já em uso
  update(ctx, residencyId: string, patch: {
    name?: string; kind?: ResidentKind; phone?: string
    canRegisterDeliveries?: boolean; canVotePolls?: boolean
  }): Promise<ResidentView>                                      // troca de celular encerra sessões
  remove(ctx, residencyId: string): Promise<void>                // encerra sessões; não remove o responsável
  resendInvite(ctx, residencyId: string): Promise<ResidentView>  // só para pendentes
}

interface ApartmentAdminService {                                // só síndico
  overview(ctx, input?: { filter?: "all" | "none" | "tenants"; search?: string }): Promise<{
    totals: { apartments: number; floors: number; all: number; none: number; tenants: number }
    items: ApartmentOverview[]
  }>
  registerResponsible(ctx, apartmentId: string, input: {
    name: string; phone: string; kind: "owner" | "tenant"
  }): Promise<ResidentView>                                      // validation se já tem responsável
  setResponsible(ctx, apartmentId: string, residencyId: string): Promise<void>
}

interface ApartmentDataService {
  listVehicles(ctx, apartmentId: string): Promise<Vehicle[]>
  saveVehicle(ctx, input: Omit<Vehicle, "id" | "condominiumId"> & { id?: string }): Promise<Vehicle>
  removeVehicle(ctx, id: string): Promise<void>
  listPets(ctx, apartmentId: string): Promise<Pet[]>
  savePet(ctx, input): Promise<Pet>
  removePet(ctx, id: string): Promise<void>
  getEmergencyContact(ctx, apartmentId: string): Promise<EmergencyContact | null>
  saveEmergencyContact(ctx, input): Promise<EmergencyContact>
  removeEmergencyContact(ctx, apartmentId: string): Promise<void>
}

interface FrontDeskDirectoryService {                            // só portaria (RF-029a)
  /** Só nome, foto e tipo das pessoas ativas e os carros. Nada de celular, animais ou contato. */
  apartment(ctx, number: string): Promise<{
    number: string
    people: { name: string; photo: string | null; kind: ResidentKind }[]
    vehicles: { plate: string; model: string; color: string }[]
  }>
}

interface RulesService {
  list(ctx, search?: string): Promise<{ topic: RuleTopic; rules: Rule[] }[]>   // todos os papéis
}

interface OutboxService {                                        // só dev/demo
  latestTo(phone: string): Promise<OutboxMessage | null>
  list(): Promise<OutboxMessage[]>
}

interface ResidentView {
  residencyId: string; personId: string; apartmentId: string
  name: string; phone: string; photo: string | null
  kind: ResidentKind; isResponsible: boolean
  canRegisterDeliveries: boolean; canVotePolls: boolean
  status: "pending" | "active"; lastInviteAt: string
}

interface ApartmentOverview {
  apartmentId: string; number: string; floor: number
  responsible: { name: string; kind: ResidentKind } | null
  people: number
  status: "active" | "pending" | "none"
  lastInviteAt: string | null
}
```

## Regras comuns

- Celulares de entrada são normalizados para E.164 antes de qualquer comparação (research R5).
- `invite`, `registerResponsible` e `update` com `phone` recusam celular já usado por outra pessoa não removida do
  condomínio (`validation`, `details.phone = "in_use"`).
- `remove` e `update` de `phone` encerram as sessões da pessoa afetada.
- O `OutboxService` só existe na fábrica de serviços nos modos `dev` e `demo`.
