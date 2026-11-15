---
description: "Lista de tarefas da spec 001 — Base do app"
---

# Tarefas: Base do app

**Entrada**: documentos de `specs/001-base-do-app/`

**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Testes**: obrigatórios pela constituição (princípio VII). Em cada história, os testes vêm antes da implementação e
devem falhar primeiro.

**Organização**: tarefas agrupadas por história da spec, para cada uma ser implementada e testada de forma
independente.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[USn]**: história da spec (US1 = História 1 … US5 = História 5)
- Caminhos relativos à raiz do repositório; interface em `web/`, API em `api/`

---

## Fase 1: Configuração (infraestrutura comum)

**Objetivo**: criar o monorepo, as ferramentas e o ambiente local (RF-001, RF-003).

- [ ] T001 Criar `.env.example` na raiz com variáveis de desenvolvimento sem segredos reais (`APP_ENV=development`, `DATABASE_URL`, `REDIS_URL`, `NEXT_PUBLIC_APP_MODE=dev`, `API_INTERNAL_URL=http://api:8100`) e conferir que `.env` continua no `.gitignore`
- [ ] T002 Inicializar o Next.js (App Router, TypeScript, Tailwind CSS 4, ESLint, sem `src/app`) em `web/` com `output: 'export'`, `images.unoptimized` e `trailingSlash: true` em `web/next.config.ts`
- [ ] T003 [P] Inicializar o projeto Python com `uv` em `api/pyproject.toml` (FastAPI, uvicorn, SQLAlchemy 2 com asyncpg, Alembic, ARQ, Pydantic Settings, redis; dev: pytest, pytest-asyncio, httpx, ruff) e configurar Ruff (lint + formatação)
- [ ] T004 [P] Instalar na interface: next-intl, @tanstack/react-query, zod, idb, lucide-react, react-markdown, remark-gfm, @serwist/build e serwist; dev: vitest, @testing-library/react, @testing-library/jest-dom, jsdom, fake-indexeddb, @playwright/test, @axe-core/playwright, prettier — em `web/package.json`
- [ ] T005 [P] Inicializar o shadcn/ui em `web/components.json` (estilo padrão, cores por variáveis CSS, ícones lucide) e adicionar os componentes `button`, `card`, `switch`, `radio-group`, `dialog`, `separator` em `web/src/components/ui/`
- [ ] T006 [P] Configurar Prettier em `web/.prettierrc` e scripts `lint`, `format`, `test`, `e2e`, `build`, `build:demo` em `web/package.json`
- [ ] T007 [P] Configurar Vitest (jsdom, `fake-indexeddb/auto`, jest-dom) em `web/vitest.config.ts` e `web/tests/setup.ts`
- [ ] T008 [P] Configurar Playwright com projetos `Pixel 7` e `iPhone 14`, `baseURL` `http://localhost:3100` em `web/playwright.config.ts`
- [ ] T009 Criar `docker-compose.yml` na raiz com `db` (PostgreSQL, porta 5440), `redis` (porta 6390), `api` (porta 8100), `worker` (ARQ) e `web` (`next dev` na porta 3100 com `WATCHPACK_POLLING=true`), lendo o `.env`, com volumes nomeados para o banco
- [ ] T010 [P] Criar `api/Dockerfile` (uv, Python 3.14) e `web/Dockerfile.dev` (Node, `npm ci`, `next dev -p 3100`)
- [ ] T011 Criar `Makefile` na raiz com `dev`, `down`, `test` (vitest + pytest), `lint` (eslint + prettier --check + ruff), `e2e`, `build-demo`, `serve-demo` (porta 3200)
- [ ] T012 [P] Acrescentar ao `.gitignore` da raiz: `web/out/`, `web/.next/`, `web/playwright-report/`, `web/test-results/`, `web/public/sw.js`, `api/.venv/`, `.pytest_cache/`, `.ruff_cache/`

**Ponto de controle**: `make dev` sobe os cinco serviços sem erro.

---

## Fase 2: Fundação (bloqueia todas as histórias)

