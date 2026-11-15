# Contrato: serviços de dados da interface

As telas só acessam dados por estas interfaces (RF-024). A implementação local (IndexedDB) e a futura implementação HTTP
seguem exatamente o mesmo contrato (RF-025). Tipos definidos em `data-model.md`.

```ts
type ServiceContext = { condominiumId: string }

type ServiceErrorCode = 'not_found' | 'forbidden' | 'validation' | 'unavailable'
class ServiceError extends Error { code: ServiceErrorCode; details?: Record<string, string> }

interface CondominiumService {
  getCurrent(ctx: ServiceContext): Promise<Condominium>
}

interface ApartmentService {
  list(ctx: ServiceContext, filter?: { floor?: number; withoutResponsible?: boolean }): Promise<Apartment[]>
  getByNumber(ctx: ServiceContext, number: string): Promise<Apartment>          // not_found
}

interface ResidentService {
  listByApartment(ctx: ServiceContext, apartmentId: string): Promise<Resident[]>
  get(ctx: ServiceContext, id: string): Promise<Resident>                        // not_found
}

interface StaffService {
  list(ctx: ServiceContext): Promise<Staff[]>
  onDutyAt(ctx: ServiceContext, at: Date): Promise<Staff[]>                      // pela escala, horário de Brasília
}

interface ScheduleService {
  listWeek(ctx: ServiceContext): Promise<ShiftAssignment[]>
}

interface DevDataService {                                                       // só usado pelo painel
  resetSeed(): Promise<void>
  counts(ctx: ServiceContext): Promise<Record<string, number>>
}

interface Services {
  condominium: CondominiumService
  apartments: ApartmentService
  residents: ResidentService
  staff: StaffService
  schedule: ScheduleService
  dev: DevDataService
}

function getServices(): Services   // escolhe local, memória (sem armazenamento) ou, na Etapa 3, HTTP
```

## Regras

- Todos os métodos são assíncronos, mesmo na implementação local.
- Toda leitura filtra por `ctx.condominiumId`; um id de outro condomínio gera `not_found`, nunca o dado (RF-026).
- Retornos são validados pelos esquemas Zod antes de chegar à tela.
- `unavailable` quando o armazenamento falha; a tela mostra o estado de erro, não quebra.
- As telas consomem os serviços por *hooks* do TanStack Query (`useApartments`, `useOnDuty`…), nunca chamando
  `getServices()` diretamente nos componentes visuais.
- Métodos de escrita entram nas specs da Etapa 2, seguindo o mesmo padrão.
