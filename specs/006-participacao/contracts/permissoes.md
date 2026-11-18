# Contrato: permissões (acréscimos da spec 006)

Somam-se às matrizes anteriores no mesmo `can(actor, ação, alvo)`. Cada linha vira teste (CS-006). Sem ator:
`forbidden`.

| Ação | Responsável | Outro morador | Portaria | Síndico |
|---|---|---|---|---|
| `suggestion.view` | ✔ | ✔ | ✘ | ✔ |
| `suggestion.create` / `suggestion.vote` | ✔ | ✔ | ✘ | ✘ |
| `suggestion.editOwn` (alvo `{ createdById }`) | só o autor | só o autor | ✘ | ✘ |
| `suggestion.manage` (situação, resposta) | ✘ | ✘ | ✘ | ✔ |
| `improvement.view` | ✔ | ✔ | ✔ | ✔ |
| `improvement.manage` | ✘ | ✘ | ✘ | ✔ |
| `issue.report` | ✔ | ✔ | ✔ | ✘ |
| `issue.support` | ✔ | ✔ | ✘ | ✘ |
| `issue.manage` (ver todos, atualizar, urgente) | ✘ | ✘ | ✘ | ✔ |
| `noise.report` | ✔ | ✔ | ✘ | ✘ |
| `noise.view` | ✘ | ✘ | ✘ | ✔ |
| `listing.view` / `listing.recommend` | ✔ | ✔ | ✔ | ✔ |
| `listing.remove` | ✘ | ✘ | ✘ | ✔ |
| `survey.answer` | ✔ | ✔ | ✘ | ✘ |
| `survey.results` | ✘ | ✘ | ✘ | ✔ |
