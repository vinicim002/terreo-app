---
description: "Lista de tarefas da spec 005 — Segurança"
---

# Tarefas: Segurança

**Entrada**: documentos de `specs/005-seguranca/`

**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Testes**: obrigatórios pela constituição (princípio VII). Em cada história, os testes vêm antes da implementação e
devem falhar primeiro. Testes de serviço usam `web/tests/unit/auth-helpers.ts` e `comm-helpers.ts` (`commSetup()` com
relógio controlado e as contas de exemplo). Todo texto novo nos três idiomas (RF-021); depois de criar rotas,
`cd web && npx next typegen`. Cada tarefa que cria uma página acrescenta o slug a `OWN_PAGES` de
`web/app/<perfil>/[screen]/page.tsx` no mesmo passo. Nos e2e, trocar de conta na mesma aba com `switchTo`.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[USn]**: história da spec (US1 = História 1 … US4 = História 4)
- Caminhos relativos à raiz do repositório

---

## Fase 1: Configuração

- [X] T001 Conferir em `web/src/navigation/screens.ts` os slugs `emergency` (morador), `general-alert` e `emergency-alert` (portaria e síndico) e `contacts` (todos); acrescentar `emergency-alert` ao síndico (grupo `communication`) e atualizar `web/tests/unit/screens.test.ts` (contracts/rotas.md)
- [X] T002 [P] Criar `web/src/services/dialable.ts` com `normalizeDialable(text)`: aceita serviços públicos de 3 dígitos (`190`–`199`), 0800 e telefones brasileiros fixos e celulares; devolve `{ tel, display, isMobile }` ou erro; e `whatsappLink(e164)` (`https://wa.me/55…`); testes em `web/tests/unit/dialable.test.ts` (research R7)

---

## Fase 2: Fundação (bloqueia todas as histórias)

**⚠️ CRÍTICO**: nenhuma história começa antes desta fase.

### Esquemas, contratos e banco

- [X] T003 Acrescentar a `web/src/services/schemas.ts` os esquemas `EmergencyAlert`, `GeneralAlert`, `GeneralAlertSeen` e `Contact` exatamente como `data-model.md` (`kind` de emergência `health|fire|intrusion|leak|other|unknown`; `origin` `app|whatsapp`; `status` `open|acknowledged|resolved|cancelled`; `resolutionNote` até 300; `kind` geral `fire|gas|power|security|other`; `message` 5–280; `closingMessage` até 280; contato `name` 2–60, `description` até 60, `group` `building|emergency`, `frontDesk` no máximo um); `Person.showPhoneInContacts` (padrão `false`; `Staff.isHead` já existe e marca o porteiro-chefe); `Notification.type` ganha `emergency-update`, `general-alert`, `general-alert-closed` e `target.kind` ganha `emergency`, `general-alert`
- [X] T004 Acrescentar a `web/src/services/contracts.ts` as interfaces de `contracts/servicos.md` (`EmergencyService`, `GeneralAlertService`, `ContactService`) e incluí-las em `Services`
- [X] T005 Subir `DB_VERSION` para 5 em `web/src/services/local/db.ts` com as lojas `emergencyAlerts` (`byCondominium`, `byApartment`), `generalAlerts`, `generalAlertSeen` e `contacts` (todas com `byCondominium`) em `web/src/services/base.ts`; `SEED_VERSION` 5 com `buildSecuritySeed(base, now)` vazio em `web/src/services/local/seed-security.ts` (cada história acrescenta o seu conteúdo); renomear `web/tests/unit/seed-v4.test.ts` para `seed-v5.test.ts`

### Permissões

- [X] T006 [P] Escrever `web/tests/unit/permissions-005.test.ts` com cada linha de `contracts/permissoes.md` (CS-006): `emergency.raise`/`viewOwn`/`cancel` (outro morador só cancela o que pediu; outro apartamento `not_found`), `emergency.viewAll`, `emergency.respond` só portaria, `generalAlert.send` portaria e síndico, `generalAlert.close` só quem enviou ou o síndico, `contacts.manage` só síndico, `contacts.showOwnPhone` só síndico e porteiro-chefe; sem ator `forbidden`
- [X] T007 Implementar as ações em `web/src/services/permissions.ts` até o T006 passar

### Canais e tarefas com horário

