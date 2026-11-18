# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Converse com o usuário em português. A constituição em `.specify/memory/constitution.md` vale acima deste arquivo —
leia antes de especificar, planejar ou implementar.

## Regras de commit (obrigatórias)

- Formato: `<prefixo em inglês>: <descrição em português>` — ex.: `feat: adiciona cadastro de entregas`,
  `docs: atualiza README`, `chore: configura Spec Kit`.
- **Nunca** adicionar `Co-Authored-By` de IA (Claude, Cursor, Codex etc.), "Generated with" ou qualquer menção a
  ferramenta de IA em commits ou PRs. O autor é só a pessoa do projeto que fez o commit (git config dela).
- Commitar só quando o usuário pedir.
- Nunca versionar `.env`, senhas, chaves, credenciais ou dados reais de moradores. Conferir `git status` antes do
  commit. A pasta `arquivos-gerais-terreo/` está no `.gitignore` e não sobe.

## Documentação e PDF (obrigatório)

- `docs/documentacao/NN-*.md` (capítulos), `docs/backlog.md` e `docs/changelog.md` são a documentação oficial; o PDF
  `docs/pdf/terreo-documentacao.pdf` é gerado deles com `uv run scripts/gerar_pdf.py` (também anexa o `git log`).
- Quando o usuário for encerrar o dia (ou pedir para atualizar o PDF), use a skill `/encerrar-dia`: changelog
  (Adicionado/Alterado/Removido), backlog, capítulos afetados, PDF, conferência de segurança e commit se autorizado.
- Mudança de funcionalidade, stack ou estrutura de pastas atualiza o capítulo correspondente.
- O painel `/dev` (só no `next dev`) lê docs/, specs/, backlog e `git log` direto do repositório.

## Comandos

`make` pode não estar instalado (`sudo apt install make`); os equivalentes diretos estão em
`docs/documentacao/04-desenvolvimento.md`.

- Ambiente: `cp .env.example .env`, `cd web && npm ci`, `make dev` (= `docker compose up --build -d --renew-anon-volumes`).
  Interface http://localhost:3100, painel `/dev`, API `/api/health`.
- Testes: `make test` (Vitest + pytest), `make lint` (ESLint, Prettier, tsc, Ruff), `make e2e` (Playwright no contêiner
  `mcr.microsoft.com/playwright`, contra o `make dev`), `make e2e-build` (testes `@build`: PWA, sem internet,
  atualização, demonstração), `make perf` (Lighthouse).
- Um teste só: `cd web && npx vitest run tests/unit/<arquivo>`;
  `docker compose --profile e2e run --rm e2e npx playwright test tests/e2e/<arquivo> --project=pixel-7`;
  `cd api && uv run pytest tests/<arquivo>::<teste>`.
- Build: `cd web && npm run build:demo` (exportação estática em `web/out/` + service worker).
- Depois de criar rotas novas, rode `cd web && npx next typegen` para atualizar os tipos `PageProps`/`LayoutProps`.
- Os testes e2e rodam com o navegador em `pt-BR`; o app detecta o idioma do aparelho.
- E2e entram com `signInAs(page, "responsible" | "family" | "pending" | "front-desk" | "manager")` de
  `web/tests/e2e/helpers.ts` (usa `window.__terreoDev`, só em dev/demo). Espere a página carregar dados antes de digitar
  (ex.: `toBeEditable()` ou um contador visível): o que é digitado antes da hidratação se perde.
- Build da versão real: `cd web && npm run build:real` (`out-real/`) + `make e2e-build-real` (testes `@build-real`).
- Testes unitários dos serviços: `tests/unit/auth-helpers.ts` (`setup()` com relógio controlado, `signIn()`).

## Publicação

Demonstração no Cloudflare Workers com arquivos estáticos (`terreo.v2n.tech`, raiz `web`, `npm run build:demo` +
`npx wrangler deploy`, `web/wrangler.jsonc`; `web/worker/index.js` repassa `/api/*` para `API_ORIGIN`) e API numa VPS compartilhada, em `~/terreo`
(projeto Compose `terreo-prod`, `infra/compose.prod.yaml`, sem portas publicadas, Cloudflare Tunnel próprio
`terreo-api.v2n.tech`). Nunca mexer em nada fora de `~/terreo` na VPS. Passo a passo: `docs/documentacao/05-publicacao.md`.

## Next.js 16 (leia `web/AGENTS.md`)

Esta versão difere do que você conhece: consulte `web/node_modules/next/dist/docs/` antes de usar APIs do Next.
Já verificado: `output: 'export'` não aceita rewrites nem route handlers dinâmicos (nem no `next dev`), por isso só é
ligado no build; `allowedDevOrigins` precisa incluir `web` (contêiner dos testes); `cacheComponents` fica desligado.
Arquivos `*.dev.tsx` não podem usar os tipos gerados `PageProps`/`LayoutProps` (não existem no build).

## Estado atual e stack

Stack na constituição (princípio VI) e em `docs/documentacao/03-arquitetura.md`: monorepo `web/` (Next.js App Router +
TS, Tailwind + shadcn/ui, next-intl pt/en/es, Vitest + Playwright) e `api/` (FastAPI, SQLAlchemy, Alembic,
PostgreSQL, pytest, ARQ + Redis), fotos no Cloudflare R2, WhatsApp pela Evolution API atrás de serviço trocável com
fila, Web Push (VAPID), Docker Compose + Caddy em VPS.

