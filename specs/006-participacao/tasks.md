---
description: "Lista de tarefas da spec 006 — Participação"
---

# Tarefas: Participação

**Entrada**: documentos de `specs/006-participacao/`

**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Testes**: obrigatórios pela constituição (princípio VII). Em cada história, os testes vêm antes da implementação e
devem falhar primeiro. Testes de serviço usam `web/tests/unit/comm-helpers.ts` (`commSetup()` com relógio controlado
e as contas de exemplo). Todo texto novo nos três idiomas (RF-024); depois de criar rotas, `cd web && npx next
typegen`. Páginas do morador e do síndico entram em `OWN_PAGES` de `web/app/<perfil>/[screen]/page.tsx`; a portaria
não tem rota genérica (cada tela tem página própria, conferido por `screens.test.ts`). Nos e2e, trocar de conta na
mesma aba com `switchTo`.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[USn]**: história da spec (US1 = História 1 … US6 = História 6)
- Caminhos relativos à raiz do repositório

---

## Fase 1: Configuração

- [ ] T001 Acrescentar ao catálogo em `web/src/navigation/screens.ts`: portaria `improvements` (`Hammer`, grupo `building`), `report-issue` (`Wrench`, `actions`), `providers` (`Handshake`, `building`), `local-shops` (`Store`, `building`); síndico `providers` (`Handshake`, `info`); atualizar `web/tests/unit/screens.test.ts` (contracts/rotas.md)
- [ ] T002 [P] Criar `web/src/photo/PhotosField.tsx` (de 0 a N fotos, reduzidas com `resizePhoto(file, { max: 1024, quality: 0.7 })`, miniaturas com "remover", botão de câmera) a partir do `PhotoField` da spec 004, e `web/src/components/forms/Stars.tsx` (nota de 1 a 5 com botões grandes de rádio, acessível)

---

## Fase 2: Fundação (bloqueia todas as histórias)

**⚠️ CRÍTICO**: nenhuma história começa antes desta fase.

### Esquemas, contratos e banco

- [ ] T003 Acrescentar a `web/src/services/schemas.ts` os esquemas `Suggestion`, `SuggestionVote`, `Improvement`, `Issue`, `IssueSupport`, `NoiseReport` (**sem campo de autor**), `Listing`, `Recommendation` e `SurveyResponse` exatamente como `data-model.md` (ex.: título 5–80, descrição 10–1.000, resposta até 500; `progress` 0–100 só em `in-progress`; `month` `AAAA-MM`; `cost` em centavos ≥ 0; problema 5–500 com 0–3 fotos e atualização até 300; nome 2–60, observação até 120, nota 1–5 só em prestador, comentário até 300; período `AAAA-Qn`, notas 1–5, comentário até 500); `Notification.type` ganha `suggestion-status`, `suggestion-approved`, `improvement-done`, `issue-new`, `issue-update`, `noise`, `listing-removed` e `target.kind` ganha `suggestion`, `improvement`, `issue`, `noise`, `listing`
- [ ] T004 Acrescentar a `web/src/services/contracts.ts` as interfaces de `contracts/servicos.md` (`SuggestionService`, `ImprovementService`, `IssueService`, `NoiseService`, `ListingService`, `SurveyService`) e incluí-las em `Services`
- [ ] T005 Subir `DB_VERSION` para 6 em `web/src/services/local/db.ts` com as lojas `suggestions`, `suggestionVotes` (`bySuggestion`), `improvements`, `issues`, `issueSupports` (`byIssue`), `noiseReports`, `listings`, `recommendations` (`byListing`), `surveyResponses` (`byPerson`), todas com `byCondominium`, em `web/src/services/base.ts`; `SEED_VERSION` 6 com `buildParticipationSeed(base, now)` vazio em `web/src/services/local/seed-participation.ts`; renomear `web/tests/unit/seed-v5.test.ts` para `seed-v6.test.ts`

### Permissões e canais

