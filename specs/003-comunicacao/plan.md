# Plano de implementação: Comunicação

**Branch**: `main` | **Data**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/003-comunicacao/spec.md` (com esclarecimentos de 2026-11-17)

## Resumo

Avisos, enquetes, agenda, reuniões e notificações, com dados no aparelho, sobre a base das specs 001 e 002. Tudo o que
depende de horário (publicação agendada, lembretes da véspera, encerramento de enquetes) é aplicado por um `runDue`
idempotente com relógio injetável. Um único `notify` decide quem recebe o quê e por qual canal (app, grupo do WhatsApp,
privado), respeitando as preferências e a regra de que assuntos gerais vão só ao grupo. Leituras de aviso guardam a
versão, para a edição "zerar" sem apagar o histórico. Enquetes oficiais têm voto do responsável e sugestões da casa.
Decisões em [research.md](research.md).

## Contexto técnico

**Linguagem/Versão**: TypeScript (interface); a API não muda nesta spec

**Dependências principais**: as das specs 001 e 002; **nenhuma nova**

**Armazenamento**: IndexedDB — lojas novas: avisos, leituras, enquetes, votos, sugestões, reuniões, eventos,
notificações, preferências de notificação (banco versão 3)

**Testes**: Vitest (serviços, `runDue` com relógio controlado, permissões, contagens, canais, recorrência); Playwright
(fluxos das 5 histórias em Pixel 7 e iPhone 14) + axe nas telas novas

**Plataforma alvo / Tipo de projeto**: os mesmos das specs anteriores (PWA)

**Metas**: CS-001 a CS-007 (tempos de tarefa, contagens e permissões); telas novas sem piorar o Lighthouse

**Restrições**: só o síndico publica; assuntos gerais nunca no privado; emergência ignora preferências; textos nos três
idiomas; datas no fuso de Brasília

**Escala/Escopo**: ~20 telas novas; até 48 apartamentos e ~150 pessoas; dezenas de avisos e notificações por pessoa

## Verificação da constituição

| Princípio | Como o plano cumpre | Situação |
|---|---|---|
| I. Português | Interface traduzida (pt/en/es); conteúdo dos avisos é do condomínio; datas em Brasília | ✔ |
| II. Documentação | `02-funcionalidades.md` (avisos, calendário, reuniões, enquetes, notificações → "Em construção"), `03-arquitetura.md` (`runDue`, `notify`, canais), backlog e changelog | ✔ |
| III. Segurança e dados | Permissões nos serviços (matriz ampliada); entregas e códigos nunca no grupo (regra de canais); sugestões visíveis só ao responsável da casa; portaria sem enquetes | ✔ |
| IV. Para qualquer pessoa | Votar em até 2 toques; sino com rótulo acessível; axe nas telas novas; botões ≥ 44 px | ✔ |
| V. WhatsApp junto | Avisos, reuniões e enquetes vão ao grupo (simulado); emergência sempre a todos; preferências só para o privado pessoal | ✔ |
| VI. Stack combinada | Nenhuma dependência nova; agenda e datas com `Intl` | ✔ |
| VII. Pronto é verificado | Testes de cada regra (permissões, `runDue`, canais, contagens, votos); `quickstart.md` antes do código | ✔ |
| Restrições | Multi-condomínio em todas as entidades; front-end primeiro; unidade = apartamento (voto oficial) | ✔ |

**Pós-design (Fase 1)**: reavaliado depois de `data-model.md` e `contracts/`; nenhuma violação.

## Estrutura do projeto

### Documentação (esta funcionalidade)

```text
specs/003-comunicacao/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/  servicos.md · permissoes.md · rotas.md
├── checklists/requirements.md
└── tasks.md        # /speckit-tasks
```

### Código (mudanças em `web/`)

```text
web/
├── app/
│   ├── resident/  notices/ · notice/ · polls/ · calendar/ · meetings/ · meeting/ · notifications/
│   ├── front-desk/  notices/ · notice/ · calendar/ · notifications/
│   └── manager/  notices/ · notice/ · notice/edit/ · polls/ · poll/new/ · meetings/ · meeting/ · meeting/edit/ ·
│                 calendar/ · event/new/ · notifications/
├── messages/{pt,en,es}.json
├── src/
│   ├── services/
│   │   ├── schemas.ts · contracts.ts · permissions.ts   # entidades, interfaces e ações novas
│   │   ├── due.ts            # runDue (research R1)
│   │   ├── notify.ts         # despacho e canais (research R2)
│   │   ├── notices.ts · polls.ts · meetings.ts · agenda.ts · notifications.ts
│   │   └── local/seed.ts · local/db.ts                  # SEED_VERSION 3, banco v3
│   ├── i18n/datetime.ts      # dia/mês em Brasília, formatos relativos (hoje, ontem)
│   ├── navigation/screens.ts # avisos e agenda no "Mais" da portaria
│   └── components/  notices/ · polls/ · agenda/ · meetings/ · notifications/ · layout/Header (sino com contagem)
└── tests/
    ├── unit/  notices · polls · meetings · agenda · notifications · due · permissions-003 · seed-v3
    └── e2e/   notices · polls · agenda · notifications
```

**Decisão de estrutura**: segue as specs anteriores — um módulo de serviço por área, `notify` e `runDue` centrais,
permissões na mesma matriz. Os componentes de avisos e enquetes são compartilhados entre morador, portaria e síndico,
com o que muda por papel vindo do serviço (ex.: `me.canVote`, estatísticas só para o síndico).

## Mudanças em `docs/`

- `02-funcionalidades.md`: avisos, calendário, reuniões, enquetes e notificações → "Em construção".
- `03-arquitetura.md`: `runDue` (tarefas com horário sem servidor), `notify` (canais e preferências), pastas novas.
- `docs/backlog.md` e `docs/changelog.md`.

## Acompanhamento de complexidade

Sem violações a justificar: nenhuma dependência, serviço ou camada nova; o `runDue` no aparelho já está previsto nas
Premissas da spec e é substituído pela fila do ARQ na Etapa 3.
