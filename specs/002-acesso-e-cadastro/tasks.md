---
description: "Lista de tarefas da spec 002 — Acesso e cadastro"
---

# Tarefas: Acesso e cadastro

**Entrada**: documentos de `specs/002-acesso-e-cadastro/`

**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Testes**: obrigatórios pela constituição (princípio VII). Em cada história, os testes vêm antes da implementação e
devem falhar primeiro. Todo texto novo nos três idiomas (RF-032); depois de criar rotas, `cd web && npx next typegen`.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[USn]**: história da spec (US1 = História 1 … US5 = História 5)
- Caminhos relativos à raiz do repositório

---

## Fase 1: Configuração

- [ ] T001 Instalar `libphonenumber-js` em `web/package.json` (research R5)
- [ ] T002 [P] Acrescentar ao catálogo `web/src/navigation/screens.ts` os itens `residents` (ícone `Users`, grupo `building`) e `rules` (ícone `FileText`, grupo `building`) em "Mais" da portaria, e o título `screens.residents` já existente servir também à portaria; atualizar `web/tests/unit/screens.test.ts` (contracts/rotas.md)

---

## Fase 2: Fundação (bloqueia todas as histórias)

**⚠️ CRÍTICO**: nenhuma história começa antes desta fase.

### Celular, placa e foto

- [ ] T003 [P] Escrever testes de celular em `web/tests/unit/phone.test.ts`: `(21) 98765-4321`, `21987654321` e `+55 21 98765-4321` viram `+5521987654321`; número sem DDD é recusado; Portugal `912 345 678` com país PT vira `+351912345678`; `+5500900000001` é aceito só nos modos `dev`/`demo`
- [ ] T004 [P] Escrever testes de placa em `web/tests/unit/plate.test.ts`: aceita `ABC-1234`, `abc1234`, `ABC1D23`; guarda "maiúsculas sem hífen"; recusa `AB1234` e `ABCD123`; exibe `ABC-1234` no formato antigo
- [ ] T005 [P] Escrever teste da foto em `web/tests/unit/photo.test.ts`: uma imagem de 2000 × 1500 px sai com o maior lado = 512 px, como `data:image/jpeg` (canvas simulado)
- [ ] T006 Implementar `normalizePhone(input, country)`, `isAcceptedPhone(e164, mode)` e `formatPhone(e164, locale)` com `libphonenumber-js` (min) em `web/src/phone/phone.ts`
- [ ] T007 [P] Implementar `normalizePlate`, `isValidPlate` e `formatPlate` em `web/src/domain/plate.ts` (data-model: `^[A-Z]{3}\d{4}$` antiga, `^[A-Z]{3}\d[A-Z]\d{2}$` Mercosul)
- [ ] T008 [P] Implementar `resizePhoto(file): Promise<string>` (máximo 512 × 512 px, JPEG qualidade 0,8, `createImageBitmap` + canvas) em `web/src/photo/resize.ts`
- [ ] T009 Criar o componente `PhoneInput` (país com Brasil +55 primeiro, nomes por `Intl.DisplayNames` no idioma do app, campo com teclado numérico, área de toque ≥ 44 px, mensagens de erro traduzidas) em `web/src/phone/PhoneInput.tsx`

### Modelo de dados e seed v2