**Objetivo**: preferências, tokens, idiomas, catálogo de telas, contratos dos serviços e API mínima.

**⚠️ CRÍTICO**: nenhuma história começa antes desta fase.

### API mínima (RF-002, contracts/api.md)

- [ ] T013 [P] Escrever teste de `GET /api/health` (200 com `{"status":"ok","version":"0.1.0","checks":{"database":"ok","redis":"ok"}}`; 503 com `"status":"degraded"` quando uma verificação falha; sem detalhes internos na resposta) em `api/tests/test_health.py`
- [ ] T014 [P] Criar configuração com Pydantic Settings (`APP_ENV`, `DATABASE_URL`, `REDIS_URL`, `APP_VERSION="0.1.0"`) em `api/app/config.py`
- [ ] T015 [P] Criar engine e sessão assíncronas do SQLAlchemy em `api/app/db.py`
- [ ] T016 Criar a aplicação FastAPI com prefixo `/api`, `GET /api/health` (cada verificação com tempo limite de 2 s) e `/docs`/`/openapi.json` só com `APP_ENV=development` em `api/app/main.py`
- [ ] T017 [P] Inicializar Alembic com migração base vazia `0001_base` em `api/alembic/` e `api/alembic.ini`
- [ ] T018 [P] Criar o worker ARQ que só registra no log que subiu em `api/app/worker.py`
- [ ] T019 Configurar *rewrite* de `/api/:path*` para `API_INTERNAL_URL` apenas em desenvolvimento em `web/next.config.ts`

### Preferências, tema e idioma (base usada por todas as telas)

- [ ] T020 [P] Escrever testes de preferências (padrões `theme: "system"`, `highContrast: false`, `fontScale: 0`, `profile: null`; idioma inicial `en*`→`en`, `es*`→`es`, demais→`pt`; leitura tolerante a JSON inválido e a `localStorage` indisponível) em `web/tests/unit/preferences.test.ts`
- [ ] T021 Implementar o módulo de preferências (`DevicePreferences`: `profile` `resident|front-desk|manager|null`, `locale` `pt|en|es`, `theme` `light|dark|system`, `highContrast` booleano, `fontScale` `0|1|2|3`; chave `terreo:prefs`) com leitura, gravação e hook `usePreferences` em `web/src/preferences/`
- [ ] T022 Implementar o script inline anterior à pintura que aplica `data-theme`, `data-contrast` e `data-font` no `<html>` a partir de `terreo:prefs` e `prefers-color-scheme` em `web/src/preferences/no-flash-script.ts`
- [ ] T023 [P] Definir os tokens de cor da marca (`#1B4FD8` + branco) para as quatro aparências e a escala de letra (100%, 112,5%, 125%, 150%) em `web/src/theme/tokens.css`, importado por `web/app/globals.css`
- [ ] T024 [P] Criar os arquivos de mensagens com a estrutura de chaves (`common`, `nav`, `screens`, `settings`, `errors`, `profiles`) em `web/messages/pt.json`, `web/messages/en.json`, `web/messages/es.json`
- [ ] T025 Implementar o provider de idioma (next-intl no cliente, troca sem recarregar, `timeZone: "America/Sao_Paulo"`, `getMessageFallback` devolvendo o texto em português) em `web/src/i18n/IntlProvider.tsx`
- [ ] T026 Implementar o modo do app (`NEXT_PUBLIC_APP_MODE` = `dev|demo|real`, padrão `real`) em `web/src/config/app-mode.ts`

### Catálogo de telas e contratos de dados

