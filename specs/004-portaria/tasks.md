---
description: "Lista de tarefas da spec 004 — Portaria"
---

# Tarefas: Portaria

**Entrada**: documentos de `specs/004-portaria/`

**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Testes**: obrigatórios pela constituição (princípio VII). Em cada história, os testes vêm antes da implementação e
devem falhar primeiro. Testes de serviço usam `web/tests/unit/auth-helpers.ts` e `comm-helpers.ts` (`commSetup()` com
relógio controlado e as quatro contas). Todo texto novo nos três idiomas (RF-025); depois de criar rotas,
`cd web && npx next typegen`. Cada tarefa que cria uma página acrescenta o slug a `OWN_PAGES` de
`web/app/<perfil>/[screen]/page.tsx` no mesmo passo. Nos e2e, trocar de conta na mesma aba com `switchTo`.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[USn]**: história da spec (US1 = História 1 … US6 = História 6)
- Caminhos relativos à raiz do repositório

---

## Fase 1: Configuração

- [X] T001 Acrescentar ao catálogo do síndico em `web/src/navigation/screens.ts`: `memos` (ícone `MessageSquareText`, grupo `communication`), `on-duty` (ícone `AlarmClock`, grupo `management`, RF-020) e `lost-and-found` (ícone `Search`, grupo `info`, só leitura); título `screens.memos` ("Recados da portaria") nos três idiomas; atualizar `web/tests/unit/screens.test.ts` (contracts/rotas.md)
- [X] T002 [P] Tornar o tamanho máximo configurável em `web/src/photo/resize.ts` (`resizePhoto(file, { max = 512, quality = 0.8 })`), com encomendas e achados usando `{ max: 1024, quality: 0.7 }`; ampliar `web/tests/unit/photo.test.ts` (research R4)

---

## Fase 2: Fundação (bloqueia todas as histórias)

**⚠️ CRÍTICO**: nenhuma história começa antes desta fase.

### Esquemas, contratos e banco

- [X] T003 Acrescentar a `web/src/services/schemas.ts` os esquemas `Delivery`, `Visitor`, `TravelMode`, `FrontDeskMemo`, `LostItem` e `InboundMessage` exatamente como `data-model.md` (ex.: `code` 1–30 só letras, números e hífen; `note` até 140; `storeName` 2–40 só com `other`; `name` 2–80; `people` 1–20; `fromTime` < `toTime`; viagem de no máximo 120 dias; recado 2–1.000; `description` 3–200; `place` até 80; `photo` `data:image/jpeg`); `Notification.type` ganha `delivery-reminder`, `mail`, `lost-found`, `memo` e `target.kind` ganha `delivery`, `visitor`, `lost-item`, `memo`
- [X] T004 Acrescentar a `web/src/services/contracts.ts` as interfaces de `contracts/servicos.md` (`DeliveryService`, `VisitorService`, `TravelService`, `FrontDeskService`, `MemoService`, `LostFoundService`, `WhatsappInboxService`, `StaffService.board`) e incluí-las em `Services` (`whatsappInbox` opcional, só dev/demo)
- [X] T005 Subir `DB_VERSION` para 4 em `web/src/services/local/db.ts` com as lojas `deliveries`, `visitors`, `travelModes`, `memos`, `lostItems`, `inboundMessages` (todas com `byCondominium`; `deliveries`, `visitors` e `travelModes` também com `byApartment`) em `web/src/services/base.ts`; `SEED_VERSION` 4 com `buildFrontDeskSeed(base, now)` vazio em `web/src/services/local/seed-front-desk.ts` (cada história acrescenta o seu conteúdo); renomear `web/tests/unit/seed-v3.test.ts` para `seed-v4.test.ts`

### Permissões

- [X] T006 Escrever `web/tests/unit/permissions-004.test.ts` com uma asserção por célula de `contracts/permissoes.md` (responsável, outro morador com e sem `canRegisterDeliveries`, portaria, síndico, sem ator; alvo do próprio apartamento e de outro → `not_found` para morador) (CS-005)
- [X] T007 Implementar as ações novas em `can()`/`authorize()` de `web/src/services/permissions.ts`; `ActorInfo` ganha `canRegisterDeliveries`; `visitor.cancel` recebe `{ apartmentId, createdById }`

