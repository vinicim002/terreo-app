# Contrato: permissões (acréscimos da spec 005)

Somam-se às matrizes anteriores no mesmo `can(actor, ação, alvo)`. Cada linha vira teste (CS-006). Sem ator: `forbidden`.

| Ação | Responsável | Outro morador | Portaria | Síndico |
|---|---|---|---|---|
| `emergency.raise` (próprio apto) | ✔ | ✔ | ✘ | ✘ |
| `emergency.viewOwn` | ✔ | ✔ | ✘ | ✘ |
| `emergency.cancel` (alvo `{ apartmentId, createdById }`) | ✔ | só o que pediu | ✘ | ✘ |
| `emergency.viewAll` | ✘ | ✘ | ✔ | ✔ |
| `emergency.respond` ("Estou indo", "Resolvido") | ✘ | ✘ | ✔ | ✘ |
| `generalAlert.view` | ✔ | ✔ | ✔ | ✔ |
| `generalAlert.send` | ✘ | ✘ | ✔ | ✔ |
| `generalAlert.close` (alvo `{ createdById }`) | ✘ | ✘ | só o que enviou | ✔ |
| `contacts.view` | ✔ | ✔ | ✔ | ✔ |
| `contacts.manage` | ✘ | ✘ | ✘ | ✔ |
| `contacts.showOwnPhone` | ✘ | ✘ | só o porteiro-chefe | ✔ |

Alvo de outro apartamento para morador: `not_found`.