- [ ] T010 Ampliar os esquemas Zod em `web/src/services/schemas.ts` com `Person` (`name` "obrigatório, 2–120"; `phone` E.164 "único por condomínio"; `photo` "data:image/jpeg… de no máximo 512 × 512 px" ou nulo; `firstAccessAt`, `welcomeSeenAt`, `rulesAcceptedAt`, `removedAt` data ou nulo), `Residency` (substitui `Resident`: `kind` `owner|tenant|family`, `isResponsible`, `canRegisterDeliveries` "padrão true; sempre true se isResponsible", `canVotePolls` "padrão false; sempre true se isResponsible", `invitedById`, `invitedAt`, `lastInviteAt`), `Staff.personId` nulo para faxineiros, `ManagerAssignment`, `Vehicle` (`plate` "maiúsculas sem hífen… única por condomínio", `model` 1–60, `color` 1–30), `Pet` (`name` 1–60, `kind` `dog|cat|bird|other`), `EmergencyContact` ("único por apartamento", `name` 2–120, `relationship` 2–40, `phone` E.164), `Rule` (`topic` `coexistence|elevator-moves|waste|pets|garage|common-areas`, `title`, `body`, `order`), `OtpRequest`, `Session` (`endReason` `signed-out|removed|phone-changed|inactive`) e `OutboxMessage` (`kind` `otp|invite`)
- [ ] T011 Ampliar `web/src/services/contracts.ts` com `Role`, `Actor`, `ServiceContext.actor`, o código `rate_limited` e as interfaces de `contracts/servicos.md` (`AuthService`, `OnboardingService`, `PeopleService`, `ResidencyService`, `ApartmentAdminService`, `ApartmentDataService`, `FrontDeskDirectoryService`, `RulesService`, `OutboxService`, `SessionView`, `ResidentView`, `ApartmentOverview`)
- [ ] T012 [P] Escrever teste do seed v2 em `web/tests/unit/seed-v2.test.ts`: síndica com dois papéis (moradora do 1201 e síndica); 3 porteiros com pessoa e 2 faxineiros sem; 902 com responsável pendente; 303, 704 e 1102 sem responsável; celulares únicos e com DDD `00`; um responsável por apartamento com moradores; responsáveis com as duas permissões; 10 a 15 regras nos 6 temas; "contas de exemplo" com síndica, porteiro, responsável, familiar e convite pendente
- [ ] T013 Reescrever `web/src/services/local/seed.ts` para `SEED_VERSION = 2` conforme data-model.md (pessoas, moradores, síndica, porteiros com pessoa, carros, animais, contatos, regras de exemplo baseadas no minimundo e a lista `EXAMPLE_ACCOUNTS`)
- [ ] T014 Ampliar o IndexedDB em `web/src/services/local/db.ts` (versão 2 do banco: lojas `people`, `residencies`, `managers`, `vehicles`, `pets`, `emergencyContacts`, `rules`, `otpRequests`, `sessions`, `outbox`, índices por `condominiumId`, `phone`, `apartmentId`, `personId`, `deviceId`; migração que apaga as lojas da versão 1) e a implementação em memória em `web/src/services/memory/index.ts`
- [ ] T015 Adaptar os serviços da spec 001 (`residents.listByApartment`, `residents.get`, `dev.counts`) à nova visão `ResidentView` em `web/src/services/core.ts`, mantendo os testes de `web/tests/unit/services-local.test.ts` e `services-memory.test.ts` verdes (atualizar contagens para o seed v2)

### Permissões e sessão

- [ ] T016 [P] Escrever o teste da matriz em `web/tests/unit/permissions.test.ts`: uma asserção por célula de `contracts/permissoes.md` (responsável, outro morador, portaria, síndico), incluindo `forbidden` para ação proibida e `not_found` para alvo de outro apartamento ou condomínio; e uma coluna "sem ninguém conectado": cada ação da matriz, e cada método de leitura dos serviços (inclusive os da spec 001), chamada sem `actor` → `forbidden` (RF-030)
- [ ] T017 Implementar `can(actor, action, target)` e `assertCan(...)` (lança `ServiceError`; sem `actor` → `forbidden`) com a matriz de `contracts/permissoes.md` em `web/src/services/permissions.ts`, e exigir `actor` em todos os serviços exceto `auth`
- [ ] T018 Implementar o `deviceId` (`terreo:device` no `localStorage`, criado uma vez) e o hook `useSession()` (sessão atual via `auth.current`, atualiza ao entrar/sair/trocar papel; no build estático, "carregando") em `web/src/auth/session.ts`
- [ ] T019 Substituir o `ProfileGuard` por `AccessGuard` em `web/src/auth/AccessGuard.tsx` com as 5 regras da guarda de `contracts/rotas.md` (sem sessão → `/login/` guardando a rota pedida; vários papéis → `/choose-role/`; morador com `needsWelcome`/`needsRulesAcceptance` → `/welcome/`/`/rules-accept/`; prefixo de outro papel → aviso; modo `real` → "Entrada em breve") e usá-lo em `web/src/components/layout/ProfileShell.tsx`
- [ ] T020 Atualizar `getServices()` em `web/src/services/index.ts` para montar os serviços novos, entregar `OutboxService` só nos modos `dev`/`demo` e expor `window.__terreoDev.signInAs(phone, roleKind?)` só nesses modos (research R8)
- [ ] T021 Atualizar `web/tests/e2e/helpers.ts` com `signInAs(page, conta)` (usa `__terreoDev`) e as contas de exemplo, e trocar nos testes da spec 001 (`navigation`, `preferences`, `accessibility`, `pwa`, `demo-build`) o uso de `withPrefs({ profile })` por `signInAs`; ajustar `navigation.spec.ts` (H1-1, H1-7) para a nova página inicial de entrada