- [X] T008 [P] Ampliar `web/tests/unit/notify.test.ts`: `general-alert` e `general-alert-closed` vão ao app e ao privado de todas as pessoas ativas **e** uma mensagem ao grupo, mesmo com todas as preferências desligadas (CS-003); `emergency-update` ignora preferências e vai ao app e ao privado
- [X] T009 Implementar os tipos novos em `web/src/services/notify.ts` (research R3) até o T008 passar
- [X] T010 [P] Escrever `web/tests/unit/due-005.test.ts` com relógio controlado: alerta `open` sem "Estou indo" há 2 min recebe `repeatedAt` e um novo `emergency` para porteiros e síndicos, uma única vez; `acknowledged` ou `cancelled` não repetem; idempotente
- [X] T011 Implementar `runSecurityDue` em `web/src/services/due.ts`, chamado pelo `runDue`, até o T010 passar

**Ponto de controle**: fundação pronta; as histórias podem começar.

---

## Fase 3: História 1 — O morador pede ajuda e a portaria vai até ele (P1) 🎯 MVP

**Objetivo**: segurar 3 s, alerta em tela cheia na portaria, "Estou indo", cancelar, resolver, avisar casa e contato
de emergência, SOS pelo WhatsApp.

**Teste independente**: o 804 segura 3 s com "Saúde"; a portaria vê "Apto 804 · 8º andar · Saúde" e o contato de
emergência; "Estou indo"; o morador vê o nome do porteiro.

### Testes

- [X] T012 [P] [US1] Escrever `web/tests/unit/emergency.test.ts`: `raise` cria `open` com apartamento, autor, hora e tipo; segundo `raise` do mesmo apartamento devolve o em aberto (RF-008); avisa porteiros, síndicos e as outras pessoas do apartamento (`emergency`) e manda mensagem direta ao contato de emergência na caixa de saída no pedido, no cancelamento e na resolução, sem mensagem quando não há contato (RF-003a); `noDoormanOnDuty` quando ninguém tem turno agora; `fullScreenForMe` verdadeiro só para os porteiros de plantão e para todos os porteiros quando ninguém está na escala (RF-003); `acknowledge` só o primeiro vale; `resolve` com nota até 300; `cancel` com confirmação no serviço (estado) e avisos `emergency-update`; `emergencyContact` só aparece para portaria e síndico
- [X] T013 [P] [US1] Ampliar `web/tests/unit/inbox.test.ts` (CS-006a): "SOS", "sos", "Socorro!", "SOCORRO" de um celular de pessoa ativa criam alerta `unknown` com `origin: "whatsapp"` e resposta no privado; "sossego", "socorrista" e celular desconhecido não criam; mensagens de código de entrega continuam funcionando
- [X] T014 [P] [US1] Escrever `web/tests/e2e/emergency.spec.ts`: toque rápido no botão não envia (CS-002); a tela cheia aparece na portaria em menos de 5 s depois de começar a segurar (CS-001); segurar 3 s com "Saúde" mostra "Alerta enviado"; `switchTo` portaria → tela cheia com apartamento, andar, tipo e contato de emergência → "Estou indo" → `switchTo` morador vê o nome do porteiro "a caminho"; morador cancela outro alerta → portaria vê "Cancelado pelo morador"; ligar direto tem `tel:192`, `tel:193`, `tel:190`

### Implementação

