---
description: "Lista de tarefas da spec 003 — Comunicação"
---

# Tarefas: Comunicação

**Entrada**: documentos de `specs/003-comunicacao/`

**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Testes**: obrigatórios pela constituição (princípio VII). Em cada história, os testes vêm antes da implementação e
devem falhar primeiro. Testes de serviço usam `web/tests/unit/auth-helpers.ts` (`setup()` com relógio controlado).
Todo texto novo nos três idiomas (RF-029); depois de criar rotas, `cd web && npx next typegen`.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[USn]**: história da spec (US1 = História 1 … US5 = História 5)
- Caminhos relativos à raiz do repositório

---

## Fase 1: Configuração

- [X] T001 Acrescentar a `web/src/navigation/screens.ts` os itens `notices` (ícone `Megaphone`, grupo `communication`) e `calendar` (ícone `CalendarDays`, grupo `communication`) no "Mais" da portaria; atualizar `web/tests/unit/screens.test.ts` (contracts/rotas.md). Os slugs continuam como telas vazias de `[screen]` até ganharem página: cada tarefa que cria a página (T018, T030, T037, T042) acrescenta o slug a `OWN_PAGES` de `web/app/{resident,front-desk,manager}/[screen]/page.tsx` no mesmo passo, para o build estático nunca ter rota repetida nem faltando
- [X] T002 [P] Ampliar `web/src/i18n/datetime.ts` com `startOfDayBrasilia(iso)`, `dayKeyBrasilia(iso)` (`AAAA-MM-DD`), `monthGridBrasilia(year, month)` (semanas de domingo a sábado), `addRecurrence(iso, recurrence, n)` (dia inexistente no mês cai no último dia) e `relativeDayGroup(iso, now)` → `today | yesterday | earlier`; testes em `web/tests/unit/datetime.test.ts` (research R5, caso-limite do dia 31)

---

## Fase 2: Fundação (bloqueia todas as histórias)

**⚠️ CRÍTICO**: nenhuma história começa antes desta fase.

### Esquemas, contratos e banco

- [X] T003 Acrescentar a `web/src/services/schemas.ts` os esquemas Zod de `Notice`, `NoticeRead`, `Poll`, `PollVote`, `PollSuggestion`, `Meeting`, `AgendaEvent`, `Notification` e `NotificationPrefs` exatamente como `data-model.md` (ex.: `title` 3–120, `body` 1–2.000, `kind` `water | elevator | power | meeting | general`, `options` 2 a 6 com `label` 1–80 sem repetir, `question` 5–200, `place` 2–120, `agenda` 1 a 15 itens de 2–200, `summary` até 5.000, `resolutionNote` até 500, `recurrence` `none | weekly | monthly | semiannual | yearly`, `durationMinutes` 15–1.440); `OutboxMessage.kind` passa a `otp | invite | group | private` e `toPhone` aceita nulo
- [X] T004 Acrescentar a `web/src/services/contracts.ts` as interfaces `NoticeService`, `PollService`, `MeetingService`, `AgendaService`, `NotificationService` e as visões `NoticeView`, `NoticeStats`, `PollView`, `MeetingView`, `AgendaItem`, `NotificationView` (contracts/servicos.md); incluir os serviços no tipo `Services`
- [X] T005 Subir `DB_VERSION` para 3 em `web/src/services/local/db.ts` criando as lojas `notices`, `noticeReads`, `polls`, `pollVotes`, `pollSuggestions`, `meetings`, `agendaEvents`, `notifications`, `notificationPrefs`, e registrar os índices em `INDEXES` de `web/src/services/base.ts` (`byCondominium`, `byNotice`, `byPerson`, `byPoll`); o repositório em memória (`web/src/services/memory/index.ts`) acompanha

### Permissões

