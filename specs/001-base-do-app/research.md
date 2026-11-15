# Pesquisa: Base do app

Decisões técnicas da spec 001. A stack geral está fixada na constituição 1.2.0 (princípio VI); aqui ficam as escolhas
de como usá-la nesta etapa. Versões: as estáveis atuais no momento da instalação, registradas no `plan.md` depois da
instalação.

## R1. Como o Next.js é entregue

- **Decisão**: exportação estática (`output: 'export'`). O resultado (`web/out/`) é um conjunto de arquivos servido pelo
  Caddy na VPS ou por qualquer hospedagem estática. Não há servidor Node em produção.
- **Por quê**: a constituição diz que o Next.js só renderiza telas e as regras ficam na API. Arquivos estáticos
  simplificam o uso sem internet (todas as telas podem ser guardadas no celular), a hospedagem da demonstração e a
  segurança (sem servidor de interface para atacar).
- **Consequência**: rotas dinâmicas precisam de `generateStaticParams` ou de parâmetros na consulta (`?id=`). As telas
  de detalhe das próximas etapas usam `?id=`.
- **Alternativas**: servidor Next.js (SSR) — mais uma peça em produção e cache sem internet mais difícil; Vite — fora
  da decisão da constituição.

## R2. Idiomas

- **Decisão**: next-intl **sem idioma no endereço**. Os três arquivos de mensagens (`web/messages/{pt,en,es}.json`) entram
  no pacote; o `NextIntlClientProvider` recebe o idioma das preferências do aparelho e troca na hora, sem recarregar.
  Idioma inicial: `navigator.language` (en*/es* → en/es; demais → pt).
- **Por quê**: com exportação estática e uso sem internet, idioma no endereço triplicaria as páginas e exigiria
  redirecionamento. As mensagens são pequenas.
- **Faltas**: `getMessageFallback` devolve o texto em português, nunca a chave (caso-limite da spec).
- **Verificação**: teste Vitest compara as chaves dos três arquivos e falha se alguma faltar (RF-014).
- **Datas**: `useFormatter` do next-intl com `timeZone: 'America/Sao_Paulo'` fixo (RF-013).
- **Alternativas**: i18next — funciona, mas next-intl é o padrão do Next.js e já foi escolhido na constituição.

## R3. Tema, alto contraste e tamanho de letra sem piscar

- **Decisão**: tokens de cor como variáveis CSS no `@theme` do Tailwind 4, sobrescritos por atributos na raiz:
  `data-theme="light|dark"`, `data-contrast="high"` e `data-font="0..3"`. Um script curto e inline no `<head>`
  (antes de qualquer CSS de componente) lê as preferências do `localStorage`, resolve "seguir o celular" com
  `matchMedia('(prefers-color-scheme: dark)')` e aplica os atributos antes da primeira pintura (RF-017).
- **Tamanho de letra**: `data-font` muda o `font-size` do `html` (100%, 112,5%, 125%, 150%); todo o layout usa `rem`
  (RF-016).
- **Contraste**: a paleta dos quatro modos é conferida por teste (relação de contraste dos pares texto/fundo dos
  tokens: ≥ 4,5 nos normais, ≥ 7 com alto contraste) e pela auditoria axe (RF-018, CS-006).
- **Alternativas**: `next-themes` — cobre claro/escuro, mas não o contraste e a letra combinados; escrever o script é
  mais simples do que adaptar.

## R4. Uso sem internet e atualização (PWA)

- **Decisão**: Serwist em modo *injectManifest* rodando **depois** do `next build`, sobre a pasta `web/out/`: o service
  worker guarda todas as páginas e recursos exportados na primeira abertura (RF-023) e usa *stale-while-revalidate* para
  o resto. Nova versão: o service worker novo é instalado em segundo plano e assume na abertura seguinte (RF-023a).
- **Manifesto**: `web/app/manifest.ts` como no `LEIA-ME.md` do kit (nome "Térreo", `#1B4FD8`, ícones 192, 512 e
  maskable 512). `favicon.ico`, `icon.svg` e `apple-icon.png` em `web/app/`.
- **Aviso sem internet**: componente que escuta `online`/`offline` (RF-023).
- **Alternativas**: `@serwist/next` (integração com o build do webpack, menos previsível com exportação estática);
  `next-pwa` (sem manutenção); service worker escrito à mão (sem lista de arquivos versionada).

## R5. Camada de dados local

- **Decisão**: interfaces de serviço em TypeScript (`web/src/services/contracts.ts`), esquemas Zod como fonte dos tipos,
  uma implementação local sobre IndexedDB (biblioteca `idb`) e consumo nas telas por TanStack Query. Uma *fábrica*
  (`getServices()`) escolhe a implementação; na Etapa 3 entra a implementação HTTP com a mesma interface (RF-024,
  RF-025).
