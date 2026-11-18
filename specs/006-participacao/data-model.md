# Modelo de dados: Participação

Continua os modelos das specs 001 a 005 (`id` UUID, `condominiumId`, datas ISO em UTC, Zod). Banco v6, dados de
exemplo v6.

## Suggestion (Sugestão)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, apartmentId, createdById | uuid | |
| showApartment | booleano | falso → vizinhos veem "Morador"; o síndico sempre vê |
| title | texto | 5–80 |
| body | texto | 10–1.000 |
| category | enum | `improvement`, `security`, `leisure`, `savings`, `other` |
| photo | data URL JPEG ou nulo | até 1 |
| status | enum | `received`, `reviewing`, `approved`, `declined` |
| reply | texto ou nulo | até 500 |
| repliedAt | data e hora ou nulo | |
| improvementId | uuid ou nulo | preenchido ao aprovar |
| createdAt, updatedAt | data e hora | |

## SuggestionVote

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, suggestionId, personId | uuid | único por (sugestão, pessoa) |
| value | enum | `up`, `down` |
| at | data e hora | |

## Improvement (Melhoria)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId | uuid | |
| title | texto | 5–80 |
| description | texto ou nulo | até 500 |
| status | enum | `planned`, `in-progress`, `done` |
| progress | inteiro ou nulo | 0–100, só em `in-progress` |
| month | `AAAA-MM` ou nulo | |
| cost | inteiro ou nulo | em centavos, ≥ 0 |
| beforePhoto, afterPhoto | data URL JPEG ou nulo | |
| suggestionId | uuid ou nulo | origem |
| createdAt, updatedAt, doneAt | data e hora | `doneAt` nulo até concluir |

## Issue (Problema)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, createdById | uuid | |
| apartmentId | uuid ou nulo | nulo = portaria |
| place | enum | `elevator`, `garage`, `hall`, `stairs`, `facade`, `other` |
| kind | enum | `broken`, `dirty`, `leak`, `light`, `noise`, `other` (noise = equipamento) |
| description | texto | 5–500 |
| photos | data URL JPEG[] | 0–3 |
| public | booleano | portaria sempre falso |
| urgent | booleano | só o síndico muda |
| status | enum | `open`, `in-progress`, `resolved` |
| updates | `{ status, message (≤300) ou nulo, at }[]` | histórico |
| seenAt | data e hora ou nulo | o síndico abriu ("Novo" até lá) |
| createdAt | data e hora | |

## IssueSupport

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, issueId, personId | uuid | único por (problema, pessoa); só em público |
| at | data e hora | |

## NoiseReport (Aviso de barulho) — **sem autor**

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId | uuid | |
| kind | enum | `music`, `construction`, `party`, `animal`, `other` |
| where | enum | `above`, `below`, `floor`, `common`, `unknown` |
| floor | inteiro ou nulo | só com `where = floor` |
| happenedAt | data e hora | agora ou outro horário de hoje, não no futuro |
| createdAt | data e hora | |
| seenAt | data e hora ou nulo | o síndico marcou visto |

No aparelho (fora do banco compartilhado): `terreo:noise:<personId>` → ids e horários dos próprios avisos (para "Meus
avisos" e os 30 minutos).

## Listing (Prestador ou comércio)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId | uuid | |
| kind | enum | `provider`, `shop` |
| name | texto | 2–60 |
| category | enum | prestador: `electric`, `plumbing`, `painting`, `cleaning`, `renovation`, `other`; comércio: `bakery`, `pharmacy`, `market`, `restaurant`, `other` |
| phone | número discável (spec 005) | único por (condomínio, kind) |
| isMobile | booleano | calculado |
| note | texto ou nulo | até 120 |
| delivers | booleano ou nulo | só comércio |
| createdById | uuid | |
| createdAt | data e hora | |

## Recommendation (Indicação)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, listingId, personId | uuid | único por (item, pessoa) |
| role | enum | `resident`, `front-desk`, `manager` |
| apartmentId | uuid ou nulo | de quem indicou, se morador |
| rating | inteiro ou nulo | 1–5, obrigatório em prestador, nulo em comércio |
| comment | texto ou nulo | até 300 |
| at | data e hora | |

## SurveyResponse (Resposta da pesquisa)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, personId | uuid | único por (período, pessoa) |
| period | texto | `AAAA-Qn` (trimestre em Brasília) |
| frontDesk, cleaning, app | inteiro | 1–5 |
| comment | texto ou nulo | até 500 |
| at | data e hora | |

## Mudanças em entidades existentes

- `Notification.type` ganha `suggestion-status`, `suggestion-approved`, `improvement-done`, `issue-new`,
  `issue-update`, `noise`, `listing-removed`; `target.kind` ganha `suggestion`, `improvement`, `issue`, `noise`,
  `listing`.