- [ ] T027 Criar o catálogo único de telas por perfil (slug, perfil, grupo, ícone lucide, chave de título, se aparece na barra de baixo, em "Mais" ou em "Todos os serviços"), exatamente como em `contracts/rotas.md`, em `web/src/navigation/screens.ts`
- [ ] T028 [P] Criar os esquemas Zod de `Condominium`, `Apartment`, `Resident`, `Staff`, `ShiftAssignment` e `SeedMeta` com as regras do `data-model.md` (ex.: `name` "obrigatório, 2–120 caracteres"; `number` "único por condomínio"; `phone` "formato E.164 (`+55...`)"; `kind` `owner|tenant|family`; `role` `doorman|cleaner`; `weekday` "0 (domingo) a 6 (sábado)"; `startTime`/`endTime` `HH:mm`) em `web/src/services/schemas.ts`
- [ ] T029 [P] Criar as interfaces dos serviços, `ServiceContext`, `ServiceError` (`not_found|forbidden|validation|unavailable`) e `Services` conforme `contracts/servicos-dados.md` em `web/src/services/contracts.ts`
- [ ] T030 Montar o layout raiz com o script anti-piscar no `<head>`, providers (preferências, idioma, TanStack Query) e `lang` dinâmico em `web/app/layout.tsx`

**Ponto de controle**: `make test` verde (preferências e health); o app abre em branco com o tema aplicado.

---

## Fase 3: História 1 — Navegar pelo app como cada perfil (P1) 🎯 MVP

**Objetivo**: escolha de perfil, barra de baixo e todas as telas vazias dos três perfis.

**Teste independente**: escolher cada perfil, tocar em cada item da barra e de "Mais"/"Todos os serviços" e conferir
tela e título certos, com a barra visível.

### Testes da História 1

- [ ] T031 [P] [US1] Escrever teste unitário do catálogo (slugs únicos por perfil; quatro itens na barra de cada perfil, na ordem de `contracts/rotas.md`; toda tela com chave de título existente em `pt.json`) em `web/tests/unit/screens.test.ts`
- [ ] T032 [P] [US1] Escrever teste e2e de navegação (cenários H1-1 a H1-7: escolha de perfil, barra, troca sem recarregar, endereço direto, tela de outro perfil, página inexistente, perfil lembrado) em `web/tests/e2e/navigation.spec.ts`

### Implementação da História 1

- [ ] T033 [P] [US1] Criar `Header` (título, voltar nas telas internas, atalho de acessibilidade para `/settings`, sino para `notifications`; áreas de toque ≥ 44 × 44 px) em `web/src/components/layout/Header.tsx`
- [ ] T034 [P] [US1] Criar `BottomNav` (itens do catálogo, seção ativa pelo prefixo mais longo, `aria-current`) em `web/src/components/layout/BottomNav.tsx`
- [ ] T035 [P] [US1] Criar `EmptyScreen` (título da tela e mensagem "em construção" traduzida) em `web/src/components/layout/EmptyScreen.tsx`
- [ ] T036 [P] [US1] Criar `ScreenList` (lista agrupada usada por "Mais" e "Todos os serviços"; na portaria, botões ≥ 56 × 56 px com ícone e pouco texto) em `web/src/components/layout/ScreenList.tsx`
- [ ] T037 [US1] Criar a escolha de perfil (modos `dev`/`demo`) e "Entrada em breve" (modo `real`) em `web/app/page.tsx`
- [ ] T038 [US1] Criar `ProfileGuard` (sem perfil → `/`; perfil diferente → "Esta tela é de outro perfil" com "Voltar ao início"; modo `real` → "Entrada em breve") em `web/src/navigation/ProfileGuard.tsx`
- [ ] T039 [US1] Criar layout e início do morador, `services` (Todos os serviços) e rota `[screen]` com `generateStaticParams` a partir do catálogo em `web/app/resident/layout.tsx`, `web/app/resident/page.tsx`, `web/app/resident/[screen]/page.tsx`
- [ ] T040 [P] [US1] Criar layout, início, `more` e rota `[screen]` da portaria em `web/app/front-desk/layout.tsx`, `web/app/front-desk/page.tsx`, `web/app/front-desk/[screen]/page.tsx`
- [ ] T041 [P] [US1] Criar layout, painel, `more` e rota `[screen]` do síndico em `web/app/manager/layout.tsx`, `web/app/manager/page.tsx`, `web/app/manager/[screen]/page.tsx`
- [ ] T042 [US1] Criar a página "não existe" com botão para o início em `web/app/not-found.tsx`
- [ ] T043 [US1] Preencher em `web/messages/pt.json` os títulos de todas as telas do catálogo, perfis, navegação e mensagens de vazio, guarda e não encontrado
- [ ] T044 [US1] Criar a faixa "Demonstração" exibida em todas as telas no modo `demo` em `web/src/components/layout/DemoBadge.tsx` e incluí-la em `web/app/layout.tsx`

