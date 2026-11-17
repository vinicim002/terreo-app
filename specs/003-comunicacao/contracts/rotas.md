# Contrato: rotas (acréscimos da spec 003)

Detalhes por `?id=` (exportação estática). Telas vazias da spec 001 que ganham conteúdo passam a ter pasta própria.

## Morador (`/resident`)

| Rota | Tela |
|---|---|
| `/resident/notices/` | Avisos: "Todos" e "Não lidos (N)", importantes destacados |
| `/resident/notice/?id=` | Detalhe: tipo, importante, autor, data, texto, "enviado ao grupo", "Confirmar leitura"/"Lido ✓", resolvido, editado |
| `/resident/polls/` | Enquetes abertas (votar com um toque, sugerir, mudar voto) e encerradas |
| `/resident/calendar/` | Agenda do mês com marcas e "Próximos"; tocar no dia mostra os eventos |
| `/resident/meetings/` | Próximas e passadas |
| `/resident/meeting/?id=` | Data, local, pauta, resumo |
| `/resident/notifications/` | Central (Hoje, Ontem, Antes, "Ler todas") e "Como receber" |

## Portaria (`/front-desk`)

| Rota | Tela |
|---|---|
| `/front-desk/notices/` · `/front-desk/notice/?id=` | Avisos (só leitura, sem confirmar) — novo item em "Mais" |
| `/front-desk/calendar/` | Agenda (só leitura) — novo item em "Mais" |
| `/front-desk/notifications/` | Central (avisos) e "Como receber" |

## Síndico (`/manager`)

| Rota | Tela |
|---|---|
| `/manager/notices/` | Avisos com "Todos", "Não lidos" e "Agendados"; botão "Novo aviso" |
| `/manager/notice/?id=` | Detalhe + "Lido por N de M apartamentos", confirmações, editar, resolver, apagar |
| `/manager/notice/edit/?id=` | Novo aviso (sem `id`) ou edição: tipo, título, mensagem, importante, publicar agora/agendar, data do assunto + lembrar na véspera, enviar ao grupo, pedir confirmação |
| `/manager/polls/` · `/manager/poll/new/` | Enquetes (resultado sempre visível ao síndico, encerrar) e nova enquete |
| `/manager/meetings/` · `/manager/meeting/?id=` · `/manager/meeting/edit/?id=` | Reuniões, detalhe com "Registrar resumo", cadastro/edição |
| `/manager/calendar/` · `/manager/event/new/` | Agenda e novo evento (manutenção ou rotina, repetição) |
| `/manager/notifications/` | Central e "Como receber" |

## Cabeçalho

O sino de todas as telas mostra a contagem de não lidas (até "9+") com rótulo acessível, e leva a
`<perfil>/notifications/`.