- [X] T015 [US1] Implementar `web/src/services/emergency.ts` (`raise`, `mine`, `cancel`, `open`, `acknowledge`, `resolve`; `history` fica para a US4) com destinatários do research R4, `fullScreenForMe` pela escala (`staff.board`) e as mensagens ao contato de emergência no pedido ("<Nome> pediu ajuda no apartamento <N> do <Condomínio> às HH:MM. A portaria foi avisada."), no cancelamento e na resolução; registrar em `web/src/services/core.ts`
- [X] T016 [US1] Reconhecer "SOS"/"socorro" (palavra inteira, sem acento e maiúsculas) em `whatsappInboxService.receive` de `web/src/services/front-desk.ts` antes dos códigos (research R6)
- [X] T017 [P] [US1] Criar `web/src/components/security/HoldButton.tsx`: botão redondo grande (mockup 12, "SEGURE 3s"), anel de progresso, `pointerdown`/`pointerup`/`pointerleave` e Espaço/Enter seguro, `HOLD_MS = 3000`, anúncio para leitor de tela ao concluir
- [X] T018 [US1] Criar `web/src/components/security/EmergencyScreen.tsx`: sem alerta, "Precisa de ajuda?" com o apartamento, `HoldButton`, tipos opcionais (Saúde, Incêndio, Invasão, Vazamento, Outro) e "Ligar direto" (SAMU 192, Bombeiros 193, Polícia 190); com alerta em aberto, tela de acompanhamento vermelha (mockup 13) com hora, quem viu, "Ligar para a portaria" (número `frontDesk` dos contatos), "Ligar para o SAMU (192)" e "Cancelar alerta" com confirmação; aviso "Sem porteiro de plantão agora — o síndico também foi avisado"
- [X] T019 [US1] Página `web/app/resident/emergency/page.tsx`; `OWN_PAGES`; `npx next typegen`; textos nos três idiomas
- [X] T020 [P] [US1] Criar `web/src/components/security/DeskEmergencyOverlay.tsx` (mockup 34): tela cheia vermelha por cima de tudo com "EMERGÊNCIA", "Apto N" grande, andar, tipo, quem enviou, "enviado há Xs", "Estou indo" (≥ 56 px), "Interfone" e "SAMU", contato de emergência ou "Sem contato de emergência cadastrado"; depois do "Estou indo", "Resolvido" com nota opcional (`DictateButton`); os outros porteiros veem quem foi; som (bipes com `AudioContext`) e `navigator.vibrate` quando o aparelho deixar, tocando de novo quando `repeated`
- [X] T021 [US1] Criar `web/src/components/security/EmergencyWatcher.tsx` e montá-lo em `web/src/components/layout/ProfileShell.tsx`: na portaria, consulta `emergency.open` a cada 1 s (TanStack Query `refetchInterval`; o `raise` no mesmo aparelho invalida a consulta na hora) e mostra o `DeskEmergencyOverlay` com o alerta mais antigo não resolvido em que `fullScreenForMe`; os demais aparecem como cartão (research R2, CS-001)
- [X] T022 [US1] Atalhos no início do morador: botão vermelho de emergência no topo (leva a `/resident/emergency/`) e, ao lado, "Contatos" (leva a `/resident/contacts/`, CS-005); cartão "Emergência · apto N" no painel da portaria em `web/src/components/desk/DeskHome.tsx`
- [X] T023 [US1] Painel `/dev`: botão para simular "SOS" pelo WhatsApp do celular escolhido, junto da simulação de códigos (`web/app/dev/`)

**Ponto de controle**: a História 1 funciona sozinha (MVP).

---

## Fase 4: História 2 — Alerta geral para o prédio inteiro (P2)

**Objetivo**: portaria ou síndico avisa todos em segundos, no app em tela cheia e no WhatsApp (grupo e privado), e
encerra depois.

**Teste independente**: a portaria envia alerta de incêndio; o 804 vê a tela cheia; a caixa de saída tem o grupo e o
privado de todos; a portaria encerra e todos recebem "Situação controlada".

### Testes

- [X] T024 [P] [US2] Escrever `web/tests/unit/general-alert.test.ts`: `send` só portaria e síndico, `message` 5–280; segundo `send` com um em aberto é recusado (`conflict`) e o formulário mostra o aberto com "Encerrar"; avisa todas as pessoas ativas com `general-alert` (app, privado e uma no grupo) mesmo com preferências desligadas (CS-003); `current` devolve o em aberto com `seenByMe`; `markSeen` por pessoa; `close` só quem enviou ou o síndico, `closingMessage` até 280, avisa com `general-alert-closed`
- [X] T025 [P] [US2] Escrever `web/tests/e2e/general-alert.spec.ts`: portaria → Alerta geral → incêndio + mensagem pronta → confirmar → `switchTo` morador vê a tela cheia → "Entendi" → faixa no início → `switchTo` portaria → Encerrar → morador vê "Alerta encerrado"; morador não tem a opção

### Implementação

- [X] T026 [US2] Implementar `web/src/services/general-alert.ts` (`current`, `send`, `close`, `markSeen`; `history` na US4); registrar em `web/src/services/core.ts`
- [X] T027 [P] [US2] Criar `web/src/components/security/GeneralAlertForm.tsx`: tipos (Incêndio, Vazamento de gás, Falta de energia, Segurança, Outro) em botões grandes, mensagens prontas por tipo, texto com `DictateButton` e contador (até 280), confirmação "Enviar para todos os moradores?"; com um em aberto, mostra o alerta e "Encerrar" com mensagem opcional
- [X] T028 [US2] Páginas `web/app/front-desk/general-alert/page.tsx` e `web/app/manager/general-alert/page.tsx`; `OWN_PAGES`; `npx next typegen`; textos nos três idiomas
- [X] T029 [P] [US2] Criar `web/src/components/security/GeneralAlertOverlay.tsx`: tela cheia de alto contraste com tipo, mensagem, quem enviou, hora e "Entendi" (≥ 56 px); o `EmergencyWatcher` (T021) passa a consultar `generalAlert.current` em todos os perfis e mostra a tela cheia enquanto `!seenByMe`
- [X] T030 [US2] Faixa "Alerta geral em aberto" no topo do início dos três perfis (RF-013), levando ao alerta; o botão "Alerta geral" do `DeskHome` leva a `/front-desk/general-alert/`