- **Erros**: os serviços lançam `ServiceError` com códigos fixos (`not_found`, `forbidden`, `validation`,
  `unavailable`), os mesmos que a API devolverá.
- **Condomínio**: todo método recebe o contexto com `condominiumId`; a implementação local filtra por ele (RF-026).
- **Sem armazenamento** (modo anônimo, cota cheia): cai para uma implementação em memória e mostra o aviso da spec.
- **Dados de exemplo**: um único módulo (`web/src/services/local/seed.ts`) com versão; criados na primeira abertura se a
  versão gravada for diferente; restauráveis pelo painel (RF-027, RF-028a).
- **Alternativas**: `localStorage` (limite de 5 MB e síncrono; fotos virão depois); Dexie (mais recursos do que o
  necessário).

## R6. Escolha de perfil, demonstração e versão real

- **Decisão**: variável de build `NEXT_PUBLIC_APP_MODE` com `dev`, `demo` ou `real`.
  - `dev` e `demo`: a tela inicial `/` é a escolha de perfil; o perfil fica nas preferências do aparelho.
  - `demo`: faixa "Demonstração" em todas as telas (RF-004a).
  - `real`: `/` mostra "entrada em breve" até o login da Etapa 2; não há escolha de perfil (RF-004).
- **Guarda de perfil**: um layout por perfil confere o perfil escolhido; se for outro, mostra "tela de outro perfil"
  com o botão de voltar (RF-008).
- **Hospedagem da demonstração**: Cloudflare Pages, com o build `demo` publicado a partir do GitHub. Gratuito, HTTPS
  e a mesma conta Cloudflare do R2. A VPS ainda não existe; quando existir, a demonstração pode ir para lá sem mudar
  o código.

## R7. Painel de desenvolvimento só no ambiente local

- **Decisão**: as páginas e rotas do painel usam a extensão `.dev.tsx` / `.dev.ts`, e o `next.config.ts` só inclui
  essa extensão em `pageExtensions` quando `NODE_ENV === 'development'`. No build de demonstração e real, os arquivos
  não existem para o Next.js e `/dev` dá "não existe" (RF-029, CS-008).
- **Leitura de arquivos e commits**: *route handlers* de desenvolvimento leem `docs/`, `specs/`, `README.md` com `fs`
  (caminho confinado à raiz do repositório, sem `..`) e rodam `git log -50` com `execFile` (sem shell). Ver
  `contracts/painel-dev.md`.
- **Markdown**: `react-markdown` + `remark-gfm` (como no OnPath); em erro, mostra o texto bruto.
- **Andamento**: lido do `docs/backlog.md` — cada `## Etapa` é uma etapa; conta `- [x]` e `- [ ]`.
- **Situação da API**: o painel chama `GET /api/health`.

## R8. API mínima

- **Decisão**: projeto Python gerenciado com `uv` em `api/`: FastAPI, SQLAlchemy 2 assíncrono (asyncpg), Alembic com
  uma migração base vazia, ARQ com um worker que só registra que subiu, Pydantic Settings lendo o `.env`. Rota
  `GET /api/health` confere banco e Redis (RF-002). Ruff para lint e formatação, pytest para testes.
- **Por quê**: deixa o esqueleto pronto para a Etapa 3 sem criar regra de negócio antes da hora.

## R9. Ambiente local

- **Decisão**: `docker-compose.yml` na raiz com `db` (PostgreSQL), `redis`, `api`, `worker` e `web` (Next.js em modo
  de desenvolvimento, com *polling* de arquivos por causa do WSL). `Makefile` com `make dev`, `make test`, `make lint`,
  `make build-demo`. Em desenvolvimento, o Next.js repassa `/api/*` para a API (*rewrite*), simulando o Caddy.
- **Portas** (sem colidir com os outros projetos): web 3100, api 8100, PostgreSQL 5440, Redis 6390.
- **Segredos**: `.env.example` versionado com valores de desenvolvimento óbvios; `.env` real fora do git (RF-003).

## R10. Testes

- **Interface**: Vitest + Testing Library (serviços, preferências, chaves de tradução, contraste dos tokens);
  Playwright com perfis de celular (Pixel 7 e iPhone 14) para navegação, idioma, temas, uso sem internet e
  `@axe-core/playwright` nas quatro aparências.
- **API**: pytest com `httpx.AsyncClient` para `/api/health`.
- **Lint**: ESLint (configuração do Next.js) + Prettier; Ruff na API.