- [ ] T006 [P] Escrever `web/tests/unit/permissions-006.test.ts` com cada linha de `contracts/permissoes.md` (CS-006), incluindo `suggestion.editOwn` com `createdById` e sem ator `forbidden`
- [ ] T007 Implementar as ações em `web/src/services/permissions.ts` até o T006 passar
- [ ] T008 [P] Ampliar `web/tests/unit/notify.test.ts` (RF-023, research R7): `suggestion-status` e `issue-update` aparecem no app conforme a preferência "Avisos" (`notices`) e não vão ao WhatsApp; `suggestion-approved`, `improvement-done`, `issue-new`, `noise`, `listing-removed` ficam só no app, sempre (`APP_ONLY`); nada vai ao grupo
- [ ] T009 Implementar os tipos novos em `web/src/services/notify.ts` (`prefKeyOf` e `APP_ONLY`) até o T008 passar
- [ ] T010 [P] Criar `web/src/services/participation-shared.ts`: `quarterOf(date)` (`AAAA-Qn` em Brasília), `previousQuarter`, `quarterEnd`, rótulo de quem indicou ("Apto 804", "Portaria", "Síndico"); testes em `web/tests/unit/participation-shared.test.ts`

**Ponto de controle**: fundação pronta.

---

## Fase 3: História 1 — Sugestões que viram melhorias (P1) 🎯 MVP

**Objetivo**: publicar, votar, abas, situação com resposta, aprovar cria melhoria e avisa os "gostei".

**Teste independente**: o 804 publica; o familiar e outro morador dão "gostei"; o síndico aprova; aparece em Melhorias
e quem gostou é avisado.

### Testes

- [ ] T011 [P] [US1] Escrever `web/tests/unit/suggestions.test.ts`: `create` valida campos e grava "received"; sugestão sem apartamento mostra `apartment: null` e `authorName: null` aos vizinhos e o apartamento e o nome ao síndico (esclarecimento 4); `vote` um por pessoa, mesmo valor tira, outro troca; `agreePercent`; abas `top` (mais "up"), `recent`, `mine`; `update`/`remove` só autor e só "received"; `setStatus` só síndico, avisa quem sugeriu (`suggestion-status`); `approved` cria `Improvement` "planned" com `suggestionId`, grava `improvementId`, avisa os "up" (`suggestion-approved`) e é idempotente; portaria `forbidden`
- [ ] T012 [P] [US1] Escrever `web/tests/e2e/suggestions.spec.ts`: 804 publica "Bicicletário na garagem" sem mostrar o apto → familiar vê "Morador" e dá "gostei" → síndico vê "Apto 804", aprova com resposta → Melhorias mostra "Bicicletário na garagem" planejada com a origem → familiar tem a notificação

### Implementação

- [ ] T013 [US1] Implementar `web/src/services/suggestions.ts` (cria a melhoria por `createImprovementFromSuggestion` exportado de `improvements.ts`, que nesta fase só grava a melhoria); registrar em `web/src/services/core.ts`
- [ ] T014 [P] [US1] Criar `web/src/components/suggestions/SuggestionsScreen.tsx` (mockup 10: abas, cartões com título, resumo, "Apto N · há X" ou "Morador", situação, botões de "gostei"/"não gostei" com contagem, barra e "N% concordam", botão "+") e `SuggestionForm.tsx` (mockup 11: título, descrição com `DictateButton`, categorias em botões, `PhotosField` com 1 foto, "Publicar sem mostrar meu apto", aviso "Todos os moradores poderão ver e votar")
- [ ] T015 [P] [US1] Criar `web/src/components/suggestions/SuggestionDetail.tsx` (texto completo, foto, votos, resposta do síndico, editar/apagar enquanto "Recebida") e `ManagerSuggestions.tsx` (filtro por situação, mais votadas, mudar situação com resposta em painel inferior como o mockup 42)
- [ ] T016 [US1] Páginas `web/app/resident/suggestions/page.tsx`, `web/app/resident/suggestion/page.tsx` (detalhe por `?id=`), `web/app/resident/suggestion/new/page.tsx` e `web/app/manager/suggestions/page.tsx`; `OWN_PAGES`; `npx next typegen`; textos nos três idiomas
- [ ] T017 [US1] Seed v6 — 5 sugestões (recebida, em análise, aprovada com melhoria, não será feita, uma sem mostrar apto) com votos de várias pessoas; asserções em `seed-v6.test.ts`

**Ponto de controle**: a História 1 funciona sozinha (MVP).

---

## Fase 4: História 2 — Avisar problema e acompanhar o conserto (P2)

**Objetivo**: avisar com fotos, público com apoio, síndico atualiza e avisa.

**Teste independente**: 804 avisa com foto e público; familiar apoia; síndico "Em andamento" com mensagem; os dois
avisados.

### Testes