**Ponto de controle**: Histórias 1 e 2 funcionam juntas.

---

## Fase 5: História 3 — Contatos importantes (P3)

**Objetivo**: contatos do prédio e de emergência em um só lugar, com busca, ligar e WhatsApp; o síndico mantém.

**Teste independente**: o morador busca "luz" e liga para a Light; o síndico acrescenta "Chaveiro 24h" e ele aparece
para todos.

### Testes

- [X] T031 [P] [US3] Escrever `web/tests/unit/contacts.test.ts`: `list` em dois grupos, com portaria (`frontDesk`), síndico e porteiro-chefe do cadastro; celular do síndico e do porteiro-chefe só com `showPhoneInContacts` (sem ele, `phone: null`); busca sem acento por nome e descrição; `save` valida nome 2–60, descrição até 60 e número por `normalizeDialable`; no máximo um `frontDesk`; `remove` e `reorder` só síndico; `setShowMyPhone` só síndico e porteiro-chefe
- [X] T032 [P] [US3] Escrever `web/tests/e2e/contacts.spec.ts`: morador no início toca "Contatos" e chega ao botão de ligar do SAMU em 2 toques (CS-005); busca "luz" → Light com `tel:`; contato celular tem botão de WhatsApp; síndico → Editar contatos → acrescenta "Chaveiro 24h" → `switchTo` morador vê; síndico liga "Mostrar meu celular" no perfil → morador vê o celular dele

### Implementação

- [X] T033 [US3] Implementar `web/src/services/contacts.ts`; registrar em `web/src/services/core.ts`
- [X] T034 [P] [US3] Criar `web/src/components/contacts/ContactsScreen.tsx` (mockup 15): busca, "Do prédio" e "Emergência e serviços", ícone por contato, botão de ligar e, para celulares, de WhatsApp; síndico sem número mostra só nome e função; para o síndico, botão "Editar contatos"
- [X] T035 [P] [US3] Criar `web/src/components/contacts/ContactsEditor.tsx`: lista com subir/descer (botões, sem arrastar), editar, remover com confirmação, formulário (nome, descrição, número, "É o número da portaria")
- [X] T036 [US3] Páginas `web/app/resident/contacts/page.tsx`, `web/app/front-desk/contacts/page.tsx`, `web/app/manager/contacts/page.tsx` e `web/app/manager/contacts/edit/page.tsx`; `OWN_PAGES`; `npx next typegen`; textos nos três idiomas
- [X] T037 [US3] Opção "Mostrar meu celular nos contatos" no perfil do síndico e no `web/src/components/profile/StaffProfileScreen.tsx` só para o porteiro-chefe
- [X] T038 [US3] Seed v5 — contatos de `research.md` R9 (Portaria `frontDesk` "24h", SAMU 192, Bombeiros 193, Polícia Militar 190, Defesa Civil 199, Light 0800 021 0196, Naturgy 0800 024 0197, Águas do Rio 0800 195 0195); asserções em `seed-v5.test.ts`

**Ponto de controle**: Histórias 1 a 3 funcionam juntas.

---

## Fase 6: História 4 — Histórico de emergências (P4)

**Objetivo**: síndico e portaria acompanham os alertas dos últimos 90 dias; o morador vê os do próprio apartamento.

**Teste independente**: depois de um alerta atendido e de um alerta geral encerrado, o síndico vê os dois com o tempo
até o "Estou indo".

### Testes

- [X] T039 [P] [US4] Ampliar `web/tests/unit/emergency.test.ts` e `general-alert.test.ts`: `history` dos últimos 90 dias, do mais novo para o mais antigo; portaria e síndico veem todos; morador vê só os do próprio apartamento (em `mine`) e os gerais (`generalAlert.history` aberto a todos); tempo até o atendimento
- [X] T040 [P] [US4] Ampliar `web/tests/e2e/emergency.spec.ts`: síndico → Alertas de emergência → vê o alerta do seed resolvido e o geral encerrado com tempo até o atendimento; morador → Emergência → histórico mostra o geral encerrado e nenhum alerta de outro apartamento

### Implementação

