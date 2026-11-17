# Modelo de dados: Portaria

Continua os modelos das specs 001 a 003. Regras gerais iguais: `id` UUID, `condominiumId` com filtro obrigatório,
datas ISO 8601 em UTC (mostradas no fuso de Brasília), dias como `AAAA-MM-DD` de Brasília, esquemas Zod como fonte dos
tipos. Dados de exemplo na versão 4.

## Delivery (Entrega)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, apartmentId | uuid | |
| origin | enum | `app`, `whatsapp`, `front-desk`, `mail` |
| store | enum ou nulo | `ifood`, `mercado-livre`, `shopee`, `amazon`, `correios`, `other`; nulo em `mail` |
| storeName | texto ou nulo | 2–40, só com `other` |
| code | texto ou nulo | 1–30, letras, números e hífen; obrigatório em `app`/`whatsapp` |
| note | texto ou nulo | até 140 |
| onArrival | enum ou nulo | `elevator`, `front-desk`, `call`; obrigatório em `app`/`whatsapp` |
| size | enum ou nulo | `envelope`, `small`, `medium`, `large`; só em `front-desk` |
| photo | texto ou nulo | `data:image/jpeg;base64,…`, maior lado ≤ 1024 px |
| status | enum | `awaiting`, `at-desk`, `delivered`, `picked-up`, `not-arrived` |
| notifyResident | booleano | padrão `true` |
| createdById | uuid | pessoa que cadastrou (morador ou porteiro) |
| createdAt | data e hora | |
| arrivedAt, receivedById | data e hora / uuid ou nulo | chegada registrada pela portaria |
| pickedUpAt, pickedUpById, pickupRegisteredById | data e hora / uuid ou nulo | quem retirou (pessoa do apto) e quem registrou |
| lastReminderDay | dia ou nulo | último lembrete de encomenda parada |
| deletedAt | data e hora ou nulo | código cancelado pelo morador |

**Estados**: `awaiting` → `delivered` | `at-desk` | `not-arrived`; `at-desk` → `picked-up`.

## Visitor (Visitante esperado)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, apartmentId | uuid | |
| kind | enum | `visit`, `provider` |
| name | texto | 2–80 (nome da pessoa ou da empresa) |
| day | dia | hoje até 30 dias à frente |
| fromTime, toTime | `HH:mm` | `fromTime` < `toTime` |
| people | inteiro | 1–20 (visita); 1 em prestador |
| status | enum | `expected`, `arrived`, `no-show`, `cancelled` |
| walkIn | booleano | "visitante sem cadastro" |
| createdById | uuid | pessoa (morador; porteiro no sem cadastro) |
| createdAt | data e hora | |
| arrivedAt, releasedById | data e hora / uuid ou nulo | |

Sem documento, CPF, nascimento ou foto (RF-014).

## TravelMode (Modo viagem)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, apartmentId | uuid | um ativo por apartamento |
| from, to | dia | `from` ≤ `to`, no máximo 120 dias |
| createdById | uuid | |
| createdAt, endedAt | data e hora / ou nulo | |

Ativo quando `endedAt` é nulo e hoje ≤ `to`.

## FrontDeskMemo (Recado da portaria)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId, authorId | uuid | autor = pessoa do porteiro |
| text | texto | 2–1.000 |
| createdAt | data e hora | |
| seenAt | data e hora ou nulo | |
| noticeId | uuid ou nulo | aviso criado a partir do recado |

## LostItem (Achado ou perdido)

| Campo | Tipo | Regras |
|---|---|---|
| id, condominiumId | uuid | |
| kind | enum | `found` (portaria), `lost` (morador) |
| description | texto | 3–200 |
| place | texto ou nulo | até 80 |
| photo | texto ou nulo | como em Delivery |
| status | enum | achado: `open`, `claimed`, `returned`; perdido: `open`, `found` |
| apartmentId | uuid ou nulo | perdido: dono; achado: quem disse "é meu" ou a quem foi devolvido |
| createdById | uuid | |
| createdAt, claimedAt, closedAt | data e hora / ou nulo | |

Achados `open` com mais de 60 dias não aparecem para os moradores.

## InboundMessage (Mensagem recebida do WhatsApp — simulada)

| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | |
| condominiumId | uuid ou nulo | do celular reconhecido |
| fromPhone | E.164 | |
| text | texto | até 500 |
| receivedAt | data e hora | |
| result | enum | `registered`, `unknown-phone`, `no-permission`, `not-understood` |
| deliveryId | uuid ou nulo | |

## Mudanças em entidades existentes

- `Notification.type` ganha `delivery-reminder`, `mail`, `lost-found`, `memo`.
- `Notification.target.kind` ganha `delivery`, `visitor`, `lost-item`, `memo`.

## Dados de exemplo (versão 4, relativos à data de criação)

- 804: códigos aguardando iFood 4821 ("subir pelo elevador", cadastrado pelo responsável) e Mercado Livre MLB-73
  ("deixar na portaria", cadastrado pelo familiar); encomenda média da Amazon na portaria com foto (hoje); Shopee
  retirada ontem.
- Outros apartamentos: 5 códigos aguardando, 3 encomendas na portaria (uma há 4 dias, para o lembrete), uma
  correspondência.
- Visitantes: Mariana Costa (804, hoje, 19h–21h, 2 pessoas), técnico da Claro (302, hoje, 8h–12h, prestador),
  Pedro Henrique (804, entrou ontem, liberado por Jonas), Rafael Dias (507, não veio anteontem).
- 1003 em viagem até daqui a 6 dias.
- Achados: chaveiro (hoje), guarda-chuva azul (ontem, reclamado pelo 502), bichinho de pelúcia (há 7 dias); perdido:
  óculos de grau (1203, há 2 dias).
- Recado da portaria: "Lâmpada do hall do 3º andar queimada" (ontem, não visto).