- [ ] T018 [P] [US2] Escrever `web/tests/unit/issues.test.ts`: `report` valida (descrição 5–500, até 3 fotos), avisa o síndico (`issue-new`); portaria avisa com `public` sempre falso e "Portaria" como origem; visibilidade (público para todos os moradores; privado só autor, casa e síndico; portaria vê os próprios e os públicos); `support` um por pessoa, desfazível, só em público e não pelo próprio autor; `similar` devolve os públicos abertos do lugar; `all` do síndico com urgentes primeiro e `isNew` até abrir; `update` grava histórico e avisa autor e apoiadores (`issue-update`); só síndico atualiza e marca urgente
- [ ] T019 [P] [US2] Escrever `web/tests/e2e/issues.spec.ts`: 804 → Avisar problema → elevador, quebrado, descrição, foto (`fixtures/caixa.jpg`), mostrar para todos → enviar; escolher "Barulho" mostra o atalho para o aviso anônimo; familiar apoia; síndico → Problemas → "Novo" → em andamento com mensagem e urgente → 804 vê a mensagem no histórico

### Implementação

- [ ] T020 [US2] Implementar `web/src/services/issues.ts`; registrar em `core.ts`
- [ ] T021 [P] [US2] Criar `web/src/components/issues/ReportIssue.tsx` (mockup 18: onde e o que houve em botões, descrição com `DictateButton`, `PhotosField` até 3, "Mostrar para todos" (só morador), "Já avisaram aqui" com os parecidos e "Apoiar", aviso do barulho de vizinho com atalho; abaixo, "Meus problemas" com situação e histórico)
- [ ] T022 [P] [US2] Criar `web/src/components/issues/ManagerIssues.tsx` (mockup 42: abas Abertos, Em andamento, Resolvidos com contagem no subtítulo, cartões com foto, "Apto N · há X · N apoios", marca Novo/Urgente; painel "Atualizar" com situação, mensagem e "Salvar e avisar quem reportou", alternar urgente)
- [ ] T023 [US2] Páginas `web/app/resident/report-issue/page.tsx`, `web/app/front-desk/report-issue/page.tsx`, `web/app/manager/issues/page.tsx`; `OWN_PAGES`; textos
- [ ] T024 [US2] Seed v6 — 3 problemas (botão do elevador novo, infiltração urgente com 6 apoios, lâmpada resolvida com histórico); asserções em `seed-v6.test.ts`

---

## Fase 5: História 3 — Aviso de barulho anônimo (P3)

**Objetivo**: o síndico recebe sem saber quem mandou.

**Teste independente**: 804 avisa; o síndico vê sem nome nem apartamento; nada guarda o autor.

### Testes

- [ ] T025 [P] [US3] Escrever `web/tests/unit/noise.test.ts` (CS-004): o registro gravado não tem nenhum campo com `personId`, apartamento, nome ou telefone de quem enviou (procurar os valores em `JSON.stringify` do registro e das notificações do síndico); `happenedAt` não no futuro e só hoje; `list`/`markSeen` só síndico; portaria e síndico não avisam; `byIds` devolve só os ids pedidos
- [ ] T026 [P] [US3] Escrever `web/tests/e2e/noise.spec.ts`: 804 avisa música, "de cima", agora → "Meus avisos" mostra 1 → segundo aviso pede para esperar → síndico vê o aviso sem "804" nem o nome → marca visto → morador vê "Visto pelo síndico"

### Implementação

- [ ] T027 [US3] Implementar `web/src/services/noise.ts` (sem gravar o ator; notificação `noise` sem alvo identificável); registrar em `core.ts`
- [ ] T028 [P] [US3] Criar `web/src/components/noise/NoiseReport.tsx` (tipo, onde com andar opcional, quando: agora ou horário de hoje; "Seu nome e apartamento não vão para ninguém"; guarda os ids e o horário em `localStorage` por pessoa com `try/catch`; espera de 30 minutos; "Meus avisos" por `byIds`) e `ManagerNoise.tsx` (lista com data, hora, tipo, onde, "marcar visto")
- [ ] T029 [US3] Páginas `web/app/resident/noise-report/page.tsx` e `web/app/manager/noise-reports/page.tsx`; `OWN_PAGES`; textos
- [ ] T030 [US3] Seed v6 — 2 avisos de barulho (ontem 23:40 música de cima, visto; há 3 dias obra no 5º andar); asserções

---

## Fase 6: História 4 — Prestadores e comércio do bairro (P4)

**Objetivo**: indicar, "também indico", nota média, busca, filtro, ligar e WhatsApp, para todos os perfis.