- [X] T006 Escrever `web/tests/unit/permissions-003.test.ts` com uma asserção por célula de `contracts/permissoes.md` (responsável, outro morador com e sem `canVotePolls`, portaria, síndico, sem ator) para `notice.read`, `notice.confirm`, `notice.manage`, `poll.view`, `poll.vote` (comum e oficial), `poll.suggest`, `poll.manage`, `agenda.read`, `agenda.manage`, `notification.own` (CS-004)
- [X] T007 Implementar as ações novas em `can()`/`authorize()` de `web/src/services/permissions.ts`; `poll.vote` e `poll.suggest` recebem como alvo `{ official, apartmentId }` e conferem responsável e `canVotePolls` da residência ativa

### Despacho e tarefas com horário

- [X] T008 [P] Escrever `web/tests/unit/notify.test.ts`: público de morador = pessoas com residência ativa no condomínio; portaria só recebe tipos de aviso; preferência no app desligada não cria `Notification`; `emergency` ignora preferências e gera `private` para todos com celular; assunto geral com `toGroup` gera exatamente uma mensagem `group` e nenhuma `private` (RF-026, CS-006); `delivery`/`visitor` geram `private` só com `whatsapp` ligado; nada vaza para outro condomínio
- [X] T009 Implementar `notify(deps, repo, { type, audience: "residents" | "residents+staff" | { personIds }, title, body, target, toGroup })` em `web/src/services/notify.ts` (research R2); lê `NotificationPrefs` (ausente = tudo ligado); grava `Notification` e `OutboxMessage` (`group` com `toPhone` nulo)
- [X] T010 [P] Escrever `web/tests/unit/due.test.ts` com relógio controlado: aviso com `publishAt` futuro não aparece antes e é publicado (com `notify` e mensagem ao grupo) depois; rodar duas vezes não duplica nada; lembrete da véspera sai uma vez entre 00:00 e 23:59 (Brasília) do dia anterior a `referenceDate`; reunião ganha lembrete na véspera; enquete com `closesAt` vencido ganha `closedAt`, notificação `poll-closed` e mensagem ao grupo com o resultado (H3-8); lembrete da véspera vai ao grupo só se o aviso original foi (RF-009); depois que a data chega, o lembrete perdido não é mais enviado (CS-007)
- [X] T011 Implementar `runDue(deps, repo, condominiumId)` idempotente em `web/src/services/due.ts` (research R1), usando `reminderSentAt`/`publishedAt`/`closedAt` como marcas; os serviços das histórias chamam `runDue` no início das leituras

### Dados de exemplo v3 (base)

- [X] T011a Subir `SEED_VERSION` para 3 em `web/src/services/local/seed.ts` e fazer `buildSeed(now)` receber a data de referência (os chamadores passam `deps.now()`); dar `canVotePolls: true` ao familiar da conta `family` (mesmo apartamento da conta `responsible`), para existir quem sugere em enquete oficial (H3-5); renomear `web/tests/unit/seed-v2.test.ts` para `web/tests/unit/seed-v3.test.ts`, mantendo as asserções da v2 e conferindo a permissão nova. Cada história acrescenta ao seed o seu conteúdo (T019a, T025a, T030a, T037a, T042a), com asserções no `seed-v3.test.ts`

### Cabeçalho

- [X] T012 Ligar o `NotificationService` mínimo (`unreadCount`) em `web/src/services/notifications.ts` e o hook `useUnreadCount()` em `web/src/hooks/data.ts` (recarrega a cada 30 s e após mutações); `web/src/components/layout/Header.tsx` mostra a contagem no sino (até "9+") com `aria-label` "N notificações não lidas" (pt/en/es em `web/messages/*.json`) (research R7)

**Ponto de controle**: `npx vitest run` passa com permissões, `notify`, `runDue` e datas.

---

## Fase 3: História 1 — O síndico publica avisos e os moradores leem (P1) 🎯 MVP

**Objetivo**: síndico publica na hora; moradores e portaria leem; leitura registrada; mensagem ao grupo e notificação.

**Teste independente**: síndica publica; morador vê como não lido, abre e passa a lido; mensagem simulada do grupo no `/dev`.

### Testes

