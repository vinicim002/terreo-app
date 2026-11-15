# Plano de implementação: Base do app

**Branch**: `main` | **Data**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/001-base-do-app/spec.md` (com esclarecimentos de 2026-11-15)

## Resumo

Criar a fundação do Térreo: monorepo com `web/` (Next.js exportado como arquivos estáticos e instalável como PWA) e
`api/` (FastAPI mínima com verificação de saúde), ambiente local completo com `make dev`, navegação separada por perfil
com todas as telas vazias geradas de um catálogo único, três idiomas trocáveis na hora, tema claro/escuro com alto
contraste independente e tamanho de letra aplicados antes da pintura, uso sem internet de todas as telas, camada de
serviços tipados sobre IndexedDB com os dados de exemplo do Taquaretinga, painel de desenvolvimento que só existe em
`next dev` e build de demonstração publicável no Cloudflare Pages. Decisões em [research.md](research.md).

## Contexto técnico

**Linguagem/Versão**: TypeScript (interface), Python 3.14 (API); versões estáveis atuais na instalação

**Dependências principais**: Next.js (App Router, `output: 'export'` só no build), React, Tailwind CSS 4, shadcn/ui, lucide,
next-intl, TanStack Query, Zod, idb, Serwist, react-markdown + remark-gfm (painel); FastAPI, SQLAlchemy 2 (asyncpg),
Alembic, ARQ, Pydantic Settings

**Armazenamento**: IndexedDB no aparelho (dados de exemplo) e `localStorage` (preferências); PostgreSQL e Redis só
como esqueleto da API

**Testes**: Vitest + Testing Library; Playwright (Pixel 7, iPhone 14) + @axe-core/playwright; Lighthouse CI
(desempenho); pytest + httpx

**Plataforma alvo**: navegadores de celular (Chrome Android, Safari iOS 16.4+); VPS Linux com Docker no futuro;
Cloudflare Pages para a demonstração

**Tipo de projeto**: aplicação web (PWA) + API

**Metas de desempenho**: primeira tela em ≤ 3 s em 4G num celular intermediário e ≤ 1 s nas aberturas seguintes
(CS-005); troca de idioma/tema/letra em < 1 s (CS-003)

**Restrições**: sem internet depois da primeira abertura (todas as telas); largura mínima 320 px; toque ≥ 44 px
(portaria ≥ 56 px); contraste AA/AAA; nenhum segredo no repositório; painel ausente fora de `dev`

**Escala/Escopo**: 3 perfis, cerca de 75 telas vazias, 48 apartamentos de exemplo

## Verificação da constituição

*Portão: antes da Fase 0 e de novo depois da Fase 1.*

| Princípio | Como o plano cumpre | Situação |
|---|---|---|
| I. Português | Spec, plano, mensagens e comentários em português; rotas, código e tabelas em inglês; textos em arquivos de tradução; datas no fuso de Brasília (R2) | ✔ |
| II. Documentação | `docs/documentacao/03-arquitetura.md` (pastas `web/`, `api/`, comandos), `04-desenvolvimento.md` (como rodar e testar), `docs/backlog.md` e changelog atualizados nesta spec | ✔ |
| III. Segurança e dados | Dados de exemplo fictícios; `.env.example` sem segredos; painel e documentação da API só em desenvolvimento; rotas do painel confinadas à raiz do repositório e `git` sem shell; demonstração sem dados reais | ✔ |
| IV. Para qualquer pessoa | Toques ≥ 44/56 px, letra em 4 níveis, alto contraste, VLibras, PWA sem loja; auditoria axe | ✔ |
| V. WhatsApp junto | Sem envios nesta etapa; não se aplica ainda | ✔ (n/a) |
| VI. Stack combinada | Usa só a stack fixada. Acréscimos justificados abaixo: Cloudflare Pages (hospedagem da demonstração), Serwist e idb (bibliotecas pequenas) | ✔ com justificativa |
| VII. Pronto é verificado | Vitest, Playwright, pytest, isolamento por condomínio testado nos serviços, `quickstart.md` escrito antes | ✔ |
| Multi-condomínio | `condominiumId` em todas as entidades e filtro obrigatório nos serviços | ✔ |
| Front-end primeiro | Serviços tipados locais trocáveis pela implementação HTTP | ✔ |

**Pós-design (Fase 1)**: reavaliado depois de `data-model.md` e `contracts/`; nenhuma violação nova.

## Estrutura do projeto

### Documentação (esta funcionalidade)

```text
specs/001-base-do-app/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── rotas.md
│   ├── servicos-dados.md
│   ├── api.md
│   └── painel-dev.md
├── checklists/requirements.md
└── tasks.md              # gerado por /speckit-tasks
```

### Código (raiz do repositório)

```text
docker-compose.yml        # db, redis, api, worker, web
Makefile                  # dev, test, lint, e2e, build-demo, serve-demo
.env.example

