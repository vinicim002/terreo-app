# Contrato: matriz de permissões

Conferida nos serviços por `can(actor, ação, alvo)` (RF-030). Cada linha vira teste automático (CS-007, CS-007a).
"Próprio apto" = o apartamento da `Residency` do papel ativo.

| Ação | Morador responsável | Outro morador | Portaria | Síndico |
|---|---|---|---|---|
| Ver pessoas, carros, animais e contato do próprio apto | ✔ | ✔ | — | ✔ (qualquer apto) |
| Ver pessoas/carros de outro apto | ✘ | ✘ | só nome, foto, tipo e carros | ✔ |
| Ver celulares de outras pessoas | só do próprio apto | só do próprio apto | ✘ | ✔ |
| Convidar pessoa para o apto | ✔ (próprio) | ✘ | ✘ | ✘ |
| Editar nome/tipo/permissões de outra pessoa | ✔ (próprio apto) | ✘ | ✘ | ✔ (qualquer) |
| Trocar celular de outra pessoa | ✔ (próprio apto) | ✘ | ✘ | ✔ (qualquer) |
| Remover pessoa | ✔ (próprio apto, menos ele mesmo) | ✘ | ✘ | ✔ (qualquer) |
| Reenviar convite | ✔ (próprio apto) | ✘ | ✘ | ✔ (qualquer) |
| Tirar permissões do responsável | ✘ | ✘ | ✘ | ✘ (sempre tem as duas) |
| Editar o próprio nome e foto | ✔ | ✔ | ✔ | ✔ |
| Editar o próprio celular | ✘ | ✘ | ✘ | ✘ |
| Cadastrar/editar carros, animais, contato de emergência | ✔ (próprio apto) | ✘ | ✘ | ✘ |
| Lista de todos os apartamentos (visão do síndico) | ✘ | ✘ | ✘ | ✔ |
| Cadastrar responsável / trocar responsável | ✘ | ✘ | ✘ | ✔ |
| Ler as regras | ✔ | ✔ | ✔ | ✔ |

Respostas: ação proibida → `forbidden`; alvo de outro apartamento que o ator não pode ver, ou de outro condomínio →
`not_found`.