- [X] T013 [P] [US1] Escrever `web/tests/unit/notices.test.ts` (parte 1): `create` com `publishAt` nulo publica na hora, com `version` 1; título com 2 caracteres → `validation`; morador e portaria → `forbidden`; `list("all")` em ordem do mais novo; `list("unread")` e contador `unread`; `get` grava `NoticeRead` da versão atual; `sendToGroup` gera uma mensagem `group` com título e texto; cada morador e cada porteiro recebem `Notification` `notice` (RF-004); aviso de outro condomínio → `not_found`; aviso apagado some das listas
- [X] T014 [P] [US1] Escrever `web/tests/e2e/notices.spec.ts` (parte 1): `signInAs(page, "manager")` → Avisos → "Novo aviso" → tipo água, título, mensagem → Publicar → aviso no topo; `signInAs(page, "responsible")` → "Não lidos (N)" mostra o aviso com marca → abrir → detalhe com tipo, autor, data, "Enviado ao grupo do WhatsApp" → voltar e não está mais em "Não lidos"; portaria não vê "Novo aviso"

### Implementação

- [X] T015 [US1] Implementar em `web/src/services/notices.ts` `list`, `get` (marca lido), `create` (publicação na hora; `publishAt` no passado → `validation` com `details.publishAt = "past"`) e `remove`, com `authorize`, `runDue` e `notify` (tipo `notice`, público `residents+staff`, `toGroup = sendToGroup`); registrar em `web/src/services/core.ts`
- [X] T016 [P] [US1] Criar `web/src/components/notices/NoticeList.tsx` (abas "Todos" / "Não lidos (N)" e, para o síndico, "Agendados"; ícone por tipo; marca de não lido; data relativa; estado vazio com o sabiá) e `web/src/components/notices/NoticeDetail.tsx` (tipo, título, autor, data, texto, "Enviado ao grupo do WhatsApp"), com hooks `useNotices(filter)`, `useNotice(id)` em `web/src/hooks/data.ts`
- [X] T017 [P] [US1] Criar `web/src/components/notices/NoticeForm.tsx` (tipo em botões com ícone, título, mensagem com contador, "Enviar também no WhatsApp" ligado por padrão, Publicar) e a mutação `useCreateNotice`
- [X] T018 [US1] Criar páginas `web/app/resident/notices/page.tsx`, `web/app/resident/notice/page.tsx` (`?id=`), `web/app/front-desk/notices/page.tsx`, `web/app/front-desk/notice/page.tsx`, `web/app/manager/notices/page.tsx` (botão "Novo aviso"), `web/app/manager/notice/page.tsx`, `web/app/manager/notice/edit/page.tsx` (sem `id` = novo); tirar os slugs das telas vazias (T001); rodar `npx next typegen`
- [X] T019a [US1] Seed v3 — avisos: coleta seletiva (geral, lido por alguns apartamentos) e desligamento de energia (não lido pela conta `responsible`), relativos a `now`, com leituras e notificações `notice`; asserções em `web/tests/unit/seed-v3.test.ts`
- [X] T019 [US1] Textos de avisos (tipos, filtros, formulário, detalhe, erros) em `web/messages/{pt,en,es}.json`; o painel `/dev` (`web/src/dev/DevTools.tsx`) mostra mensagens `group` ("Grupo do condomínio") e `private` na caixa de saída

**Ponto de controle**: H1 funciona sozinha; `notices.test.ts` e `notices.spec.ts` (parte 1) passam.

---

## Fase 4: História 2 — Avisos importantes, agendados, editados e resolvidos (P2)

**Objetivo**: confirmação de leitura, "Lido por N de M", agendamento, lembrete da véspera, edição com versão, resolvido.

**Teste independente**: aviso importante com confirmação; dois apartamentos confirmam; "Lido por 2 de M"; aviso agendado aparece só na hora; edição volta a não lido; resolvido notifica.

### Testes