**Ponto de controle**: `npx vitest run` e os e2e da spec 001 verdes com a sessão no lugar da escolha de perfil.

---

## Fase 3: História 1 — Entrar com celular e código (P1) 🎯 MVP

**Objetivo**: entrar, continuar conectado, sair, escolher o papel.

**Teste independente**: entrar com morador, porteiro e síndica; fechar e abrir continua conectado; sair pede código.

### Testes da História 1

- [ ] T022 [P] [US1] Escrever testes do serviço de entrada em `web/tests/unit/auth.test.ts`: número desconhecido → `unknown` sem `OtpRequest`; pessoa removida → `unknown`; código de 6 dígitos; 10 min de validade (relógio simulado); 5 erros invalidam; novo pedido invalida o anterior; reenvio só após 60 s; 6º pedido na hora → `rate_limited`; o código não fica guardado em texto (só `codeHash` e `salt`); convite pendente pode entrar e passa a `active`
- [ ] T023 [P] [US1] Escrever testes da sessão em `web/tests/unit/session.test.ts`: `current` com sessão válida atualiza `lastSeenAt`; 181 dias sem uso → `null` e `endReason: inactive`; `signOut` encerra; remover a pessoa encerra todas as sessões; trocar o celular encerra as sessões; `chooseRole` com papel de outra pessoa → `forbidden`; pessoa com um papel tem `activeRole` automático
- [ ] T024 [P] [US1] Escrever e2e em `web/tests/e2e/login.spec.ts`: H1-1 a H1-9 da spec (número cadastrado, código certo, número não cadastrado, código errado, reenvio bloqueado por 60 s, continuar conectado, sair), a escolha de papel da síndica (CS-009, até 3 toques para trocar), sem internet "É preciso internet para entrar" (caso-limite) e o tempo do número digitado até o Início menor que 1 min sem contar a espera (CS-001)

### Implementação da História 1

- [ ] T025 [US1] Implementar o `AuthService` local (research R3/R4: hash SHA-256 com sal via `crypto.subtle`, `crypto.getRandomValues`, limites, `OutboxMessage` com o texto do WhatsApp, sessões por `deviceId`) em `web/src/services/auth.ts`
- [ ] T026 [P] [US1] Implementar o `OutboxService` (última mensagem por número, lista) em `web/src/services/outbox.ts`
- [ ] T027 [US1] Criar a tela de entrada (logo, celular com `PhoneInput`, botão azul da marca com ícone do WhatsApp "Receber código no WhatsApp", aviso "Sem senha…", "Contas de exemplo" só em `dev`/`demo`, "Entrada em breve" no `real`; sem conexão, botão bloqueado com "É preciso internet para entrar") em `web/app/login/page.tsx` e `web/src/components/auth/LoginScreen.tsx`
- [ ] T028 [US1] Criar a tela do código (6 caixas com teclado numérico e colar, número de destino, "Reenviar em 0:59", mensagens de errado/expirado, aviso com a mensagem simulada em `dev`/`demo`; sem conexão, "Confirmar" bloqueado com o mesmo aviso) em `web/app/login/code/page.tsx` e `web/src/components/auth/CodeScreen.tsx`
- [ ] T029 [US1] Criar a escolha de papel ("Morador do 1201", "Síndico", "Portaria") em `web/app/choose-role/page.tsx`
- [ ] T030 [US1] Trocar a página inicial pelo redirecionamento (sem sessão → `/login/`, com sessão → início do papel) em `web/app/page.tsx`, removendo `web/src/components/home/ProfilePicker.tsx`
- [ ] T031 [US1] Em `web/src/components/settings/SettingsScreen.tsx`: trocar "Trocar perfil" por "Trocar papel" (só com mais de um papel) e "Sair" (pede confirmação)
- [ ] T032 [US1] Textos de entrada, código, papéis e erros em `web/messages/pt.json`, `en.json`, `es.json`

