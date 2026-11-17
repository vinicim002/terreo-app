# Contrato: rotas (acréscimos da spec 004)

Detalhes por `?n=` (número do apartamento) ou `?id=` (exportação estática).

## Morador (`/resident`)

| Rota | Tela |
|---|---|
| `/resident/deliveries/` | Entregas (mockup 08): "Cadastrar código de entrega", dica do WhatsApp, Aguardando, Na portaria (foto, "Retirei"), Retiradas |
| `/resident/delivery/new/` | Novo código (mockup 09): loja, código com dica por loja, observação, quando chegar |
| `/resident/visitors/` | Visitantes (mockup 17): "Avisar visitante", Esperados, Histórico |
| `/resident/visitor/new/` | Visita ou prestador: nome, dia, faixa de horário, pessoas |
| `/resident/travel-mode/` | Modo viagem: ativar com ida e volta, ou encerrar |
| `/resident/on-duty/` | Equipe de plantão (mockup 14) |
| `/resident/lost-and-found/` | Achados (3) · Perdidos · Devolvidos (mockup 16), "É meu", "Avisar objeto perdido" |

## Portaria (`/front-desk`)

| Rota | Tela |
|---|---|
| `/front-desk/` | Início (mockup 30): busca, 5 botões grandes, números do dia, visitantes esperados |
| `/front-desk/deliveries/` | Grade de apartamentos por andar com marcas (mockup 31) |
| `/front-desk/apartment/?n=` | Painel do apartamento: moradores, códigos ("Chegou"), na portaria ("Retirada"), "Correspondência", "Receber encomenda", "Em viagem até" |
| `/front-desk/receive-delivery/` (`?n=` opcional) | Receber encomenda (mockup 32): foto, apartamento, tamanho, loja, avisar |
| `/front-desk/mail/` | Correspondência: escolher apartamento e avisar |
| `/front-desk/visitors/` | Esperados de hoje com "Chegou" / interfone para prestador; Já entraram; "Visitante sem cadastro" (mockup 35) |
| `/front-desk/dictate/` | Ditar recado ao síndico (mockup 33) |
| `/front-desk/lost-and-found/` | Achados e perdidos com "Registrar achado", "Devolvido", "Encontrei" |
| `/front-desk/on-duty/` | Equipe de plantão |
| `/front-desk/travel-watch/` | Apartamentos em viagem |

## Síndico (`/manager`)

| Rota | Tela |
|---|---|
| `/manager/memos/` | Recados da portaria: lista, "Visto", "Transformar em aviso" (abre `/manager/notice/edit/?memo=`) |

## Painel `/dev`

"Simular mensagem recebida no WhatsApp": celular (lista das contas de exemplo ou livre) + texto; mostra o resultado e
a resposta.