**Teste independente**: 804 indica Zé da Luz com 5; familiar "também indico" com 4; "2 vizinhos indicam · 4,5"; busca
"luz".

### Testes

- [ ] T031 [P] [US4] Escrever `web/tests/unit/listings.test.ts`: `recommendNew` valida (nome 2–60, telefone por `normalizeDialable`, nota obrigatória em prestador e nula em comércio, observação e comentário); telefone repetido → `conflict` com o id existente e `findByPhone`; `recommend` uma por pessoa (atualiza a própria); portaria e síndico indicam com rótulo "Portaria"/"Síndico" (esclarecimento 2); média com uma casa; ordem por indicações; busca sem acento e filtro; `unrecommend` da última some o item; `remove` só síndico e avisa quem indicou (`listing-removed`)
- [ ] T032 [P] [US4] Escrever `web/tests/e2e/listings.spec.ts`: 804 indica "Zé da Luz", elétrica, (21) 98888-1111, nota 5 → familiar "Também indico" 4 → "2 indicam · 4,5"; busca "luz"; WhatsApp `https://wa.me/5521988881111`; portaria indica um comércio "Padaria Central" que entrega; síndico remove um prestador

### Implementação

- [ ] T033 [US4] Implementar `web/src/services/listings.ts`; registrar em `core.ts`
- [ ] T034 [P] [US4] Criar `web/src/components/listings/ListingsScreen.tsx` (mockup 20: busca, filtros em botões, cartões com iniciais, "serviço · observação", "N vizinhos indicam", nota com estrelas, WhatsApp e ligar; detalhe com as avaliações; "+" e "Também indico"; remover para o síndico) e `ListingForm.tsx` (nome, serviço ou tipo, telefone, observação, faz entrega, `Stars` e comentário; telefone repetido leva ao existente)
- [ ] T035 [US4] Páginas `providers` e `local-shops` para `resident`, `front-desk` e `manager` em `web/app/<perfil>/{providers,local-shops}/page.tsx`; `OWN_PAGES`; textos
- [ ] T036 [US4] Seed v6 — 4 prestadores (Zé da Luz, Cláudia Limpezas, Roberto Pinturas, Hidráulica Fonseca) e 3 comércios (padaria, farmácia, mercado) com indicações e notas, telefones fictícios `+5500…`; asserções

---

## Fase 7: História 5 — Pesquisa de satisfação (P5)

**Objetivo**: nota trimestral para portaria, limpeza e app; o síndico vê médias e comentários.

**Teste independente**: 804 responde 5, 4, 5; síndico vê a média do trimestre e o comentário.

### Testes

- [ ] T037 [P] [US5] Escrever `web/tests/unit/survey.test.ts` com relógio: `current` devolve o trimestre e o fim; `answer` uma por pessoa por período (responder de novo atualiza), notas 1–5, comentário até 500; só moradores; no trimestre seguinte, nova resposta; `results` só síndico, médias com uma casa, diferença para o anterior e comentários sem identificação
- [ ] T038 [P] [US5] Escrever `web/tests/e2e/survey.spec.ts`: início do 804 mostra o lembrete → responde 5, 4, 5 com comentário → lembrete some → síndico vê o trimestre atual com 1 resposta e o comentário, e o anterior com as respostas do seed

### Implementação

- [ ] T039 [US5] Implementar `web/src/services/survey.ts`; registrar em `core.ts`
- [ ] T040 [P] [US5] Criar `web/src/components/survey/SurveyScreen.tsx` (três `Stars` grandes, comentário, "Enviar"; já respondido: "Obrigado! Você pode mudar até DD/MM") e `SurveyResults.tsx` (cartão por trimestre com respostas, médias e setas de diferença, comentários); lembrete no início do morador em `web/src/components/home/ResidentHome.tsx`
- [ ] T041 [US5] Páginas `web/app/resident/satisfaction-survey/page.tsx` e `web/app/manager/satisfaction/page.tsx`; `OWN_PAGES`; textos
- [ ] T042 [US5] Seed v6 — 20 respostas no trimestre anterior; asserções

---

## Fase 8: História 6 — Melhorias do prédio (P6)

**Objetivo**: o síndico mostra planejadas, em andamento e concluídas com fotos, mês e valor.

**Teste independente**: o síndico cria "Troca do portão", passa a 60%, conclui com fotos e R$ 4.800; o morador vê.