### Canais e tarefas com horário

- [X] T008 [P] Ampliar `web/tests/unit/notify.test.ts`: tipos `delivery`, `delivery-reminder` e `mail` vão ao app e ao privado conforme "Entregas", nunca ao grupo, mesmo com `toGroup` (CS-004); `visitor` conforme "Visitantes"; `lost-found` e `memo` só no app, ignorando WhatsApp e sem preferência
- [X] T009 Implementar em `web/src/services/notify.ts` a categoria só no app (`lost-found`, `memo`) e o mapeamento dos tipos novos (research R7); `prefKeyOf` trata `delivery*` e `mail` como "Entregas"
- [X] T010 [P] Escrever `web/tests/unit/due-004.test.ts` com relógio controlado: encomenda `at-desk` gera o primeiro lembrete no 3º dia e no máximo um por dia de Brasília, para quem foi avisado na chegada (esclarecimento 2), e nenhum durante o modo viagem (volta no dia seguinte à volta); código `awaiting` com mais de 7 dias vira `not-arrived`; visitante `expected` de ontem vira `no-show`; rodar duas vezes não duplica
- [X] T011 Acrescentar essas tarefas ao `runDue` de `web/src/services/due.ts` (research R2), com `lastReminderDay`

**Ponto de controle**: `npx vitest run` passa com esquemas, permissões, canais e `runDue`.

---

## Fase 3: História 1 — Código de entrega encontrado pela portaria (P1) 🎯 MVP

**Objetivo**: morador cadastra (app ou WhatsApp); portaria encontra e registra a chegada; aviso no privado.

**Teste independente**: o 804 cadastra iFood 4821; a portaria abre o 804, vê o código e registra a chegada; aviso a quem cadastrou e ao responsável; "Entregue".

### Testes

- [X] T012 [P] [US1] Escrever `web/tests/unit/parse-delivery.test.ts` com pelo menos 20 mensagens: "iFood 4821", "ifood: 4821", "código 4821 ifood", "Mercado Livre MLB-73", "ml mlb73", "mercadolivre MLB-73", "Shopee BR123", "amazon 998877", "Correios QB123456789BR", "4821" (sem loja → Outro), "oi tudo bem" (não entendida), código com 31 caracteres (não entendida); acerto ≥ 95% (CS-006)
- [X] T013 [P] [US1] Escrever `web/tests/unit/deliveries.test.ts` (parte 1): `registerCode` só com `canRegisterDeliveries` (familiar sem permissão → `forbidden`); validações (`code` vazio ou com espaço, `other` sem `storeName`); duplicado no mesmo dia → `validation` `details.code = "duplicate"` e passa com `confirmDuplicate`; `mine` mostra para todos do apto e nunca para outro apto; `cancelCode`; `markArrived` (só portaria) leva a `delivered` para `elevator`/`call` e a `at-desk` para `front-desk`; aviso só a quem cadastrou e ao responsável (esclarecimento 1), nenhuma mensagem `group` (CS-004)
- [X] T014 [P] [US1] Escrever `web/tests/unit/inbox.test.ts`: celular do familiar com permissão + "iFood 4821" → `registered`, entrega `origin = whatsapp` no 804 e resposta `private` de confirmação; celular desconhecido → `unknown-phone` e nada cadastrado; morador sem permissão → `no-permission`; texto sem código → `not-understood` com a explicação; modo real → `whatsappInbox` ausente
- [X] T015 [P] [US1] Escrever `web/tests/e2e/deliveries.spec.ts` (parte 1): `signInAs(page, "responsible")` → `/resident/deliveries/` → "Cadastrar código de entrega" → iFood, 4821, "Subir pelo elevador" → Salvar em menos de 30 s (CS-001) → em "Aguardando"; `switchTo(page, "front-desk", "/front-desk/")` → buscar "804" → painel com "4821" (2 toques, CS-002) → "Chegou"; `switchTo` responsible → "Entregue"; `/dev` → Simular mensagem do celular da conta `family` "Mercado Livre MLB-99" → resposta e código no 804