**Ponto de controle**: História 1 funcionando e testada sozinha em português.

---

## Fase 4: História 2 — Idioma e conforto visual (P2)

**Objetivo**: três idiomas trocáveis na hora, tema claro/escuro/seguir o celular, alto contraste independente, quatro
níveis de letra e VLibras.

**Teste independente**: trocar idioma, tema, contraste e letra e conferir todas as telas; reabrir e conferir que nada
pisca e que as escolhas foram mantidas.

### Testes da História 2

- [ ] T045 [P] [US2] Escrever teste que compara as chaves de `pt.json`, `en.json` e `es.json` e falha se alguma faltar ou sobrar (RF-014) em `web/tests/unit/messages.test.ts`
- [ ] T046 [P] [US2] Escrever teste de contraste dos pares texto/fundo dos tokens nas quatro aparências (≥ 4,5 sem alto contraste; ≥ 7 com alto contraste) em `web/tests/unit/contrast.test.ts`
- [ ] T047 [P] [US2] Escrever teste e2e (H2-1 a H2-6: idioma inicial pelo navegador, troca na hora, tema escuro, alto contraste, seguir o celular, letra no máximo sem rolagem lateral em 320 px, sem piscar ao recarregar) em `web/tests/e2e/preferences.spec.ts`
- [ ] T048 [P] [US2] Escrever auditoria axe em todas as telas de primeiro nível dos três perfis nas quatro aparências, falhando em violações `serious` ou `critical` (CS-006) em `web/tests/e2e/accessibility.spec.ts`

### Implementação da História 2

- [ ] T049 [US2] Criar a tela de ajustes (idioma, tema `light|dark|system`, interruptor de alto contraste, tamanho de letra 0–3, trocar perfil nos modos `dev`/`demo`) em `web/app/settings/page.tsx`
- [ ] T050 [US2] Fazer o modo "seguir o celular" reagir à mudança de `prefers-color-scheme` em tempo real em `web/src/preferences/useSystemTheme.ts`
- [ ] T051 [P] [US2] Traduzir todas as chaves para inglês em `web/messages/en.json`
- [ ] T052 [P] [US2] Traduzir todas as chaves para espanhol em `web/messages/es.json`, conferindo que textos mais longos não cortam a barra de baixo nem os botões
- [ ] T053 [US2] Incluir o widget VLibras (script oficial, carregado depois da interação inicial) em `web/src/components/accessibility/VLibras.tsx` e no `web/app/layout.tsx`
- [ ] T054 [US2] Revisar `Header`, `BottomNav`, `ScreenList` e `EmptyScreen` para usar só tokens de cor e `rem`, com nomes acessíveis e foco visível em `web/src/components/layout/`
- [ ] T055 [US2] Avisar que as preferências não serão lembradas quando o `localStorage` estiver indisponível em `web/src/preferences/StorageWarning.tsx`

**Ponto de controle**: Histórias 1 e 2 funcionando juntas; auditoria axe verde.

---

## Fase 5: História 3 — Instalar o app na tela inicial (P3)

**Objetivo**: PWA instalável com os ícones do kit, tela cheia, todas as telas sem internet e atualização automática.

**Teste independente**: instalar em Android e iPhone; abrir em modo avião telas nunca visitadas; publicar versão nova
e ver a troca na abertura seguinte.

### Testes da História 3

- [ ] T056 [P] [US3] Escrever teste e2e sobre o build servido (manifesto com `name: "Térreo"`, `theme_color: "#1B4FD8"`, ícones 192/512/maskable; service worker ativo; com a rede desligada, abrir telas nunca visitadas dos três perfis e ver o aviso de sem internet) em `web/tests/e2e/pwa.spec.ts`

