# Contrato: permissões (acréscimos da spec 004)

Somam-se às matrizes das specs 002 e 003, no mesmo `can(actor, ação, alvo)`. Cada linha vira teste (CS-005). Sem
ninguém conectado: `forbidden`. Alvo de outro apartamento para morador: `not_found`.

| Ação | Responsável | Outro morador | Portaria | Síndico |
|---|---|---|---|---|
| `delivery.viewOwn` (entregas do próprio apto) | ✔ | ✔ | ✘ | ✘ |
| `delivery.register` (código, cancelar código) | ✔ | se `canRegisterDeliveries` | ✘ | ✘ |
| `delivery.pickUp` (retirada pelo app) | ✔ | ✔ | ✘ | ✘ |
| `desk.operate` (ver todos os aptos, chegada, receber, correspondência, retirada, entrada de visitante, sem cadastro) | ✘ | ✘ | ✔ | ✘ |
| `visitor.viewOwn`, `visitor.register` | ✔ | ✔ | ✘ | ✘ |
| `visitor.cancel` | ✔ (qualquer do apto) | só o que avisou | ✘ | ✘ |
| `travel.viewOwn` | ✔ | ✔ | ✘ | ✘ |
| `travel.set` (ativar, encerrar) | ✔ | se `canRegisterDeliveries` | ✘ | ✘ |
| `lostfound.view` | ✔ | ✔ | ✔ | ✔ |
| `lostfound.claim`, `lostfound.reportLost` | ✔ | ✔ | ✘ | ✘ |
| `lostfound.manage` (achado, devolvido, encontrei) | ✘ | ✘ | ✔ | ✘ |
| `memo.send` | ✘ | ✘ | ✔ | ✘ |
| `memo.manage` (ver, visto, transformar em aviso) | ✘ | ✘ | ✘ | ✔ |
| `staff.board` | ✔ | ✔ | ✔ | ✔ |

A mensagem do WhatsApp (`whatsappInbox.receive`) não tem ator: identifica a pessoa pelo celular e aplica
`delivery.register` com a residência dela.
