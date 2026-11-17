# Contrato: permissões (acréscimos da spec 003)

Somam-se à matriz de `specs/002-acesso-e-cadastro/contracts/permissoes.md`, no mesmo `can(actor, ação, alvo)`. Cada linha
vira teste (CS-004). Sem ninguém conectado: `forbidden` em todas.

| Ação | Responsável | Outro morador | Portaria | Síndico |
|---|---|---|---|---|
| `notice.read` (listar, abrir, marcar lido) | ✔ | ✔ | ✔ | ✔ |
| `notice.confirm` | ✔ | ✔ | ✘ | ✔ |
| `notice.manage` (criar, editar, agendar, apagar, resolver, ver estatísticas e agendados) | ✘ | ✘ | ✘ | ✔ |
| `poll.view` | ✔ | ✔ | ✘ | ✔ |
| `poll.vote` comum | se `canVotePolls` | se `canVotePolls` | ✘ | ✘ (vota como morador, com o papel de morador) |
| `poll.vote` oficial | ✔ | ✘ | ✘ | ✘ |
| `poll.suggest` (oficial) | ✘ | se `canVotePolls` | ✘ | ✘ |
| `poll.manage` (criar, encerrar) | ✘ | ✘ | ✘ | ✔ |
| `agenda.read` (agenda, reuniões, resumos) | ✔ | ✔ | ✔ | ✔ |
| `agenda.manage` (reuniões, resumo, eventos) | ✘ | ✘ | ✘ | ✔ |
| `notification.own` (próprias notificações e preferências) | ✔ | ✔ | ✔ | ✔ |

Respostas: ação não permitida → `forbidden`; alvo de outro condomínio, aviso apagado ou agendado (para quem não é
síndico) → `not_found`; votar em enquete encerrada → `validation` (`details.poll = "closed"`).