**Ponto de controle**: História 1 funcionando e testada sozinha.

---

## Fase 4: História 2 — Boas-vindas e regras (P2)

**Teste independente**: primeiro acesso de morador passa por boas-vindas e regras; no segundo, vai direto.

- [ ] T033 [P] [US2] Escrever testes em `web/tests/unit/onboarding.test.ts`: `markWelcomeSeen` e `acceptRules` gravam data; `needsWelcome`/`needsRulesAcceptance` só para papel de morador; busca nas regras sem acento e sem diferenciar maiúsculas
- [ ] T034 [P] [US2] Escrever e2e em `web/tests/e2e/onboarding.spec.ts`: H2-1 a H2-6 (boas-vindas com prédio e apartamento, até 4 passos, pular, "Li e concordo" obrigatório, não aparece de novo, porteiro e síndico não passam)
- [ ] T035 [US2] Implementar `OnboardingService` e `RulesService` (agrupado por tema, busca normalizada) em `web/src/services/onboarding.ts` e `web/src/services/rules.ts`
- [ ] T036 [US2] Criar as boas-vindas (4 passos com indicador, "Pular", "Começar", nome do prédio, apartamento e tipo) em `web/app/welcome/page.tsx` e `web/src/components/onboarding/Welcome.tsx`; reaproveitar em `web/app/resident/welcome/page.tsx`
- [ ] T037 [US2] Criar a lista de regras com busca (componente `RulesList`) em `web/src/components/rules/RulesList.tsx` e as páginas `web/app/rules-accept/page.tsx` (com "Li e concordo com as regras"), `web/app/resident/rules/page.tsx`, `web/app/front-desk/rules/page.tsx`, `web/app/manager/rules/page.tsx`
- [ ] T038 [US2] Textos de boas-vindas e regras (interface) nos três idiomas em `web/messages/*.json`

---

## Fase 5: História 3 — O responsável cuida das pessoas do apartamento (P3)

**Teste independente**: responsável convida, edita e remove; familiar não consegue.

- [ ] T039 [P] [US3] Escrever testes em `web/tests/unit/residency.test.ts`: convite cria pessoa pendente com as permissões escolhidas e `OutboxMessage` de convite; celular em uso → `validation` (`details.phone = "in_use"`); responsável não remove a si mesmo; responsável não perde permissões; remover encerra sessões; reenviar só para pendente; familiar → `forbidden` em `invite`, `update`, `remove`
- [ ] T040 [P] [US3] Escrever e2e em `web/tests/e2e/household.spec.ts` (convidar em menos de 1 min, CS-004): H3-1 a H3-8 (lista com "Você", "Responsável", "Convite pendente"; convidar; convidado entra e deixa de estar pendente; editar; remover com confirmação; celular em uso; familiar só vê; responsável não se remove)
- [ ] T041 [US3] Implementar `ResidencyService` (`listByApartment`, `get`, `invite`, `update`, `remove`, `resendInvite`) com `assertCan` em `web/src/services/residency.ts`
- [ ] T042 [US3] Criar a seção "Moram no apto" do Perfil (avatar com iniciais, marcas, "Convite pendente · enviado há N dias", "Convidar" só para o responsável) em `web/src/components/profile/Household.tsx`
- [ ] T043 [US3] Criar a tela de convite (nome, `PhoneInput`, tipo, "Pode cadastrar entregas" ligado, "Pode votar em enquetes — Só um voto por apartamento" desligado, "Enviar convite no WhatsApp") em `web/app/resident/invite/page.tsx`
- [ ] T044 [US3] Criar a tela da pessoa (ver; editar nome, tipo, permissões e celular com `PhoneInput` — a troca de celular avisa que encerra o acesso no número antigo (RF-021) —, reenviar e remover com confirmação, só para o responsável) em `web/app/resident/person/page.tsx`
- [ ] T045 [US3] Textos nos três idiomas em `web/messages/*.json`