web/
├── app/
│   ├── layout.tsx                 # script anterior à pintura, providers, VLibras, aviso sem internet, faixa demo
│   ├── manifest.ts                # PWA (kit da marca)
│   ├── favicon.ico, icon.svg, apple-icon.png
│   ├── page.tsx                   # escolha de perfil / entrada em breve
│   ├── settings/page.tsx
│   ├── not-found.tsx
│   ├── resident/  front-desk/  manager/
│   │   ├── layout.tsx             # guarda de perfil, cabeçalho, barra de baixo
│   │   └── [screen]/page.tsx      # telas vazias geradas do catálogo (generateStaticParams)
│   └── dev/                       # *.dev.tsx e api/*.dev.ts — só em next dev
├── messages/{pt,en,es}.json
├── public/                        # icon-192.png, icon-512.png, icon-maskable-512.png
├── src/
│   ├── navigation/screens.ts      # catálogo único de telas
│   ├── preferences/               # leitura/gravação, script inline, hooks
│   ├── theme/tokens.css           # 4 aparências e escala de letra
│   ├── i18n/                      # provider, fallback para pt, fuso
│   ├── services/
│   │   ├── contracts.ts           # interfaces + ServiceError
│   │   ├── schemas.ts             # Zod
│   │   ├── local/                 # IndexedDB + seed.ts
│   │   ├── memory/                # fallback sem armazenamento
│   │   └── index.ts               # getServices()
│   ├── hooks/                     # TanStack Query
│   └── components/                # shadcn/ui e layout (Header, BottomNav, EmptyScreen, OfflineBanner, DemoBadge)
├── sw.ts                          # service worker (Serwist injectManifest sobre out/)
└── tests/
    ├── unit/                      # Vitest
    └── e2e/                       # Playwright

api/
├── pyproject.toml                 # uv
├── alembic/ (migração base vazia)
├── app/
│   ├── main.py                    # FastAPI, /api/health
│   ├── config.py                  # Pydantic Settings
│   ├── db.py
│   └── worker.py                  # ARQ
└── tests/
```

**Decisão de estrutura**: monorepo com `web/` e `api/` (constituição VI). Uma rota dinâmica `[screen]` por perfil,
alimentada pelo catálogo `screens.ts`, evita cerca de 75 arquivos de página vazios; telas com conteúdo próprio nas
próximas etapas ganham pasta própria, que tem prioridade sobre `[screen]`.

## Mudanças em `docs/`

- `03-arquitetura.md`: pastas reais de `web/` e `api/`, exportação estática, demonstração no Cloudflare Pages, portas.
- `04-desenvolvimento.md`: `make dev`, `make test`, `make lint`, `make e2e`, `make build-demo`.
- `02-funcionalidades.md`: sem mudança de situação (todas continuam "Planejada"; só ganham tela vazia).
- `docs/backlog.md`: itens da Etapa 1 marcados conforme concluídos; `CLAUDE.md`: comandos reais.

## Acompanhamento de complexidade

| Acréscimo | Por que é necessário | Alternativa mais simples rejeitada porque |
|---|---|---|
| Cloudflare Pages (serviço novo) | Hospedar a demonstração com HTTPS (exigido para instalar o PWA) antes de existir a VPS | VPS ainda não contratada; túnel local não serve para o síndico abrir quando quiser |
| Serwist | Lista versionada de todos os arquivos para uso sem internet e atualização controlada | Service worker escrito à mão teria de reimplementar a lista de arquivos e a troca de versão |
| idb | IndexedDB com promessas, ~1 kB | `localStorage` é síncrono e limitado a ~5 MB, insuficiente para as fotos das próximas etapas |