### Implementação da História 3

- [ ] T057 [P] [US3] Copiar do kit da marca `favicon.ico`, `icon.svg` (de `terreo-favicon.svg`) e `apple-icon.png` (de `apple-touch-icon.png`) para `web/app/`, e `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` para `web/public/`
- [ ] T058 [P] [US3] Criar o manifesto conforme o `LEIA-ME.md` do kit (`display: "standalone"`, `background_color` e `theme_color` `#1B4FD8`) em `web/app/manifest.ts`
- [ ] T059 [US3] Escrever o service worker (precache da lista injetada, *stale-while-revalidate* para o resto, nova versão assume na abertura seguinte) em `web/sw.ts`
- [ ] T060 [US3] Criar o script de pós-build que roda o Serwist `injectManifest` sobre `web/out/` e gera `web/out/sw.js`, ligado aos scripts `build` e `build:demo` em `web/scripts/build-sw.mjs`
- [ ] T061 [US3] Registrar o service worker apenas fora do modo `dev` em `web/src/pwa/register-sw.ts`
- [ ] T062 [US3] Criar o aviso discreto de sem internet (eventos `online`/`offline`, some ao reconectar) em `web/src/components/layout/OfflineBanner.tsx` e incluí-lo em `web/app/layout.tsx`

**Ponto de controle**: build instalável; uso sem internet comprovado pelo teste.

---

## Fase 6: História 4 — Dados de exemplo do prédio (P4)

**Objetivo**: serviços locais sobre IndexedDB com os dados de exemplo do Taquaretinga, isolados por condomínio.

**Teste independente**: navegador limpo → dados criados; recarregar → sem duplicar; restaurar → recriados; consulta de
outro condomínio → nada.

### Testes da História 4

- [ ] T063 [P] [US4] Escrever testes dos serviços locais (dados criados uma vez; contagens 1 condomínio, 48 apartamentos, 5 funcionários, 3 apartamentos sem responsável; `getByNumber` inexistente → `not_found`; id de outro condomínio → `not_found`; `onDutyAt` às 07:00, 15:00 e 23:00 de Brasília devolve o porteiro do turno; `resetSeed` recria) em `web/tests/unit/services-local.test.ts`
- [ ] T064 [P] [US4] Escrever teste da implementação em memória usada quando o IndexedDB falha em `web/tests/unit/services-memory.test.ts`

### Implementação da História 4

- [ ] T065 [US4] Criar o módulo de dados de exemplo com versão (Edifício Taquaretinga, 12 andares, 4 por andar, apartamentos 101–1204; moradores fictícios em 45 apartamentos, de 1 a 4 por apartamento e um responsável cada; telefones `+55 21 90000-0000` a `+55 21 90000-9999`; 3 porteiros, um chefe, e 2 faxineiros; escala 06:00–14:00, 14:00–22:00, 22:00–06:00 com folgas alternadas; faxineiros 08:00–17:00 de segunda a sexta e 08:00–12:00 aos sábados) em `web/src/services/local/seed.ts`
- [ ] T066 [US4] Implementar o banco IndexedDB (lojas por entidade, índice por `condominiumId`, `SeedMeta`) e a criação dos dados de exemplo quando a versão gravada for diferente em `web/src/services/local/db.ts`
- [ ] T067 [US4] Implementar os serviços locais (`condominium`, `apartments`, `residents`, `staff` com `onDutyAt` no fuso de Brasília e turnos que passam da meia-noite, `schedule`, `dev`), validando retornos com Zod e filtrando por `condominiumId`, em `web/src/services/local/index.ts`
- [ ] T068 [P] [US4] Implementar os mesmos serviços em memória a partir do `seed.ts` em `web/src/services/memory/index.ts`
- [ ] T069 [US4] Implementar `getServices()` (local; memória se o IndexedDB falhar, com aviso) e o contexto do condomínio atual em `web/src/services/index.ts`
- [ ] T070 [US4] Criar os hooks TanStack Query (`useCondominium`, `useApartments`, `useResidents`, `useStaff`, `useOnDuty`, `useSchedule`) em `web/src/hooks/data.ts`