### Implementação

- [X] T016 [US1] Implementar `parseDeliveryMessage(text)` em `web/src/services/parse-delivery.ts` (research R3), função pura
- [X] T017 [US1] Implementar `web/src/services/deliveries.ts` (`mine`, `registerCode`, `cancelCode`, `byApartment`, `markArrived`) e o painel `apartment`/`overview` em `web/src/services/desk.ts` (moradores como a consulta da spec 002, contagens, marca de viagem) com `authorize`, `runDue` e `notify`; registrar em `web/src/services/core.ts`
- [X] T018 [US1] Implementar `web/src/services/inbox.ts` (`receive`, `list`; sem ator, identifica pela pessoa do celular; grava `InboundMessage`; responde na caixa de saída `private`); só em dev/demo em `core.ts`
- [X] T019 [P] [US1] Criar `web/src/components/deliveries/ResidentDeliveries.tsx` (mockup 08: botão "Cadastrar código de entrega", dica do WhatsApp, Aguardando com o código em letras grandes e "Cancelar", Na portaria, Retiradas) e `web/src/components/deliveries/CodeForm.tsx` (mockup 09: lojas em botões, código com dica por loja, observação, "Quando o pedido chegar", aviso de duplicado com "É outro pedido")
- [X] T020 [P] [US1] Criar `web/src/components/desk/DeskHome.tsx` (busca de apartamento com teclado numérico, 5 botões grandes ≥ 56 px — o que ainda não existe leva à tela "em construção" até a sua história —, três números do dia), `web/src/components/desk/ApartmentGrid.tsx` (andares, marcas de códigos e na portaria) e `web/src/components/desk/ApartmentDesk.tsx` (moradores, códigos em letras grandes com "Chegou"; código com "me ligar" mostra "Ligar para o morador" antes de "Chegou"; "subir pelo elevador" mostra "Subir pelo elevador")
- [X] T021 [US1] Páginas `web/app/resident/deliveries/page.tsx`, `web/app/resident/delivery/new/page.tsx`, `web/app/front-desk/page.tsx` (início), `web/app/front-desk/deliveries/page.tsx`, `web/app/front-desk/apartment/page.tsx` (`?n=`); `OWN_PAGES`; `npx next typegen`; hooks em `web/src/hooks/data.ts`
- [X] T022 [US1] Painel `/dev` (`web/src/dev/DevTools.tsx`): "Simular mensagem recebida no WhatsApp" (celular das contas de exemplo ou livre + texto) com o resultado e a resposta
- [X] T023 [US1] Seed v4 — códigos aguardando no 804 (iFood 4821 "subir pelo elevador" pelo responsável; Mercado Livre MLB-73 "deixar na portaria" pelo familiar) e 5 em outros apartamentos; asserções em `web/tests/unit/seed-v4.test.ts`
- [X] T024 [US1] Textos de entregas, portaria e painel em `web/messages/{pt,en,es}.json`

**Ponto de controle**: H1 funciona sozinha; testes da parte 1 passam.

---

## Fase 4: História 2 — Encomenda sem código, foto, correspondência e retirada (P2)

**Objetivo**: receber com foto, avisar todos do apto, retirada pelo app ou pela portaria, lembrete, correspondência.

**Teste independente**: a portaria recebe caixa média da Amazon para o 804 com foto; o morador vê e toca "Retirei"; a portaria vê quem retirou.

### Testes

- [X] T025 [P] [US2] Ampliar `web/tests/unit/deliveries.test.ts` (parte 2): `receive` (só portaria; apto inexistente → `not_found`; foto que não é JPEG → `validation`) nasce `at-desk` e avisa todas as pessoas ativas do apto (esclarecimento 1) — ninguém se `notifyResident` falso; `pickUp` por pessoa do apto grava nome e hora, de outro apto → `not_found`; `registerPickup` pela portaria só com pessoa ativa do apto; `mail` avisa "Chegou correspondência para você na portaria" sem conteúdo; apto sem moradores ativos registra sem avisar
- [X] T026 [P] [US2] Ampliar `web/tests/e2e/deliveries.spec.ts` (parte 2): portaria → "Receber encomenda" → foto (arquivo de teste em `web/tests/e2e/fixtures/caixa.jpg` pelo `setInputFiles`), 804, Média, Amazon → Registrar em menos de 45 s (CS-003); morador → "Na portaria" com a foto → "Retirei" → em Retiradas com o nome; portaria → "Correspondência" no 502