- [X] T020 [P] [US2] Ampliar `web/tests/unit/notices.test.ts` (parte 2): `confirm` grava `confirmedAt` (portaria → `forbidden`); `stats` com M = apartamentos com pessoa ativa (303/704/1102 fora), N = apartamentos com leitura da versão atual (duas pessoas do mesmo apartamento contam 1) (CS-005); `confirmations` e `pendingApartments`; agendado só em `list("scheduled")` do síndico e `not_found` para morador antes da hora; `update` de agendado não notifica; `update` de publicado sobe `version`, grava `editedAt`, zera leituras/confirmações da versão nova, notifica `notice-updated` e manda mensagem de correção ao grupo só se `sendToGroup`; `resolve` grava `resolvedAt`, nota até 500, notifica `notice-resolved` (moradores e portaria) e manda mensagem ao grupo só se `sendToGroup` (RF-008); `remindDayBefore` sem `referenceDate` → `validation`
- [X] T021 [P] [US2] Ampliar `web/tests/e2e/notices.spec.ts` (parte 2): síndica publica importante com confirmação → morador toca "Confirmar leitura" → "Lido ✓" → síndica vê "Lido por 1 de M apartamentos" e o nome na lista; síndica edita → morador vê "Editado às HH:MM" e de novo em "Não lidos"; síndica marca resolvido com nota → morador vê "Resolvido"

### Implementação

- [X] T022 [US2] Implementar em `web/src/services/notices.ts` `confirm`, `stats`, `update` (agendado: só troca; publicado: versão +1, research R3), `resolve`; `create` com `publishAt` futuro deixa `publishedAt` nulo; `runDue` (T011) publica agendados e manda lembretes da véspera (`notice-reminder`)
- [X] T023 [P] [US2] Ampliar `NoticeForm.tsx`: "Importante", "Pedir confirmação de leitura", "Publicar agora / Agendar" com data e hora (horário passado → aviso com botão "Publicar agora"), "Data do assunto" + "Lembrar na véspera"; modo edição carrega o aviso
- [X] T024 [P] [US2] Ampliar `NoticeDetail.tsx`: marca "Importante", botão "Confirmar leitura" / "Lido ✓" (não aparece para a portaria), "Editado às HH:MM", faixa "Resolvido" com nota; para o síndico: "Lido por N de M apartamentos" com barra, confirmados e pendentes, botões Editar, Marcar como resolvido (diálogo com nota), Apagar (confirmação)
- [X] T025a [US2] Seed v3 — falta d'água de amanhã (importante, confirmação, lembrete da véspera, enviado ao grupo, com algumas confirmações), elevador em manutenção de ontem (resolvido com nota) e um agendado para daqui a 2 dias; asserções em `seed-v3.test.ts`
- [X] T025 [US2] Lista destaca importantes e mostra "Agendado para …" na aba do síndico; textos novos em `web/messages/{pt,en,es}.json`

**Ponto de controle**: H1 e H2 passam juntas.

---

## Fase 5: História 3 — Enquetes (P3)

**Objetivo**: criar, votar com um toque, mudar voto, oficial com voto do responsável e sugestões, resultado parcial, encerramento.

**Teste independente**: enquete oficial; familiar do 804 sugere; responsável vê a sugestão e vota; muda o voto; síndica encerra; vencedora.

### Testes

- [X] T026 [P] [US3] Escrever `web/tests/unit/polls.test.ts`: `create` (só síndico; 2 a 6 opções, sem repetir; `closesAt` futuro; notifica `poll` só moradores e manda ao grupo); comum: cada pessoa com `canVotePolls` vota, sem permissão → `forbidden`, mudar voto substitui; oficial: só o responsável vota (um registro por apartamento), outro com permissão → `forbidden` em `vote` e ok em `suggest`, sem permissão → `forbidden` nos dois; `householdSuggestions` só para o responsável do mesmo apartamento; troca de responsável mantém o voto; apartamento sem responsável não vota e as sugestões ficam guardadas; `showPartial` falso → `votes`/`percent` nulos para morador até encerrar (síndico sempre vê); encerrada → `validation` `details.poll = "closed"`; vencedora e empate; portaria → `forbidden` em `list`
- [X] T027 [P] [US3] Escrever `web/tests/e2e/polls.spec.ts`: síndica cria enquete oficial com parcial; `signInAs(page, "family")` (familiar com permissão, T011a) vê "Sugerir ao responsável" e sugere; responsável vê "<nome da conta `family`> sugeriu: …" (nome de `ACCOUNTS.family.name` em `web/tests/e2e/helpers.ts`), vota com um toque, vê "Você votou em …" e porcentagens, toca "Mudar voto"; síndica encerra → "Encerradas" com a vencedora (CS-003)

