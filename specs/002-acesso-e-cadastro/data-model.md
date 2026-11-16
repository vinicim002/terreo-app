# Modelo de dados: Acesso e cadastro

Continua o `specs/001-base-do-app/data-model.md`. Mesmas regras gerais: `id` UUID, `condominiumId` em toda entidade
do condomínio (com filtro obrigatório), datas ISO 8601 em UTC, esquemas Zod como fonte dos tipos, identificadores em
inglês. Dados de exemplo sobem para `SEED_VERSION = 2`.

## Person (Pessoa) — nova

| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | |
| condominiumId | uuid | → Condominium |
| name | texto | obrigatório, 2–120 caracteres |
| phone | texto | E.164 (`+` e 10 a 15 dígitos); **único por condomínio** (RF-017) |
| photo | texto ou nulo | `data:image/jpeg;base64,…`, imagem de no máximo 512 × 512 px (RF-025) |
| firstAccessAt | data e hora ou nulo | nulo = ainda não entrou (convite pendente) |
| welcomeSeenAt | data e hora ou nulo | quando viu ou pulou as boas-vindas |
| rulesAcceptedAt | data e hora ou nulo | quando confirmou "Li e concordo" (RF-011) |
| removedAt | data e hora ou nulo | preenchido ao remover; pessoa removida não entra nem aparece |

Sem CPF, data de nascimento ou documento (RF-024).

## Residency (Morador de um apartamento) — substitui `Resident` da spec 001

| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | |
| condominiumId | uuid | |
| personId | uuid | → Person do mesmo condomínio |
| apartmentId | uuid | → Apartment do mesmo condomínio |
| kind | enum | `owner`, `tenant`, `family` |
| isResponsible | booleano | no máximo um `true` por apartamento (RF-014) |
| canRegisterDeliveries | booleano | padrão `true`; sempre `true` se `isResponsible` (RF-015a) |
| canVotePolls | booleano | padrão `false`; sempre `true` se `isResponsible` |
| invitedById | uuid ou nulo | → Person (responsável ou síndico) |
| invitedAt | data e hora | |
| lastInviteAt | data e hora | atualizado ao reenviar |

**Situação** (calculada): `pending` se `Person.firstAccessAt` é nulo; `active` caso contrário.

`Apartment.responsibleResidentId` da spec 001 passa a apontar para a `Residency` responsável (mesma regra).

## Staff (Funcionário) — muda

Ganha `personId` (uuid ou nulo): porteiros têm pessoa e entram com o celular; faxineiros, nulo (não entram).

## ManagerAssignment (Síndico) — nova

| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | |
| condominiumId | uuid | |
| personId | uuid | → Person; um por condomínio nesta etapa |

## Papel (calculado, não guardado)

`Role = { kind: "resident", residencyId, apartmentId } | { kind: "front-desk", staffId } | { kind: "manager" }`,
sempre com `condominiumId`. Os papéis de uma pessoa vêm de `Residency`, `Staff` e `ManagerAssignment`.

## Vehicle (Carro)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId | uuid | |
| apartmentId | uuid | |
| plate | texto | maiúsculas sem hífen; `^[A-Z]{3}\d{4}$` (antiga) ou `^[A-Z]{3}\d[A-Z]\d{2}$` (Mercosul); única por condomínio |
| model | texto | obrigatório, 1–60 |
| color | texto | obrigatório, 1–30 |

## Pet (Animal)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId | uuid | |
| apartmentId | uuid | |
| name | texto | obrigatório, 1–60 |
| kind | enum | `dog`, `cat`, `bird`, `other` |

## EmergencyContact (Contato de emergência)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId | uuid | |
| apartmentId | uuid | **único por apartamento** |
| name | texto | obrigatório, 2–120 |
| relationship | texto | obrigatório, 2–40 (ex.: filha, irmão) |
| phone | texto | E.164, mesma regra de `Person.phone` (não precisa ser único) |

## Rule (Regra)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId | uuid | |
| topic | enum | `coexistence`, `elevator-moves`, `waste`, `pets`, `garage`, `common-areas` |
| title | texto | obrigatório |
| body | texto | obrigatório |
| order | inteiro | ordem dentro do tema |

## OtpRequest (Pedido de código)

| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | |
| phone | texto | E.164 |
| codeHash | texto | SHA-256 de `sal + código`; o código em si não é guardado |
| salt | texto | aleatório |
| createdAt | data e hora | |
| expiresAt | data e hora | `createdAt + 10 min` |
| attempts | inteiro | 0–5; com 5, o pedido deixa de valer |
| consumedAt | data e hora ou nulo | usado com sucesso |
| invalidatedAt | data e hora ou nulo | substituído por um pedido novo ou por 5 erros |

Limites: reenvio só 60 s depois do último pedido; no máximo 5 pedidos por número em 60 minutos.

## Session (Sessão)

| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | |
| personId | uuid | |
| deviceId | texto | aleatório por aparelho (`terreo:device` no `localStorage`) |
| activeRole | Role ou nulo | papel escolhido; nulo até escolher, quando há mais de um |
| createdAt | data e hora | |
| lastSeenAt | data e hora | atualizado a cada abertura |
| endedAt | data e hora ou nulo | |
| endReason | enum ou nulo | `signed-out`, `removed`, `phone-changed`, `inactive` |

Válida se `endedAt` é nulo, a pessoa não foi removida e `agora − lastSeenAt ≤ 180 dias`.

## OutboxMessage (Mensagem enviada, simulada)

| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | |
| condominiumId | uuid ou nulo | |
| toPhone | texto | E.164 |
| kind | enum | `otp`, `invite` |
| body | texto | texto da mensagem, como iria no WhatsApp |
| createdAt | data e hora | |

Só para conferência no desenvolvimento e na demonstração; na Etapa 3 vira a fila de envio do WhatsApp.

## Transições

```
Convite:   (responsável ou síndico convida) → pending ──(primeiro código confirmado)──→ active
Pessoa:    active/pending ──(remover)──→ removed   (todas as sessões: endReason = removed)
Sessão:    (código confirmado) → aberta ──(sair | remoção | troca de celular | 180 dias)──→ encerrada
Primeiro acesso do morador: entrar → boas-vindas (ou pular) → regras ("Li e concordo") → Início
```

## Dados de exemplo (versão 2)

- Pessoas para cada perfil, com celular fictício (DDD `00`):
  - síndica, que também mora no 1201 (dois papéis);
  - 3 porteiros com `personId` (o chefe é um deles); 2 faxineiros sem pessoa;
  - responsável e familiares em 44 apartamentos (como na spec 001);
  - 1 apartamento (o 902) com o responsável ainda com convite pendente;
  - 3 apartamentos sem responsável (303, 704, 1102), como na spec 001.
- Alguns carros, animais e contatos de emergência.
- 10 a 15 regras de exemplo, nos 6 temas.
- Uma lista de "Contas de exemplo" (síndica, porteiro, responsável, familiar, convite pendente) para a tela de
  entrada nos modos `dev` e `demo`.