### Implementação

- [X] T027 [US2] Completar `web/src/services/deliveries.ts` (`receive`, `mail`, `pickUp`, `registerPickup`)
- [X] T028 [P] [US2] Criar `web/src/components/desk/ReceiveDelivery.tsx` (mockup 32: foto pela câmera com `capture="environment"` e redução 1024 px, apartamento, tamanho, loja, "Avisar morador no WhatsApp", Registrar; apartamento sem moradores ativos mostra "Ninguém do apartamento será avisado") e `web/src/components/desk/MailButton.tsx`; no `ApartmentDesk`, encomendas na portaria com "Retirada" (escolher a pessoa), "Correspondência" e "Receber encomenda"
- [X] T029 [P] [US2] No `ResidentDeliveries`, cartão "Na portaria" com foto ampliável, quem recebeu, há quantos dias, e "Retirei"
- [X] T030 [US2] Páginas `web/app/front-desk/receive-delivery/page.tsx` (`?n=` opcional) e `web/app/front-desk/mail/page.tsx`; `OWN_PAGES`; `npx next typegen`; textos nos três idiomas
- [X] T031 [US2] Seed v4 — encomenda média da Amazon no 804 com foto (uma imagem JPEG pequena fixa, embutida como `data:image/jpeg;base64` em `seed-front-desk.ts`, porque o seed também roda nos testes em Node, sem canvas), Shopee retirada ontem, 3 encomendas na portaria em outros aptos (uma há 4 dias), uma correspondência; asserções em `seed-v4.test.ts`

**Ponto de controle**: H1 e H2 passam juntas.

---

## Fase 5: História 3 — Visitantes e prestadores (P3)

**Objetivo**: morador avisa; portaria vê os esperados, confirma a entrada, registra sem cadastro; histórico.

**Teste independente**: o 804 avisa Mariana (hoje 19h–21h, 2 pessoas); a portaria toca "Chegou"; o morador vê "Chegou às …, liberado por …".

### Testes

- [X] T032 [P] [US3] Escrever `web/tests/unit/visitors.test.ts`: `register` por qualquer pessoa ativa do apto (esclarecimento 3), validações (dia no passado ou além de 30 dias, `fromTime` ≥ `toTime`, `people` fora de 1–20); `mine` só do próprio apto; `cancel` por quem avisou ou pelo responsável (outro morador → `forbidden`); `today` (só portaria) em ordem de horário; `checkIn` grava hora e porteiro e avisa quem avisou e o responsável (preferência "Visitantes", RF-013a); `walkIn` com marca sem cadastro avisa todas as pessoas ativas do apto; visitante com a faixa de horário já passada continua em `today().expected` até o fim do dia; nenhum campo de documento existe no esquema (RF-014)
- [X] T033 [P] [US3] Escrever `web/tests/e2e/visitors.spec.ts`: morador avisa visita → portaria vê em Esperados → "Chegou" → morador vê no histórico; prestador mostra "Interfone antes de liberar"; "Visitante sem cadastro"

### Implementação