### Implementação

- [X] T028 [US3] Implementar `web/src/services/polls.ts` (`list`, `get`, `vote`, `suggest`, `create`, `close`) com resultado calculado na leitura (research R4) e `runDue` encerrando vencidas; registrar em `web/src/services/core.ts`
- [X] T029 [P] [US3] Criar `web/src/components/polls/PollCard.tsx` (opções como botões grandes ≥ 44 px, barra de porcentagem, "Você votou em …", "Mudar voto", "Sugerir ao responsável", sugestões da casa, explicação para quem não pode votar, "Encerra em …", vencedora/"Empate") e `web/src/components/polls/PollForm.tsx` (pergunta, opções de 2 a 6 com adicionar/remover, data de encerramento, "Um voto por apartamento", "Mostrar resultado parcial")
- [X] T030a [US3] Seed v3 — enquete oficial aberta "Qual cor para a nova pintura da fachada?" (Cinza claro, Bege, Branco; resultado parcial; votos de alguns responsáveis, sem voto do apartamento da conta `responsible`) e duas encerradas (horário do portão; bicicletário); asserções em `seed-v3.test.ts`
- [X] T030 [US3] Criar `web/app/resident/polls/page.tsx` (Abertas / Encerradas), `web/app/manager/polls/page.tsx` (com "Encerrar agora") e `web/app/manager/poll/new/page.tsx`; hooks em `web/src/hooks/data.ts`; textos em `web/messages/{pt,en,es}.json`

**Ponto de controle**: H3 funciona sozinha sobre a fundação.

---

## Fase 6: História 4 — Agenda do prédio e reuniões do conselho (P4)

**Objetivo**: calendário do mês, "Próximos", reuniões com pauta e resumo, eventos que se repetem.

**Teste independente**: reunião daqui a 5 dias e evento semanal; marcas no calendário e ordem em "Próximos"; resumo da reunião passada.

### Testes

- [X] T031 [P] [US4] Escrever `web/tests/unit/meetings.test.ts`: `create`/`update`/`cancel` só síndico; `create` notifica `meeting` (moradores) e manda ao grupo; `update` notifica a mudança; `setSummary` antes de `startsAt` → `validation`, depois grava e notifica `meeting-summary`; `list` separa próximas e passadas
- [X] T032 [P] [US4] Escrever `web/tests/unit/agenda.test.ts`: `month` junta reuniões, eventos (com ocorrências expandidas de `weekly`, `monthly`, `semiannual`, `yearly`) e avisos com `referenceDate`, com chaves `AAAA-MM-DD` em Brasília; evento mensal no dia 31 aparece no dia 30 de novembro; cancelados somem; `upcoming(10)` em ordem a partir de agora; `createEvent` só síndico
- [X] T033 [P] [US4] Escrever `web/tests/e2e/agenda.spec.ts`: síndica cadastra reunião daqui a 5 dias com pauta → morador vê a marca no dia e o item em "Próximos" → toca no dia e vê a reunião → abre o detalhe; síndica registra resumo na reunião passada → morador vê "Resumo disponível"; navegação entre meses

### Implementação

