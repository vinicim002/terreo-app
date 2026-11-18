# Modelo de dados: Segurança

Continua os modelos das specs 001 a 004 (`id` UUID, `condominiumId`, datas ISO em UTC, Zod). Dados de exemplo v5.

## EmergencyAlert (Alerta de apartamento)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, apartmentId | uuid | um `open`/`acknowledged` por apartamento |
| kind | enum | `health`, `fire`, `intrusion`, `leak`, `other`, `unknown` |
| origin | enum | `app`, `whatsapp` |
| createdById | uuid | pessoa ativa do apartamento |
| createdAt | data e hora | |
| status | enum | `open`, `acknowledged`, `resolved`, `cancelled` |
| acknowledgedAt, acknowledgedById | data e hora / uuid ou nulo | o primeiro "Estou indo" |
| resolvedAt, resolvedById | data e hora / uuid ou nulo | |
| resolutionNote | texto ou nulo | até 300 |
| cancelledAt, cancelledById | data e hora / uuid ou nulo | |
| repeatedAt | data e hora ou nulo | repetição após 2 min sem atendimento |

**Estados**: `open` → `acknowledged` → `resolved`; `open`/`acknowledged` → `cancelled`.

## GeneralAlert (Alerta geral)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId | uuid | no máximo um `open` |
| kind | enum | `fire`, `gas`, `power`, `security`, `other` |
| message | texto | 5–280 |
| createdById | uuid | porteiro ou síndico |
| createdAt | data e hora | |
| status | enum | `open`, `closed` |
| closedAt, closedById | data e hora / uuid ou nulo | |
| closingMessage | texto ou nulo | até 280 |

## GeneralAlertSeen (Visto)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, alertId, personId | uuid | único por (alerta, pessoa) |
| seenAt | data e hora | "Entendi" — fecha a tela cheia para essa pessoa |

## Contact (Contato cadastrado)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId | uuid | |
| group | enum | `building`, `emergency` |
| name | texto | 2–60 |
| description | texto ou nulo | até 60 (ex.: "24h", "Energia") |
| phone | texto | número discável: 3–4 dígitos (serviço público), 0800, fixo ou celular em E.164 |
| isMobile | booleano | calculado: celular brasileiro → mostra WhatsApp |
| frontDesk | booleano | o número da portaria (no máximo um) |
| order | inteiro | ordem dentro do grupo |

## Mudanças em entidades existentes

- `Person.showPhoneInContacts`: booleano, padrão `false` (síndico e porteiro-chefe; esclarecimento 2).
- `Staff.isHead` **já existe** (spec 001; no seed, Jonas Siqueira) e passa a marcar o porteiro-chefe nos contatos.
- `Notification.type` ganha `emergency-update`, `general-alert`, `general-alert-closed`; `target.kind` ganha
  `emergency`, `general-alert`.

## Dados de exemplo (versão 5)

- Contatos: Portaria (fixo fictício `+5500…`, "24h", `frontDesk`), SAMU 192, Bombeiros 193, Polícia Militar 190,
  Defesa Civil 199, Light (energia) 0800 021 0196, Naturgy (gás) 0800 024 0197, Águas do Rio 0800 195 0195.
- Alerta resolvido: apartamento 501 (um apartamento do seed com moradores), "Saúde", há 3 dias, atendido em 1 min por
  Jonas, resolvido com nota.
- Alerta geral encerrado: "Vazamento de gás no 2º andar", há 10 dias, enviado pela portaria, encerrado em 25 min.