- [X] T034 [US3] Implementar `web/src/services/visitors.ts`; registrar em `core.ts`
- [X] T035 [P] [US3] Criar `web/src/components/visitors/ResidentVisitors.tsx` (mockup 17: "Avisar visitante", Esperados com marca Hoje/Amanhã, Histórico) e `web/src/components/visitors/VisitorForm.tsx` (visita ou prestador, nome, dia, faixa de horário, pessoas)
- [X] T036 [P] [US3] Criar `web/src/components/desk/DeskVisitors.tsx` (mockup 35: Esperados com "Chegou" grande, prestador com "Interfone antes de liberar", Já entraram, "Visitante sem cadastro") e os visitantes esperados no `DeskHome`
- [X] T037 [US3] Páginas `web/app/resident/visitors/page.tsx`, `web/app/resident/visitor/new/page.tsx`, `web/app/front-desk/visitors/page.tsx`; `OWN_PAGES`; `npx next typegen`; textos nos três idiomas
- [X] T038 [US3] Seed v4 — Mariana Costa (804, hoje 19h–21h, 2 pessoas), técnico da Claro (302, hoje 8h–12h), Pedro Henrique (804, entrou ontem, liberado por Jonas), Rafael Dias (507, não veio anteontem); asserções em `seed-v4.test.ts`

**Ponto de controle**: H3 funciona sobre a fundação.

---

## Fase 6: História 4 — Tela simples e falar em vez de escrever (P4)

**Objetivo**: microfone em todo campo de texto da portaria; recado ditado ao síndico; transformar em aviso.

**Teste independente**: a portaria dita "O elevador social está parado", corrige e envia; o síndico abre e transforma em aviso.

### Testes

- [X] T039 [P] [US4] Escrever `web/tests/unit/memos.test.ts`: `send` só portaria (texto 2–1.000) notifica os síndicos com `memo` só no app; `list`/`markSeen`/`linkNotice` só síndico; morador → `forbidden`
- [X] T040 [P] [US4] Escrever `web/tests/e2e/dictate.spec.ts` com um reconhecimento de fala falso injetado por `addInitScript` (fala "O elevador social está parado"): portaria → "Ditar recado" → microfone → texto aparece → corrigir → Enviar; síndico → sino → "Recados da portaria" → "Transformar em aviso" → formulário do aviso com o texto; sem reconhecimento (script que remove `SpeechRecognition`) → "Ditar não está disponível neste aparelho" e o campo aceita digitação

### Implementação

- [X] T041 [US4] Criar `web/src/voice/speech.ts` (detecção, idioma pelo `locale`, resultados parciais, erros de permissão) e `web/src/voice/DictateButton.tsx` (botão ≥ 56 px, estado gravando com rótulo acessível, aviso sem suporte) (research R5)
- [X] T042 [US4] Acrescentar o `DictateButton` aos campos de texto livre da portaria já existentes (`ReceiveDelivery` quando a loja for "Outro", visitante sem cadastro, recado); o formulário de achados nasce com ele no T056
- [X] T043 [US4] Implementar `web/src/services/memos.ts`; criar `web/src/components/desk/DictateMemo.tsx` (mockup 33: microfone grande, transcrição editável, "Corrigir" e "Enviar ao síndico") e `web/src/components/memos/MemosScreen.tsx` (lista, Visto, "Transformar em aviso" → `/manager/notice/edit/?memo=<id>`); o `NoticeForm` da spec 003 lê `?memo=` para preencher o texto e chama `linkNotice` ao publicar
- [X] T044 [US4] Páginas `web/app/front-desk/dictate/page.tsx` e `web/app/manager/memos/page.tsx`; a notificação `memo` leva a `/manager/memos/`; `OWN_PAGES`; `npx next typegen`; textos nos três idiomas
- [X] T045 [US4] Seed v4 — recado "Lâmpada do hall do 3º andar queimada" (ontem, não visto) com a notificação da síndica; asserções em `seed-v4.test.ts`

**Ponto de controle**: H4 funciona; todos os botões do `DeskHome` levam a telas prontas (exceto Achados até a US6).

---

## Fase 7: História 5 — Modo viagem e equipe de plantão (P5)

**Objetivo**: viagem visível à portaria e sem lembretes; plantão automático pela escala.

**Teste independente**: o 804 ativa viagem de 5 dias; a portaria vê "Em viagem até"; "Equipe de plantão" mostra o turno atual.

### Testes