- [X] T034 [US4] Implementar `web/src/services/meetings.ts` e `web/src/services/agenda.ts` (expansão de recorrência com `addRecurrence` de T002); `runDue` manda `meeting-reminder` na véspera; registrar em `web/src/services/core.ts`
- [X] T035 [P] [US4] Criar `web/src/components/agenda/MonthCalendar.tsx` (grade do mês com marcas, dia de hoje destacado, setas de mês, botões com rótulo acessível "17 de novembro, 2 eventos") e `web/src/components/agenda/UpcomingList.tsx` (data em bloco, tipo, marca da repetição "Toda semana", "Semestral" …)
- [X] T036 [P] [US4] Criar `web/src/components/meetings/MeetingDetail.tsx` (data, local, pauta numerada, resumo; síndico: "Registrar resumo" depois da data, Editar, Cancelar) e `web/src/components/meetings/MeetingForm.tsx` (data, hora, local, pauta com itens) e `web/src/components/agenda/EventForm.tsx` (título, manutenção/rotina, data e hora, duração, repetição)
- [X] T037a [US4] Seed v3 — reunião daqui a 5 dias (3 itens de pauta), reunião de 20 dias atrás com resumo, eventos coleta seletiva (toda terça, rotina), limpeza da caixa d'água (a cada 6 meses, manutenção) e recarga dos extintores (todo ano, manutenção); asserções em `seed-v3.test.ts`
- [X] T037 [US4] Criar páginas `web/app/resident/calendar/page.tsx`, `web/app/resident/meetings/page.tsx`, `web/app/resident/meeting/page.tsx`, `web/app/front-desk/calendar/page.tsx`, `web/app/manager/calendar/page.tsx`, `web/app/manager/meetings/page.tsx`, `web/app/manager/meeting/page.tsx`, `web/app/manager/meeting/edit/page.tsx`, `web/app/manager/event/new/page.tsx`; `npx next typegen`; textos em `web/messages/{pt,en,es}.json`

**Ponto de controle**: H4 funciona; agenda mostra avisos com data de H1/H2.

---

## Fase 7: História 5 — Notificações e preferências (P5)

**Objetivo**: central com grupos e "Ler todas"; "Como receber" por tipo e canal; emergência sempre.

**Teste independente**: contador no sino; central agrupada; "Ler todas" zera; desligar "Enquetes no app" e a próxima enquete não notifica, mas vai ao grupo.

### Testes

- [X] T038 [P] [US5] Escrever `web/tests/unit/notifications.test.ts`: `list` da pessoa (mais nova primeiro, nunca de outra pessoa); `markRead` só da própria (`not_found` para a de outro); `markAllRead`; `unreadCount`; `setPrefs` valida o esquema (sem `emergency`, sem WhatsApp para avisos/reuniões/enquetes) e vale para todos os aparelhos da pessoa; `notify` respeita as prefs gravadas
- [X] T039 [P] [US5] Escrever `web/tests/e2e/notifications.spec.ts`: morador com notificações do seed vê o número no sino → central com "Hoje"/"Ontem" → toca numa e vai ao aviso → "Ler todas" zera o sino; "Como receber": desliga "Enquetes no app", síndica cria enquete, morador não recebe notificação nova; emergência aparece "Sempre ativa"; avisos mostram "Pelo grupo do condomínio"

### Implementação

- [X] T040 [US5] Completar `web/src/services/notifications.ts` (`list`, `markRead`, `markAllRead`, `getPrefs`, `setPrefs`); registrar em `web/src/services/core.ts`
- [X] T041 [P] [US5] Criar `web/src/components/notifications/NotificationCenter.tsx` (grupos Hoje/Ontem/Antes, ícone por tipo, não lidas destacadas, "Ler todas", destino ao tocar; destino apagado → "Aviso não está mais disponível") e `web/src/components/notifications/NotificationPrefs.tsx` (interruptores por tipo no app; WhatsApp só para entregas e visitantes; "Pelo grupo do condomínio" para gerais; emergência travada "Sempre ativa")
- [X] T042a [US5] Seed v3 — notificações de hoje, de ontem e mais antigas para as contas de exemplo (algumas lidas), coerentes com os avisos, enquetes e reuniões do seed; asserções em `seed-v3.test.ts`
- [X] T042 [US5] Criar `web/app/{resident,front-desk,manager}/notifications/page.tsx` (abas Central / Como receber) e apontar o `notificationsHref` do cabeçalho de cada perfil para elas; `npx next typegen`; textos em `web/messages/{pt,en,es}.json`