---

## Fase 6: História 4 — Perfil, carros, animais e contato de emergência (P4)

**Teste independente**: responsável edita e cadastra; familiar vê e só edita o próprio perfil.

- [ ] T046 [P] [US4] Escrever testes em `web/tests/unit/apartment-data.test.ts`: placa inválida → `validation`; placa repetida no condomínio → `validation`; um contato de emergência por apartamento; familiar → `forbidden` ao salvar carro/animal/contato; `updateOwnProfile` não aceita celular; outro apartamento → `not_found`
- [ ] T047 [P] [US4] Escrever e2e em `web/tests/e2e/profile.spec.ts`: H4-1 a H4-6 (editar nome e foto, explicação ao tentar mudar o celular, carro `ABC1D23`, animal, contato de emergência e "Opcional · não informado", nenhum campo de CPF/nascimento/documento)
- [ ] T048 [US4] Implementar `PeopleService.updateOwnProfile` e `ApartmentDataService` em `web/src/services/people.ts` e `web/src/services/apartment-data.ts`
- [ ] T049 [US4] Criar o Perfil completo (cartão da pessoa, "Moram no apto", "Carros e animais", contato de emergência, "Sair") em `web/app/resident/profile/page.tsx`
- [ ] T050 [US4] Criar editar perfil (nome, foto com `resizePhoto`, explicação do celular) em `web/app/resident/profile/edit/page.tsx`
- [ ] T051 [P] [US4] Criar as telas de carro, animal e contato de emergência (celular com `PhoneInput`, RF-001a) em `web/app/resident/vehicle/page.tsx`, `web/app/resident/pet/page.tsx` e `web/app/resident/emergency-contact/page.tsx`
- [ ] T052 [US4] Textos nos três idiomas em `web/messages/*.json`

---

## Fase 7: História 5 — O síndico cadastra apartamentos e acompanha os convites (P5)

**Teste independente**: filtrar "sem cadastro", cadastrar o responsável do 303, entrar com ele, ver "Ativo".

- [ ] T053 [P] [US5] Escrever testes em `web/tests/unit/apartment-admin.test.ts`: `overview` com totais (48 apartamentos, 12 andares) e contagens dos filtros; busca por número e por nome sem acento; `registerResponsible` em apto com responsável → `validation`; celular em uso → `validation`; `setResponsible` atualiza permissões; remover o responsável deixa `responsibleResidentId` nulo, as outras pessoas continuam entrando e `overview` mostra o apartamento sem responsável; morador e portaria → `forbidden`
- [ ] T054 [P] [US5] Escrever testes em `web/tests/unit/directory.test.ts`: a portaria recebe só nome, foto, tipo e carros (comparar as chaves exatas do objeto, CS-007a); pessoas pendentes e removidas não aparecem; morador e síndico → `forbidden` no diretório da portaria
- [ ] T055 [P] [US5] Escrever e2e em `web/tests/e2e/manager-residents.spec.ts` (H5-1 a H5-8; cadastrar um responsável em menos de 1 min e achar um apartamento pela busca em menos de 10 s, CS-005) e `web/tests/e2e/front-desk-directory.spec.ts` (portaria consulta o 804 e não vê celular, animal nem contato)
- [ ] T056 [US5] Implementar `ApartmentAdminService` e `FrontDeskDirectoryService` em `web/src/services/apartment-admin.ts` e `web/src/services/directory.ts`
- [ ] T057 [US5] Criar a lista de apartamentos do síndico (título com totais, busca, filtros com contagem, situação "Ativo"/"Convite pendente há N dias"/"Sem cadastro", botão + para cadastrar) em `web/app/manager/residents/page.tsx`
- [ ] T058 [US5] Criar o detalhe do apartamento (pessoas, carros, animais; editar/remover pessoa; reenviar convite; trocar responsável) e o cadastro do responsável (nome, `PhoneInput`, tipo; aviso "Não pedimos CPF nem data de nascimento…"; "Salvar e enviar convite") em `web/app/manager/apartment/page.tsx`, `web/app/manager/apartment/register/page.tsx` e `web/app/manager/person/page.tsx`
- [ ] T059 [US5] Criar a consulta da portaria (grade de números com busca, nome, foto, tipo e carros, botões grandes) em `web/app/front-desk/residents/page.tsx`
- [ ] T060 [US5] Textos nos três idiomas em `web/messages/*.json`