- [X] T046 [P] [US5] Escrever `web/tests/unit/travel.test.ts`: `start` só com `canRegisterDeliveries` do próprio apto; volta antes da ida ou mais de 120 dias → `validation`; um ativo por apto (novo substitui); `end`; deixa de valer no dia seguinte à volta; a portaria vê `travelUntil` no `overview` e no painel
- [X] T047 [P] [US5] Escrever `web/tests/unit/staff-board.test.ts`: segunda 09:00 → porteiro do turno 6–14 e as duas faxineiras; 23:30 de sábado e 03:00 de domingo → turno 22–6 de sábado (CS-007); `next` traz os turnos seguintes de hoje e amanhã em ordem; horário sem escala → `now` vazio
- [X] T048 [P] [US5] Escrever `web/tests/e2e/on-duty.spec.ts`: morador ativa viagem → portaria vê "Em viagem até dd/mm" no 804 e em "Apartamentos em viagem"; "Equipe de plantão" com "De plantão" e próximos turnos

### Implementação

- [X] T049 [US5] Implementar `web/src/services/travel.ts` e `staff.board` em `web/src/services/legacy.ts` (research R6)
- [X] T050 [P] [US5] Criar `web/src/components/travel/TravelMode.tsx` (ida e volta, ativo com "Encerrar"), `web/src/components/staff/OnDuty.tsx` (mockup 14: Agora, Próximos turnos, nota da escala; recarrega a cada minuto) e `web/src/components/desk/TravelWatch.tsx`
- [X] T051 [US5] Páginas `web/app/resident/travel-mode/page.tsx`, `web/app/resident/on-duty/page.tsx`, `web/app/front-desk/on-duty/page.tsx`, `web/app/manager/on-duty/page.tsx`, `web/app/front-desk/travel-watch/page.tsx`; `OWN_PAGES`; `npx next typegen`; textos nos três idiomas
- [X] T052 [US5] Seed v4 — 1003 em viagem até daqui a 6 dias; asserções em `seed-v4.test.ts`

**Ponto de controle**: H5 funciona; o lembrete do `runDue` pula o apto em viagem.

---

## Fase 8: História 6 — Achados e perdidos (P6)

**Objetivo**: portaria registra achados; morador diz "é meu" e avisa perdidos; devolução e "Encontrei".

**Teste independente**: a portaria registra um chaveiro com foto; o 804 toca "É meu"; a portaria marca Devolvido.

### Testes

- [X] T053 [P] [US6] Escrever `web/tests/unit/lostfound.test.ts`: `registerFound`, `markReturned`, `markFound` só portaria; `claim` e `reportLost` só morador; `claim` avisa os porteiros com `lost-found` só no app e marca `claimed`; `markFound` avisa as pessoas do apto dono; achados `open` com mais de 60 dias somem da lista dos moradores; todos os perfis veem a lista
- [X] T054 [P] [US6] Escrever `web/tests/e2e/lostfound.spec.ts`: portaria registra achado com foto e descrição (ditada com o reconhecimento falso) → morador vê e toca "É meu" → portaria vê o pedido e marca "Devolvido" ao 804 → em Devolvidos; morador avisa perdido → portaria "Encontrei" → morador é avisado

### Implementação

- [X] T055 [US6] Implementar `web/src/services/lostfound.ts`; registrar em `core.ts`
- [X] T056 [P] [US6] Criar `web/src/components/lostfound/LostFound.tsx` (mockup 16: abas Achados (N), Perdidos (N), Devolvidos; "É meu", "Encontrei"; botão "+" do perfil; só leitura para o síndico) e `web/src/components/lostfound/LostFoundForm.tsx` (achado com foto e local pela portaria, com `DictateButton` na descrição e no local; perdido pelo morador)
- [X] T057 [US6] Páginas `web/app/resident/lost-and-found/page.tsx`, `web/app/front-desk/lost-and-found/page.tsx` e `web/app/manager/lost-and-found/page.tsx` (só leitura); o botão "Achados" do `DeskHome` passa a levar a ela; `OWN_PAGES`; `npx next typegen`; textos nos três idiomas
- [X] T058 [US6] Seed v4 — chaveiro (hoje), guarda-chuva azul (ontem, reclamado pelo 502), bichinho de pelúcia (há 7 dias), perdido: óculos de grau (1203, há 2 dias); asserções em `seed-v4.test.ts`