**Ponto de controle**: serviços testados; dados disponíveis para as telas da Etapa 2.

---

## Fase 7: História 5 — Painel de desenvolvimento (P5)

**Objetivo**: painel `/dev` só em `next dev`, lendo documentos, backlog e commits do repositório.

**Teste independente**: abrir `/dev` em desenvolvimento e conferir cada seção; gerar a demonstração e ver `/dev`
responder "não existe".

### Testes da História 5

- [ ] T071 [P] [US5] Escrever testes das funções do painel (cálculo de andamento a partir de um backlog de exemplo; validação de caminho recusando `..`, extensões diferentes de `.md` e pastas fora de `README.md`, `docs/`, `specs/`; leitura de `git log` vazia sem erro) em `web/tests/unit/dev-panel.test.ts`
- [ ] T072 [P] [US5] Escrever teste e2e no ambiente de desenvolvimento (seções Visão geral, Andamento, Backlog, Histórico, Commits, Documentos; documento renderizado com tabela) em `web/tests/e2e/dev-panel.spec.ts`

### Implementação da História 5

- [ ] T073 [US5] Configurar `pageExtensions` para incluir `dev.tsx` e `dev.ts` só quando `NODE_ENV === "development"` em `web/next.config.ts`
- [ ] T074 [P] [US5] Implementar as funções do servidor de desenvolvimento (listar `.md`, ler arquivo com caminho confinado, `git log -50` via `execFile` sem shell, andamento do backlog) em `web/src/dev/repo.ts`
- [ ] T075 [US5] Criar os route handlers `files`, `file`, `commits` e `progress` conforme `contracts/painel-dev.md` em `web/app/dev/api/files/route.dev.ts`, `web/app/dev/api/file/route.dev.ts`, `web/app/dev/api/commits/route.dev.ts`, `web/app/dev/api/progress/route.dev.ts`
- [ ] T076 [P] [US5] Criar o visualizador de Markdown (react-markdown + remark-gfm; em erro, texto bruto) em `web/src/dev/Markdown.tsx`
- [ ] T077 [US5] Criar o layout do painel com menu lateral (em português, RF-033) e a Visão geral (README, situação da API por `GET /api/health`, contagens dos dados locais, botão "Restaurar dados de exemplo" com confirmação) em `web/app/dev/layout.dev.tsx` e `web/app/dev/page.dev.tsx`
- [ ] T078 [P] [US5] Criar as páginas Andamento e Commits em `web/app/dev/progress/page.dev.tsx` e `web/app/dev/commits/page.dev.tsx`
- [ ] T079 [P] [US5] Criar as páginas Backlog, Histórico e Documentos (lista agrupada e leitura por `?path=`) em `web/app/dev/backlog/page.dev.tsx`, `web/app/dev/changelog/page.dev.tsx`, `web/app/dev/docs/page.dev.tsx`
- [ ] T080 [US5] Montar o volume do repositório (somente leitura) e o `git` no contêiner `web` para o painel ler `docs/`, `specs/` e o histórico em `docker-compose.yml` e `web/Dockerfile.dev`

**Ponto de controle**: todas as histórias funcionando de forma independente.

---

## Fase 8: Acabamento e itens transversais

