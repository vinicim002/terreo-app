# Contrato: serviços (acréscimos da spec 006)

Mesmas regras das specs anteriores (`authorize` com `contracts/permissoes.md`, erros tipados, validação Zod).

```ts
interface SuggestionView {
  id: string; title: string; body: string; category: SuggestionCategory; photo: string | null
  /** "Apto 302" ou null (vizinhos de sugestão sem apartamento; o síndico sempre recebe). */
  apartment: string | null; authorName: string | null   // nome só para o síndico
  status: "received" | "reviewing" | "approved" | "declined"; reply: string | null
  up: number; down: number; agreePercent: number | null; myVote: "up" | "down" | null
  mine: boolean; canEdit: boolean; improvementId: string | null; createdAt: string
}
interface SuggestionService {
  list(ctx, tab: "top" | "recent" | "mine"): Promise<SuggestionView[]>
  get(ctx, id): Promise<SuggestionView>
  create(ctx, input: { title; body; category; photo: string | null; showApartment: boolean }): Promise<SuggestionView>
  update(ctx, id, input): Promise<SuggestionView>        // só autor, só "received"
  remove(ctx, id): Promise<void>                          // só autor, só "received"
  vote(ctx, id, value: "up" | "down"): Promise<SuggestionView>  // mesmo valor de novo = tira o voto
  setStatus(ctx, id, status, reply: string | null): Promise<SuggestionView>  // síndico; approved cria melhoria
}

interface ImprovementView {
  id; title; description; status: "planned" | "in-progress" | "done"; progress: number | null
  month: string | null; cost: number | null; beforePhoto; afterPhoto
  origin: { suggestionId: string; apartment: string | null; votes: number } | null
}
interface ImprovementService {
  list(ctx): Promise<ImprovementView[]>                   // em andamento, planejadas, concluídas
  save(ctx, input: ImprovementInput & { id?: string }): Promise<ImprovementView>  // síndico; done avisa os "gostei"
  remove(ctx, id): Promise<void>                          // síndico; sugestão de origem volta a "reviewing"
}

interface IssueView {
  id; place; kind; description; photos: string[]; public: boolean; urgent: boolean
  status: "open" | "in-progress" | "resolved"; isNew: boolean
  reporter: string          // síndico e a própria casa: "Apto 804" ou "Portaria"; vizinhos: "Morador" ou "Portaria"
  supports: number; supportedByMe: boolean; canSupport: boolean
  updates: { status; message: string | null; at: string }[]; createdAt: string; mine: boolean
}
interface IssueService {
  report(ctx, input: { place; kind; description; photos: string[]; public: boolean }): Promise<IssueView>
  similar(ctx, place): Promise<IssueView[]>               // públicos abertos do mesmo lugar
  mine(ctx): Promise<IssueView[]>                         // os meus, do meu apartamento e os públicos
  support(ctx, id): Promise<IssueView>                    // de novo = desfaz
  all(ctx, status): Promise<IssueView[]>                  // síndico; urgentes primeiro; marca seenAt ao abrir
  update(ctx, id, input: { status; message: string | null; urgent?: boolean }): Promise<IssueView>
}

interface NoiseView { id; kind; where; floor: number | null; happenedAt; createdAt; seen: boolean }
interface NoiseService {
  report(ctx, input: { kind; where; floor: number | null; happenedAt: string }): Promise<NoiseView>  // sem autor
  list(ctx): Promise<NoiseView[]>                         // síndico
  markSeen(ctx, id): Promise<void>
  byIds(ctx, ids: string[]): Promise<NoiseView[]>         // "Meus avisos" a partir dos ids guardados no aparelho
}

interface ListingView {
  id; kind: "provider" | "shop"; name; category; phone; display; isMobile; note; delivers: boolean | null
  recommendations: number; rating: number | null          // média com uma casa
  reviews: { by: string; rating: number | null; comment: string | null; at: string }[]  // "Apto 804", "Portaria", "Síndico"
  mine: { rating: number | null; comment: string | null } | null
}
interface ListingService {
  list(ctx, kind, filter: { search?: string; category?: string }): Promise<ListingView[]>
  findByPhone(ctx, kind, phone): Promise<ListingView | null>
  recommendNew(ctx, input): Promise<ListingView>          // telefone repetido → conflict com o id existente
  recommend(ctx, id, input: { rating: number | null; comment: string | null }): Promise<ListingView>
  unrecommend(ctx, id): Promise<void>                     // sem indicações, o item some
  remove(ctx, id): Promise<void>                          // síndico; avisa quem indicou
}

interface SurveyService {
  current(ctx): Promise<{ period: string; endsOn: string; mine: SurveyAnswer | null }>
  answer(ctx, input: { frontDesk; cleaning; app; comment: string | null }): Promise<void>
  results(ctx): Promise<{ period; responses; averages: { frontDesk; cleaning; app }; delta: {…} | null; comments: string[] }[]>
}
```
