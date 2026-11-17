# Plano de implementação: Portaria

**Branch**: `main` | **Data**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/004-portaria/spec.md` (com esclarecimentos de 2026-11-17)

## Resumo

Entregas e códigos, correspondência, visitantes, modo viagem, equipe de plantão, ditar e achados e perdidos, com dados
no aparelho, sobre as specs 001 a 003. Uma entidade `Delivery` com estados cobre código, encomenda sem código e
correspondência. O `runDue` da spec 003 ganha os lembretes de encomenda parada, códigos que não chegaram e visitantes
que não vieram. `notify` ganha a categoria "só no app" para recados e achados; entregas seguem o esclarecimento 1 e
nunca vão ao grupo. O código por WhatsApp (constituição V) é reconhecido por uma função pura, testada, chamada hoje pela
simulação no `/dev` e, na Etapa 3, pelo webhook. Ditar usa o reconhecimento de fala do aparelho. Decisões em
[research.md](research.md).

## Contexto técnico

**Linguagem/Versão**: TypeScript (interface); a API não muda nesta spec

**Dependências principais**: as das specs anteriores; **nenhuma nova** (reconhecimento de fala e câmera do navegador)

**Armazenamento**: IndexedDB — lojas novas: entregas, visitantes, modo viagem, recados, achados e perdidos, mensagens
recebidas (banco versão 4)

**Testes**: Vitest (serviços, estados, `runDue` com relógio, permissões, reconhecimento das mensagens, plantão);
Playwright (fluxos das 6 histórias em Pixel 7 e iPhone 14, ditar com reconhecimento simulado, câmera com arquivo de
teste) + axe nas telas novas

**Plataforma alvo / Tipo de projeto**: os mesmos das specs anteriores (PWA)

**Metas**: CS-001 a CS-007; botões da portaria ≥ 56 px; telas novas sem piorar o Lighthouse

**Restrições**: entregas e códigos nunca no grupo; sem documento de visitante; portaria vê só o necessário; textos nos
três idiomas; datas no fuso de Brasília

**Escala/Escopo**: ~18 telas novas; 48 apartamentos; dezenas de entregas por dia

## Verificação da constituição

| Princípio | Como o plano cumpre | Situação |
|---|---|---|
| I. Português | Interface pt/en/es; ditar no idioma escolhido; datas em Brasília | ✔ |
| II. Documentação | `02-funcionalidades.md` (Portaria → "Em construção"), `03-arquitetura.md` (entregas, mensagens recebidas, ditar), backlog e changelog | ✔ |
| III. Segurança e dados | Entregas e códigos só no privado/app (teste CS-004); sem documento de visitante (RF-014); síndico não vê entregas dos apartamentos; matriz conferida nos serviços (CS-005) | ✔ |
| IV. Para qualquer pessoa | Portaria com 5 botões grandes (≥ 56 px), ícones e voz em todo campo de texto; axe nas telas novas | ✔ |
| V. WhatsApp junto | Código de entrega também por mensagem (reconhecedor testado, simulado agora); aviso de chegada no privado | ✔ |
| VI. Stack combinada | Nenhuma dependência nova | ✔ |
| VII. Pronto é verificado | Testes de cada regra; `quickstart.md` antes do código; pytest das regras na Etapa 3 (backlog), como nas specs 002 e 003 | ✔ |
| Restrições | Multi-condomínio em todas as entidades; unidade = apartamento; front-end primeiro | ✔ |

**Pós-design (Fase 1)**: reavaliado depois de `data-model.md` e `contracts/`; nenhuma violação.

## Estrutura do projeto

### Documentação (esta funcionalidade)

```text
specs/004-portaria/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/  servicos.md · permissoes.md · rotas.md
├── checklists/requirements.md
└── tasks.md        # /speckit-tasks
```

### Código (mudanças em `web/`)

```text
web/
├── app/
│   ├── resident/  deliveries/ · delivery/new/ · visitors/ · visitor/new/ · travel-mode/ · on-duty/ · lost-and-found/
│   ├── front-desk/  page.tsx (início) · deliveries/ · apartment/ · receive-delivery/ · mail/ · visitors/ · dictate/ ·
│   │                lost-and-found/ · on-duty/ · travel-watch/
│   └── manager/  memos/
├── messages/{pt,en,es}.json
├── src/
│   ├── services/
│   │   ├── schemas.ts · contracts.ts · permissions.ts · notify.ts (appOnly) · due.ts (novas tarefas)
│   │   ├── deliveries.ts · visitors.ts · travel.ts · desk.ts · memos.ts · lostfound.ts · inbox.ts
│   │   ├── parse-delivery.ts     # reconhecimento das mensagens (research R3)
│   │   ├── legacy.ts             # staff.board (research R6)
│   │   └── local/seed-front-desk.ts · local/seed.ts · local/db.ts   # SEED_VERSION 4, banco v4
│   ├── voice/  DictateButton.tsx · speech.ts       # research R5
│   ├── photo/resize.ts           # tamanho máximo configurável (research R4)
│   ├── components/  deliveries/ · visitors/ · desk/ · lostfound/ · staff/ · memos/
│   └── dev/DevTools.tsx          # simular mensagem recebida
└── tests/
    ├── unit/  deliveries · visitors · travel · desk · memos · lostfound · parse-delivery · inbox · staff-board ·
    │          permissions-004 · due-004 · seed-v4
    └── e2e/   deliveries · front-desk · visitors · dictate · lostfound · on-duty
```

**Decisão de estrutura**: segue as specs anteriores — um módulo de serviço por área, regras centrais em `notify` e
`runDue`, permissões na mesma matriz. A portaria usa componentes próprios (botões grandes) e reaproveita a consulta de
moradores da spec 002 no painel do apartamento.

## Mudanças em `docs/`

- `02-funcionalidades.md`: Portaria (entregas e códigos, correspondência, visitantes, modo viagem, plantão, voz, achados
  e perdidos) → "Em construção".
- `03-arquitetura.md`: entregas e estados, mensagens recebidas do WhatsApp, ditar, pastas novas.
- `docs/backlog.md` e `docs/changelog.md`.

## Acompanhamento de complexidade

Sem violações a justificar: nenhuma dependência nova; o reconhecimento de mensagens e o `runDue` no aparelho são
substituídos pelo webhook e pela fila do ARQ na Etapa 3, com a mesma lógica.