**Ponto de controle**: as 5 histórias passam juntas.

---

## Fase 8: Acabamento e transversais

- [X] T043 Conferir o seed v3 completo contra `data-model.md` e RF-030 (todas as partes de T011a, T019a, T025a, T030a, T037a, T042a) e que "Restaurar dados de exemplo" no `/dev` recria tudo relativo ao dia
- [X] T044 [P] Início de cada perfil: o morador mostra os avisos não lidos e a próxima reunião; o síndico mostra atalhos "Novo aviso" e "Nova enquete" (`web/app/resident/page.tsx`, `web/app/manager/page.tsx`)
- [X] T045 [P] Acrescentar as telas novas a `web/tests/e2e/accessibility.spec.ts` (axe sem violações em avisos, detalhe, formulário, enquetes, agenda, reunião, central e preferências) e conferir alvos ≥ 44 px
- [X] T046 [P] Conferir `web/tests/unit/messages.test.ts` (chaves iguais nos três idiomas e parâmetros ICU) e ajustar `IGUAIS_EM_ESPANHOL` se preciso (RF-029)
- [X] T047 Rodar `npx vitest run`, `npm run lint`, `npx tsc --noEmit`, o e2e completo (`docker compose --profile e2e run --rm e2e npx playwright test --grep-invert @build`) `make e2e-build` (o build estático precisa gerar as rotas novas) e `make perf` (Lighthouse sem piorar nas telas novas)
- [X] T048 Documentação: `docs/documentacao/02-funcionalidades.md` (avisos, calendário, reuniões, enquetes, notificações → "Em construção"), `docs/documentacao/03-arquitetura.md` (`runDue`, `notify`, canais, lojas novas), `docs/backlog.md` (Etapa 3: testes pytest das regras de comunicação no back-end, `runDue` como tarefa do ARQ, confirmar leitura respondendo no WhatsApp) e `docs/changelog.md`
- [X] T049 Validar os 18 cenários de `specs/003-comunicacao/quickstart.md` no ambiente ligado (cobertos pelos testes automáticos: e2e de avisos, enquetes, agenda e notificações, `due.test.ts` para o agendamento com relógio e `messages.test.ts` para os idiomas; a conferência manual no celular fica no backlog)

---

## Dependências e ordem

- **Fase 1 → Fase 2 → histórias.** A fundação (esquemas, banco, permissões, `notify`, `runDue`, sino) bloqueia tudo.
- **US1** não depende de outra história. **US2** usa os avisos da US1. **US3**, **US4** e **US5** dependem só da
  fundação; a agenda (US4) mostra avisos com data quando a US2 existir; a central (US5) mostra o que as outras geram.
- **Seed v3**: a base (T011a) fica na Fundação; cada história acrescenta o seu conteúdo antes dos próprios testes e2e
  dependerem dele (T019a, T025a, T030a, T037a, T042a). T043 só confere o conjunto.
- **Fase 8** depois das histórias desejadas.

### Paralelo

- Fase 2: T008 e T010 (testes) juntos; T003→T004→T005 em sequência (mesmos tipos).
- Em cada história: os testes [P] juntos; os componentes [P] juntos depois do serviço.
- Com mais de uma pessoa: depois da Fase 2, US1+US2, US3, US4 e US5 em paralelo.

Exemplo (US3):

```text
T026 polls.test.ts  ‖  T027 polls.spec.ts
→ T028 polls.ts
→ T029 PollCard/PollForm  ‖  (páginas aguardam) → T030
```

## Estratégia

1. **MVP**: Fases 1, 2 e 3 (avisos publicados e lidos) — já substitui procurar aviso no grupo.
2. Incrementos: + US2 (importante, agendado, resolvido) → + US3 (enquetes) → + US4 (agenda e reuniões) → + US5
   (central e preferências) → Fase 8.
3. Cada incremento termina com os testes passando e a demonstração no ambiente ligado.