### Testes

- [ ] T043 [P] [US6] Escrever `web/tests/unit/improvements.test.ts`: `save` só síndico, valida (título 5–80, descrição até 500, `progress` só em andamento, `month`, `cost` em centavos); `list` em andamento, planejadas, concluídas mais recentes; `origin` com apartamento (ou null se a sugestão esconde) e votos; concluir com origem avisa os "gostei" (`improvement-done`) uma vez; `remove` volta a sugestão para "reviewing"; todos os perfis veem
- [ ] T044 [P] [US6] Escrever `web/tests/e2e/improvements.spec.ts`: síndico cria "Troca do portão" planejada → edita para em andamento 60% → conclui com fotos de antes e depois, mês e R$ 4.800 → morador e portaria veem o cartão concluído com "R$ 4.800"

### Implementação

- [ ] T045 [US6] Completar `web/src/services/improvements.ts` (`list`, `save`, `remove`, aviso ao concluir); registrar em `core.ts`
- [ ] T046 [P] [US6] Criar `web/src/components/improvements/ImprovementsScreen.tsx` (mockup 24: situação, título, origem, fotos de antes e depois lado a lado, "Out/2026 · R$ 3.200", percentual em andamento; "+" e editar para o síndico) e `ImprovementForm.tsx` (situação em botões, percentual, mês, valor em reais, duas fotos)
- [ ] T047 [US6] Páginas `improvements` para os três perfis e `web/app/manager/improvement/edit/page.tsx`; `OWN_PAGES`; textos
- [ ] T048 [US6] Seed v6 — 3 melhorias (pintura da garagem concluída com fotos e R$ 3.200; LEDs concluída; bicicletário em andamento 60% vindo da sugestão aprovada); asserções

**Ponto de controle**: as 6 histórias passam juntas.

---

## Fase 9: Acabamento e transversais

- [ ] T049 Central de notificações: ícones e destinos dos tipos novos (`suggestion*` → sugestão; `improvement-done` → melhorias; `issue*` → problema do perfil; `noise` → avisos de barulho do síndico; `listing-removed` → prestadores) em `web/src/components/notifications/NotificationsScreen.tsx`
- [ ] T050 [P] Acrescentar as telas novas a `web/tests/e2e/accessibility.spec.ts` (quatro aparências) e conferir botões de escolha ≥ 48 px
- [ ] T051 [P] Conferir `web/tests/unit/messages.test.ts` (chaves iguais e parâmetros ICU) e ajustar `IGUAIS_EM_ESPANHOL` (RF-024)
- [ ] T052 Conferir o seed v6 completo contra `data-model.md` e RF-025, relativo ao dia e sem passar para ontem logo depois da meia-noite
- [ ] T053 Rodar `npx vitest run`, `npm run lint`, `npx tsc --noEmit`, o e2e completo, `make e2e-build`, `make e2e-build-real` e `make perf`
- [ ] T054 Documentação: `docs/documentacao/02-funcionalidades.md` (Participação → "Em construção"), `docs/documentacao/03-arquitetura.md` (barulho anônimo, votos e indicações, sugestão → melhoria, pastas novas), `docs/backlog.md` (Etapa 3: fotos no R2, contador anônimo de barulho no servidor, pytest; celular de verdade) e `docs/changelog.md`
- [ ] T055 Validar os 13 cenários de `specs/006-participacao/quickstart.md`

---

## Dependências e ordem

- **Fase 1 → Fase 2 → histórias.** A fundação bloqueia tudo.
- **US1** usa o `createImprovementFromSuggestion` mínimo (T013); **US6** completa as melhorias e depende da US1 para a
  origem. **US2**, **US3**, **US4** e **US5** dependem só da fundação.
- **Seed v6**: base em T005; cada história acrescenta o seu (T017, T024, T030, T036, T042, T048); T052 confere.

### Paralelo

- Fase 2: T006, T008, T010 juntos.
- Depois da fundação, US2, US3, US4 e US5 podem andar em paralelo com a US1.
- Em cada história, os testes [P] juntos e as telas [P] em paralelo com o serviço.

## Estratégia

1. **MVP**: Fases 1, 2 e 3 — sugestões com votos e aprovação já entregam o principal.
2. Depois US2 (problemas), US3 (barulho), US4 (prestadores), US5 (pesquisa) e US6 (melhorias completas).
3. Fase 9 fecha acessibilidade, traduções, documentação e a verificação completa.