- [ ] T081 [P] Escrever teste e2e sobre o build `demo` confirmando que `/dev` responde "não existe" e que a faixa "Demonstração" aparece (CS-008, RF-004a) em `web/tests/e2e/demo-build.spec.ts`
- [ ] T082 Configurar a publicação da demonstração no Cloudflare Pages (comando `npm run build:demo`, pasta `web/out`, variável `NEXT_PUBLIC_APP_MODE=demo`) e documentar os passos em `docs/documentacao/04-desenvolvimento.md`
- [ ] T083 [P] Atualizar `docs/documentacao/03-arquitetura.md` com as pastas reais de `web/` e `api/`, a exportação estática, a demonstração no Cloudflare Pages e as portas
- [ ] T084 [P] Atualizar `docs/documentacao/04-desenvolvimento.md` com `make dev`, `make test`, `make lint`, `make e2e`, `make build-demo` e `make serve-demo`
- [ ] T085 [P] Atualizar `CLAUDE.md` com os comandos reais de build, lint e testes (incluindo como rodar um único teste: `npx vitest run <arquivo>`, `npx playwright test <arquivo>`, `uv run pytest api/tests/<arquivo>::<teste>`)
- [ ] T086 [P] Atualizar `README.md` com "Como rodar" em poucos passos
- [ ] T087 Rodar `make lint`, `make test` e `make e2e` e corrigir o que falhar
- [ ] T088 Executar os 20 cenários de `specs/001-base-do-app/quickstart.md` e registrar o resultado
- [ ] T089 Marcar os itens concluídos da Etapa 1 em `docs/backlog.md`, registrar no `docs/changelog.md` e gerar o PDF com `uv run scripts/gerar_pdf.py`

---

## Dependências e ordem de execução

### Entre fases

- **Configuração (Fase 1)**: sem dependências.
- **Fundação (Fase 2)**: depende da Fase 1; bloqueia todas as histórias.
- **Histórias (Fases 3–7)**: dependem da Fase 2.
  - US1 (P1): nenhuma outra história.
  - US2 (P2): usa os componentes de layout da US1 (T033–T036) para traduzir e revisar; pode começar os testes e as
    traduções em paralelo com a US1.
  - US3 (P3): independente; os testes de uso sem internet usam as telas da US1.
  - US4 (P4): independente das outras histórias (só da Fase 2).
  - US5 (P5): independente; o botão de restaurar e as contagens usam a US4 (T069).
- **Acabamento (Fase 8)**: depois das histórias desejadas.

### Dentro de cada história

- Testes antes da implementação, e falhando primeiro.
- Componentes antes das páginas; serviços antes dos hooks.

### Oportunidades de paralelismo

- Fase 1: T003–T008, T010 e T012 em paralelo depois de T002.
- Fase 2: API (T013–T018) em paralelo com preferências e catálogo (T020–T029).
- US1: T033–T036 em paralelo; depois T040 e T041 em paralelo.
- US2: T045–T048 em paralelo; T051 e T052 em paralelo.
- US4 e US5 podem andar ao mesmo tempo que a US2 e a US3.

## Exemplo de paralelismo: História 1

```bash
# Testes juntos:
T031 web/tests/unit/screens.test.ts
T032 web/tests/e2e/navigation.spec.ts

# Componentes juntos:
T033 Header.tsx · T034 BottomNav.tsx · T035 EmptyScreen.tsx · T036 ScreenList.tsx
```

## Exemplo de paralelismo: História 4

```bash
T063 services-local.test.ts · T064 services-memory.test.ts
T068 services/memory/index.ts (depois de T065)
```

## Estratégia de implementação

### MVP primeiro (só a História 1)

1. Fase 1 e Fase 2.
2. Fase 3 (US1).
3. **Parar e validar**: cenários 1 a 5 do `quickstart.md`; mostrar ao síndico localmente.

### Entrega incremental

1. Fundação → US1 (navegação) → validar.
2. US2 (idiomas e acessibilidade) → validar com auditoria.
3. US3 (instalável e sem internet) → publicar a demonstração para o síndico.
4. US4 (dados de exemplo) → base para as telas da Etapa 2.
5. US5 (painel) → acompanhamento do projeto.
6. Fase 8 → documentação, PDF e encerramento da spec.

## Observações

- Commits pequenos por tarefa ou grupo lógico, no formato `<prefixo em inglês>: <descrição em português>`, sem coautor
  de IA, e só quando o desenvolvedor pedir.
- Ao fim de cada dia, `/encerrar-dia`.