- [X] T041 [US4] Implementar `history` em `web/src/services/emergency.ts` e `web/src/services/general-alert.ts`
- [X] T042 [P] [US4] Criar `web/src/components/security/AlertHistory.tsx`: em aberto no topo e lista com tipo, apartamento ou "Geral", quem enviou, quem atendeu, tempo até o atendimento e situação
- [X] T043 [US4] Páginas `web/app/front-desk/emergency-alert/page.tsx` e `web/app/manager/emergency-alert/page.tsx`; histórico na tela de emergência do morador (alertas do próprio apartamento e alertas gerais, com `AlertHistory`); `OWN_PAGES`; `npx next typegen`; textos nos três idiomas
- [X] T044 [US4] Seed v5 — alerta resolvido do 501 ("Saúde", há 3 dias, atendido em 1 min por Jonas, nota) e alerta geral encerrado ("Vazamento de gás no 2º andar", há 10 dias, encerrado em 25 min); asserções em `seed-v5.test.ts`

**Ponto de controle**: as 4 histórias passam juntas.

---

## Fase 7: Acabamento e transversais

- [X] T045 Central de notificações (spec 003): ícones e destinos dos tipos novos (`emergency`, `emergency-update` → tela de emergência do perfil; `general-alert*` → alerta geral) em `web/src/components/notifications/NotificationsScreen.tsx`
- [X] T046 [P] Acrescentar as telas novas a `web/tests/e2e/accessibility.spec.ts` (axe nas quatro aparências: emergência, acompanhamento, tela cheia da portaria, alerta geral, tela cheia do alerta geral, contatos, editar contatos, histórico) e conferir botões ≥ 56 px nas telas de alerta
- [X] T047 [P] Conferir `web/tests/unit/messages.test.ts` (chaves iguais e parâmetros ICU) e ajustar `IGUAIS_EM_ESPANHOL` se preciso (RF-021)
- [X] T048 Conferir o seed v5 completo contra `data-model.md` e RF-022 e que "Restaurar dados de exemplo" recria tudo relativo ao dia
- [X] T049 Rodar `npx vitest run`, `npm run lint`, `npx tsc --noEmit`, o e2e completo, `make e2e-build` e `make e2e-build-real` (sem simulação de SOS no real) e `make perf`
- [X] T050 Documentação: `docs/documentacao/02-funcionalidades.md` (Segurança → "Em construção"), `docs/documentacao/03-arquitetura.md` (watcher, canais do alerta geral, SOS), `docs/backlog.md` (Etapa 3: push e tempo real para emergências, pytest das regras de segurança, conferir com o síndico os números das concessionárias antes do lançamento) e `docs/changelog.md` (com o aviso de que os números das concessionárias são exemplos)
- [X] T051 Validar os 15 cenários de `specs/005-seguranca/quickstart.md` (automáticos onde houver teste; o resto no ambiente ligado; som e vibração no celular de verdade ficam no backlog) — cobertos pelos e2e de emergência, alerta geral, contatos e acessibilidade e pelos unitários com relógio; segurar no toque, som, vibração, ligar e WhatsApp num celular de verdade ficam no backlog

---

## Dependências e ordem

- **Fase 1 → Fase 2 → histórias.** A fundação (esquemas, banco v5, permissões, canais, repetição) bloqueia tudo.
- **US1** não depende de outra história. **US2** usa o `EmergencyWatcher` da US1 (T021) para a tela cheia; o serviço
  e o formulário só dependem da fundação. **US3** só depende da fundação (o "Ligar para a portaria" da US1 usa o
  contato `frontDesk` quando existir, senão esconde o botão). **US4** depende da US1 e da US2.
- **Seed v5**: a base (T005) fica na Fundação; T038 e T044 acrescentam o conteúdo; T048 confere o conjunto.
- **Fase 7** depois das histórias desejadas.

### Paralelo

- Fase 2: T006, T008 e T010 juntos (testes em arquivos diferentes); depois T007, T009 e T011.
- US1: T012, T013 e T014 juntos; T017 e T020 em paralelo com T015.
- US2: T024 e T025 juntos; T027 e T029 em paralelo com T026.
- US3: T031 e T032 juntos; T034 e T035 em paralelo com T033.
- US3 inteira pode andar em paralelo com a US1 depois da fundação.

## Estratégia

1. **MVP**: Fases 1, 2 e 3 — o botão de emergência com a portaria indo até o apartamento já entrega o valor principal.
2. Depois US2 (alerta geral), US3 (contatos), US4 (histórico), validando cada ponto de controle.
3. Fase 7 fecha acessibilidade, traduções, documentação e a verificação completa.
