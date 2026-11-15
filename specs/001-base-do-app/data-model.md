# Modelo de dados: Base do app

Nesta etapa os dados vivem só no aparelho (IndexedDB), por trás dos serviços de `contracts/servicos-dados.md`. Os
mesmos formatos serão usados pela API na Etapa 3. Identificadores de código em inglês (constituição, princípio I).

Regras gerais:

- `id`: texto UUID v4, gerado na criação.
- `condominiumId`: obrigatório em toda entidade, exceto `Condominium` e `DevicePreferences`. Toda consulta filtra por
  ele (RF-026).
- `createdAt` / `updatedAt`: data e hora ISO 8601 em UTC; exibidas no fuso de Brasília.
- Esquemas em Zod são a fonte dos tipos TypeScript.

## Condominium (Condomínio)

| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | |
| name | texto | obrigatório, 2–120 caracteres |
| shortAddress | texto | opcional, até 160 |
| floors | inteiro | ≥ 1 |
| unitsPerFloor | inteiro | ≥ 1 |
| timezone | texto | fixo `America/Sao_Paulo` |

## Apartment (Apartamento)

| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | |
| condominiumId | uuid | → Condominium |
| number | texto | obrigatório; único por condomínio (ex.: `804`) |
| floor | inteiro | 1 ≤ floor ≤ Condominium.floors |
| responsibleResidentId | uuid ou nulo | → Resident do mesmo apartamento; nulo = "sem responsável" |

## Resident (Morador)

| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | |
| condominiumId | uuid | → Condominium |
| apartmentId | uuid | → Apartment do mesmo condomínio |
| name | texto | obrigatório, 2–120 |
| phone | texto | obrigatório, formato E.164 (`+` seguido de 10 a 15 dígitos, ex.: `+5500900000000`); único por condomínio |
| photoUrl | texto ou nulo | opcional |
| kind | enum | `owner` (proprietário), `tenant` (inquilino), `family` (familiar) |
| isResponsible | booleano | exatamente um `true` por apartamento com moradores |

Sem CPF, data de nascimento ou documento (constituição, princípio III).

## Staff (Funcionário)

| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | |
| condominiumId | uuid | → Condominium |
| name | texto | obrigatório |
| role | enum | `doorman` (porteiro), `cleaner` (faxineiro) |
| isHead | booleano | porteiro-chefe |
| photoUrl | texto ou nulo | opcional |

## ShiftAssignment (Turno da escala)

| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | |
| condominiumId | uuid | → Condominium |
| staffId | uuid | → Staff |
| weekday | inteiro | 0 (domingo) a 6 (sábado) |
| startTime | texto | `HH:mm`, horário de Brasília |
| endTime | texto | `HH:mm`; se menor que `startTime`, o turno termina no dia seguinte (22:00–06:00) |

Quem está de plantão = turnos cujo intervalo contém o horário atual de Brasília. A regra real do rodízio de folgas será
modelada quando confirmada com o síndico; o exemplo usa uma tabela semanal fixa.

## DevicePreferences (Preferências do aparelho)

Guardadas no `localStorage` (chave `terreo:prefs`), lidas também pelo script anterior à pintura.

| Campo | Tipo | Padrão |
|---|---|---|
| profile | `resident` \| `front-desk` \| `manager` \| nulo | nulo (só em `dev`/`demo`) |
| locale | `pt` \| `en` \| `es` | pelo idioma do celular |
| theme | `light` \| `dark` \| `system` | `system` |
| highContrast | booleano | `false` |
| fontScale | 0 \| 1 \| 2 \| 3 | 0 |

## SeedMeta (Controle dos dados de exemplo)

| Campo | Tipo | Regras |
|---|---|---|
| version | inteiro | versão do módulo de exemplo; se diferente da gravada, os dados são recriados |
| seededAt | data e hora | |

## Dados de exemplo (RF-027, RF-028, RF-028a)

- 1 condomínio: "Edifício Taquaretinga", 12 andares, 4 apartamentos por andar.
- 48 apartamentos: 101–104, 201–204, …, 1201–1204.
- Moradores fictícios em 45 apartamentos (1 a 4 por apartamento, um responsável cada); 3 apartamentos sem responsável.
- Telefones fictícios com DDD inexistente `00`: `+55 00 90000-0000` a `+55 00 90000-9999`. Passam na validação E.164
  e nunca são números reais (RF-028).
- 5 funcionários: 3 porteiros (um chefe) e 2 faxineiros.
- Escala dos porteiros nos turnos 06:00–14:00, 14:00–22:00 e 22:00–06:00, todos os dias, com folgas alternadas; dos
  faxineiros, 08:00–17:00 de segunda a sexta e 08:00–12:00 aos sábados (provisório).