---

## Fase 8: Acabamento

- [ ] T061 [P] Acrescentar as telas novas à auditoria de acessibilidade nas quatro aparências em `web/tests/e2e/accessibility.spec.ts` (entrada, código, papéis, boas-vindas, regras, perfil, convite, apartamentos do síndico, consulta da portaria)
- [ ] T062 [P] Mostrar no painel `/dev` as mensagens simuladas (caixa de saída) e as contagens novas em `web/src/dev/DevTools.tsx`
- [ ] T063 [P] Atualizar `docs/documentacao/02-funcionalidades.md` (login, cadastro de apartamentos, convite, perfil, boas-vindas e regras → "Em construção") e `docs/documentacao/03-arquitetura.md` (pessoa e papéis, sessão no aparelho provisória, envio simulado, consulta restrita da portaria, pastas novas)
- [ ] T064 Conferir que o modo `real` não tem `__terreoDev`, contas de exemplo nem código na tela: `scripts/build.mjs` aceita a pasta de saída; `npm run build:real` gera `web/out-real/` com `NEXT_PUBLIC_APP_MODE=real`; o Playwright, com `E2E_BUILD=real`, serve `out-real` na porta 3201 e roda os testes `@build-real` de `web/tests/e2e/real-build.spec.ts` (`/login/` mostra "Entrada em breve", `window.__terreoDev` indefinido, `/dev/` 404); alvo `e2e-build-real` no `Makefile`; `out-real/` no `.gitignore`
- [ ] T065 Rodar lint, testes unitários, e2e (desenvolvimento e @build) e Lighthouse e corrigir o que falhar
- [ ] T066 Executar os 21 cenários de `specs/002-acesso-e-cadastro/quickstart.md` e registrar o resultado
- [ ] T067 Atualizar `docs/backlog.md`, `docs/changelog.md` e gerar o PDF com `uv run scripts/gerar_pdf.py`

---

## Dependências e ordem de execução

- **Fase 1 → Fase 2 → histórias.** A Fase 2 troca a escolha de perfil pela sessão; sem ela nada funciona.
- **US1** depende só da Fase 2. **US2** usa a entrada da US1 para chegar ao primeiro acesso (os testes unitários
  podem começar antes). **US3, US4 e US5** dependem da Fase 2 e usam `signInAs` nos e2e, sem depender da tela de
  entrada; podem andar em paralelo entre si.
- Dentro de cada história: testes → serviço → telas → textos.

### Paralelismo

- Fase 2: T003–T005, T012 e T016 (testes) em paralelo; T007 e T008 em paralelo com T006.
- US3, US4 e US5 em paralelo depois da Fase 2 (arquivos de serviço e páginas diferentes; os `messages/*.json` são
  editados em sequência).

```bash
# Fundação — testes juntos:
T003 phone.test.ts · T004 plate.test.ts · T005 photo.test.ts · T012 seed-v2.test.ts · T016 permissions.test.ts
# Depois da Fundação:
US3 (residency) · US4 (apartment-data/people) · US5 (apartment-admin/directory)
```

## Estratégia de implementação

1. **MVP**: Fases 1 e 2 + US1 → entrar e sair de verdade com as contas de exemplo; validar cenários 1 a 7.
2. US2 → primeiro acesso completo.
3. US3 e US4 → o morador cuida do apartamento e do perfil.
4. US5 → o síndico cadastra o prédio; a portaria consulta.
5. Fase 8 → acessibilidade, documentação, PDF.

## Observações

- Commits por fase ou grupo lógico, `<prefixo em inglês>: <descrição em português>`, sem coautor de IA, só quando o
  desenvolvedor pedir.