**Ponto de controle**: as 6 histórias passam juntas.

---

## Fase 9: Acabamento e transversais

- [X] T059 Central de notificações (spec 003): ícones e destinos dos tipos novos (`delivery*`, `mail` → `/resident/deliveries/`; `visitor` → `/resident/visitors/`; `lost-found` → achados do perfil; `memo` → `/manager/memos/`) em `web/src/components/notifications/NotificationsScreen.tsx`; preferências "Entregas" e "Visitantes" sem a nota "nas próximas etapas"
- [X] T060 [P] Início do morador: atalho "Entregas na portaria (N)" e próximo visitante em `web/src/components/home/CommHighlights.tsx`
- [X] T061 [P] Acrescentar as telas novas a `web/tests/e2e/accessibility.spec.ts` (axe nas quatro aparências: entregas, novo código, visitantes, viagem, plantão, achados, início e painel da portaria, receber encomenda, ditar, recados) e conferir botões da portaria ≥ 56 px
- [X] T062 [P] Conferir `web/tests/unit/messages.test.ts` (chaves iguais e parâmetros ICU) e ajustar `IGUAIS_EM_ESPANHOL` se preciso (RF-025)
- [X] T063 Conferir o seed v4 completo contra `data-model.md` e RF-026 e que "Restaurar dados de exemplo" recria tudo relativo ao dia
- [X] T064 Rodar `npx vitest run`, `npm run lint`, `npx tsc --noEmit`, o e2e completo, `make e2e-build` e `make e2e-build-real` (sem `whatsappInbox` nem simulação no real) e `make perf`
- [X] T065 Documentação: `docs/documentacao/02-funcionalidades.md` (Portaria → "Em construção"), `docs/documentacao/03-arquitetura.md` (entregas e estados, mensagens recebidas, ditar, pastas novas), `docs/backlog.md` (Etapa 3: webhook do WhatsApp para códigos, foto no privado e no R2, pytest das regras da portaria; Administração: rodízio de folgas e edição da escala) e `docs/changelog.md`
- [X] T066 Validar os 18 cenários de `specs/004-portaria/quickstart.md` (automáticos onde houver teste; o resto no ambiente ligado) — cobertos pelos e2e de entregas, visitantes, ditar, plantão e achados, pelos unitários com relógio e pelo teste de traduções; a conferência no celular de verdade (câmera e ditar) fica no backlog

---

## Dependências e ordem

- **Fase 1 → Fase 2 → histórias.** A fundação (esquemas, banco v4, permissões, canais, `runDue`) bloqueia tudo.
- **US1** não depende de outra história. **US2** usa as entregas e o painel da US1. **US3**, **US5** e **US6** dependem
  só da fundação (e do `DeskHome` da US1 para os botões). **US4** usa os formulários da US2, US3 e US6 para o
  microfone; o recado em si só depende da fundação.
- **Seed v4**: a base (T005) fica na Fundação; cada história acrescenta o seu conteúdo antes dos próprios testes
  e2e dependerem dele (T023, T031, T038, T045, T052, T058). T063 só confere o conjunto.
- **Fase 9** depois das histórias desejadas.

### Paralelo

- Fase 2: T008 e T010 (testes) juntos; T003→T004→T005 em sequência.
- Em cada história: os testes [P] juntos; os componentes [P] juntos depois do serviço.
- Depois da US1: US3, US5 e US6 em paralelo.

Exemplo (US3):

```text
T032 visitors.test.ts  ‖  T033 visitors.spec.ts
→ T034 visitors.ts
→ T035 ResidentVisitors/VisitorForm  ‖  T036 DeskVisitors
→ T037 páginas → T038 seed
```

## Estratégia

1. **MVP**: Fases 1, 2 e 3 (códigos de entrega pelo app e pelo WhatsApp, encontrados pela portaria).
2. Incrementos: + US2 (encomenda com foto e retirada) → + US3 (visitantes) → + US4 (voz e recados) → + US5 (viagem e
   plantão) → + US6 (achados) → Fase 9.
3. Cada incremento termina com os testes passando e a demonstração no ambiente ligado.
