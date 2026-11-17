# Modelo de dados: Comunicação

Continua os modelos das specs 001 e 002. Regras gerais iguais: `id` UUID, `condominiumId` com filtro obrigatório,
datas ISO 8601 em UTC (mostradas no fuso de Brasília), esquemas Zod como fonte dos tipos. Dados de exemplo na versão 3.

## Notice (Aviso)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId | uuid | |
| authorId | uuid | → Person com papel de síndico |
| kind | enum | `water`, `elevator`, `power`, `meeting`, `general` |
| title | texto | 3–120 caracteres |
| body | texto | 1–2.000 caracteres |
| important | booleano | |
| sendToGroup | booleano | padrão `true` |
| requireConfirmation | booleano | |
| referenceDate | data ou nulo | dia do assunto (ex.: a quinta da falta d'água); usado no lembrete e na agenda |
| remindDayBefore | booleano | exige `referenceDate` |
| publishAt | data e hora | agora ou futuro |
| publishedAt | data e hora ou nulo | preenchido na publicação (na hora ou por `runDue`) |
| editedAt | data e hora ou nulo | |
| version | inteiro | começa em 1; +1 a cada edição de aviso publicado |
| resolvedAt | data e hora ou nulo | |
| resolutionNote | texto ou nulo | até 500 |
| reminderSentAt | data e hora ou nulo | |
| deletedAt | data e hora ou nulo | apagado some das listas |

**Estados**: agendado (`publishedAt` nulo) → publicado → (editado *) → resolvido; qualquer estado → apagado.

## NoticeRead (Leitura de aviso)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId | uuid | |
| noticeId, personId | uuid | única por (aviso, pessoa, versão) |
| version | inteiro | versão lida |
| readAt | data e hora | |
| confirmedAt | data e hora ou nulo | só em avisos com `requireConfirmation` |

## Poll (Enquete)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, authorId | uuid | |
| question | texto | 5–200 |
| options | lista de `{ id, label }` | 2 a 6; `label` 1–80, sem repetir |
| official | booleano | um voto por apartamento, do responsável |
| showPartial | booleano | |
| createdAt | data e hora | |
| closesAt | data e hora | futura na criação |
| closedAt | data e hora ou nulo | pela data (`runDue`) ou pelo síndico |

## PollVote (Voto)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, pollId, optionId, personId | uuid | |
| apartmentId | uuid ou nulo | preenchido nas oficiais; único por (enquete, apartamento) |
| votedAt | data e hora | |

Comuns: único por (enquete, pessoa). Mudar voto = substituir o registro.

## PollSuggestion (Sugestão de voto)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, pollId, optionId, personId, apartmentId | uuid | só enquetes oficiais; única por (enquete, pessoa) |
| suggestedAt | data e hora | |

## Meeting (Reunião do conselho)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, authorId | uuid | |
| startsAt | data e hora | |
| place | texto | 2–120 |
| agenda | lista de texto | 1 a 15 itens, cada um 2–200 |
| summary | texto ou nulo | até 5.000; só depois de `startsAt` |
| summaryAt | data e hora ou nulo | |
| reminderSentAt | data e hora ou nulo | |
| cancelledAt | data e hora ou nulo | |

## AgendaEvent (Evento da agenda)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId | uuid | |
| title | texto | 2–80 |
| kind | enum | `maintenance`, `routine` |
| startsAt | data e hora | primeira ocorrência |
| durationMinutes | inteiro ou nulo | 15–1.440 |
| recurrence | enum | `none`, `weekly`, `monthly`, `semiannual`, `yearly` |
| cancelledAt | data e hora ou nulo | |

## Notification (Notificação)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, personId | uuid | |
| type | enum | `notice`, `notice-updated`, `notice-resolved`, `notice-reminder`, `meeting`, `meeting-reminder`, `meeting-summary`, `poll`, `poll-closed`, `delivery`, `visitor`, `emergency` |
| title | texto | até 120 |
| body | texto | até 200 |
| target | `{ kind: notice | poll | meeting; id }` ou nulo | destino ao tocar |
| createdAt | data e hora | |
| readAt | data e hora ou nulo | |

## NotificationPrefs (Preferências de notificação)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, personId | uuid | uma por pessoa; ausente = tudo ligado |
| app | `{ notices, meetings, polls, deliveries, visitors: boolean }` | |
| whatsapp | `{ deliveries, visitors: boolean }` | só tipos pessoais (esclarecimento 2) |

`emergency` não tem preferência: sempre ligado.

## OutboxMessage (muda)

`kind` passa a `otp | invite | group | private`; `toPhone` passa a aceitar nulo (mensagens `group`).

## Dados de exemplo (versão 3, relativos à data de criação)

- Avisos: falta d'água de amanhã (importante, confirmação, lembrete da véspera, enviado ao grupo); elevador em
  manutenção de ontem (resolvido); desligamento de energia (lido por alguns); coleta seletiva (geral); um agendado para
  daqui a 2 dias (só a síndica vê).
- Leituras: parte dos apartamentos leu os avisos publicados; algumas confirmações.
- Enquete aberta oficial "Qual cor para a nova pintura da fachada?" (Cinza claro, Bege, Branco), com resultado parcial e
  votos de alguns responsáveis; duas encerradas (horário do portão; bicicletário).
- Reunião daqui a 5 dias (pauta com 3 itens) e uma de 20 dias atrás com resumo.
- Eventos: coleta seletiva (toda terça, rotina), limpeza da caixa d'água (a cada 6 meses, manutenção), recarga dos
  extintores (todo ano, manutenção).
- Notificações já existentes para as contas de exemplo, algumas lidas.