Identidade visual (kit em `terreo-kit/`, local): laranja `#E8590C`, branco, marrom `#7A4E35`, creme `#F4EEE2`;
mascote sabiá-laranjeira; nome e títulos em Plus Jakarta Sans peso 800. Token `--brand` = `#E8590C` só para ícones,
mascote e áreas grandes (branco sobre ele dá 3,58, não serve para texto); `--primary` = `#C2410C` para botões e texto
(5,18, AA). Cores só pelos tokens de `web/src/theme/tokens.css` (o teste de contraste confere a marca e AA/AAA).

Regras de arquitetura que atravessam o código:
- Serviços sempre com `ServiceContext.actor`; permissões só em `web/src/services/permissions.ts` (matriz da spec 002).
- `crypto.randomUUID`/`crypto.subtle` não existem fora de HTTPS: use `web/src/lib/crypto.ts`.
- Next.js só renderiza telas; regra de negócio fica no FastAPI, chamado pelo navegador em `/api` no mesmo domínio.
- Front-end primeiro: telas consomem serviços tipados com dados locais, trocados depois pela API sem mudar as telas.
- Multi-condomínio: todo dado tem condomínio e toda consulta filtra por ele (testar o isolamento).
- Envios (WhatsApp, push) sempre pela fila ARQ, nunca direto da rota.

Nome do app: **Térreo**. Os mockups usam "Condô" e "Edifício Aurora" — ignore esses nomes; o prédio piloto é o
**Edifício Taquaretinga**.

## Spec Kit

Spec mais recente: `specs/004-portaria/` (implementada: `Delivery` única com estados, `runDue` com lembrete de
3 dias, `notify` com categoria só no app, código por WhatsApp reconhecido por `parseDeliveryMessage` e simulado no
`/dev`, ditar pelo reconhecimento de fala do aparelho, `SEED_VERSION` 4). Anterior: `specs/003-comunicacao/` (implementada: `runDue` idempotente para tarefas com horário, `notify`
único para canais — gerais só no grupo, privado só pessoal —, leituras de aviso por versão, voto oficial do responsável
com sugestões, `SEED_VERSION` 3 relativo a `now`). Anterior: `specs/002-acesso-e-cadastro/` (implementada: pessoa separada dos papéis, `ServiceContext.actor` com
matriz de permissões em `contracts/permissoes.md` conferida nos serviços, código e sessão simulados no aparelho,
`libphonenumber-js`, `SEED_VERSION` 2). Anterior: `specs/001-base-do-app/` (implementada) (plano em `plan.md`; decisões em `research.md`: Next.js com exportação
estática, next-intl sem idioma na URL, preferências aplicadas antes da pintura via atributos `data-*`, Serwist sobre
`web/out/`, serviços tipados sobre IndexedDB, painel `/dev` só em `next dev` via `pageExtensions` `.dev.tsx`,
`NEXT_PUBLIC_APP_MODE` = dev|demo|real, demonstração no Cloudflare Pages, portas web 3100 / api 8100 / db 5440 /
redis 6390).

Fluxo: `/speckit-specify` → `/speckit-clarify` (**sempre**, regra do usuário) → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` (**sempre**, regra do usuário) →
`/speckit-implement`. Cada mudança relevante vira `specs/NNN-nome/` (numeração sequencial). `spec.md` = o quê e por quê,
sem tecnologia; `plan.md` = como, com "Verificação da constituição". Scripts e modelos ficam em `.specify/`; as skills
em `.claude/skills/speckit-*`.

## Material de referência (só local, não versionado)

- `arquivos-gerais-terreo/minimundo-terreo.md` — **fonte das regras de negócio**. Use como entrada do
  `/speckit-specify`.
- `arquivos-gerais-terreo/terreo_telas/` — mockups: `pranchas_{1_morador,2_portaria,3_sindico}.png` e telas
  individuais `telas/NN_nome.png` (01–29 morador, 30–35 portaria, 36–42 síndico).
- `terreo-kit/` — kit da marca atual (laranja, mascote sabiá; `LEIA-ME.md` com ícones e manifest do PWA). O kit azul
  antigo em `arquivos-gerais-terreo/terreo-kit/` não vale mais.
- Arquivos `*:Zone.Identifier` são lixo do WSL; ignore.

## Conceitos de domínio que atravessam o sistema

- **Três perfis** com interfaces distintas: morador, portaria e síndico. A UI da portaria é mínima (botões grandes,
  ícones, registro por voz).
- **Unidade = apartamento.** Síndico cadastra apartamento + responsável; só o responsável convida/remove moradores.
  Enquetes oficiais: um voto por apartamento.
- **Login sem senha**: celular → código pelo WhatsApp; sessão persistente, novo código ao trocar de aparelho ou após
  ~6 meses sem uso.
- **WhatsApp é canal de primeira classe**: avisos gerais no grupo, pessoais no privado; moradores confirmam leitura e
  cadastram códigos de entrega por mensagem. A camada de notificação despacha para push + WhatsApp conforme o tipo e as
  preferências do morador — exceto emergências, que chegam a todos.
- **Privacidade**: sem CPF/nascimento/documento de visitante; entregas e códigos nunca no grupo; aviso de barulho
  anônimo.
- **Fluxos encadeados**: sugestão aprovada vira melhoria e notifica quem deu "gostei"; mudança aprovada reserva o
  elevador e avisa vizinhos; aviso agendável e marcável como resolvido.
- **Plantão automático** pela escala (porteiros 6–14h, 14–22h, 22–6h, folgas em rodízio — regras ainda em aberto).
- "Ideias para o futuro" do minimundo estão fora do escopo inicial.
