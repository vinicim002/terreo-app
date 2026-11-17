# Pesquisa: Portaria

Decisões técnicas da spec 004. Base: specs 001 a 003 (serviços tipados sobre IndexedDB, `ServiceContext.actor`, matriz
de permissões, `notify` com canais e preferências, `runDue` com relógio injetável, foto reduzida no aparelho).

## R1. Uma entidade para entregas e correspondência

- **Decisão**: `Delivery` com `origin` (`app | whatsapp | front-desk | mail`) e uma máquina de estados:
  `awaiting` → (chegada) → `delivered` (subir pelo elevador, me ligar) ou `at-desk` (deixar na portaria);
  `front-desk`/`mail` nascem em `at-desk`; `at-desk` → `picked-up`; `awaiting` → `not-arrived` (7 dias) ou apagado pelo
  morador.
- **Por quê**: o morador e a portaria veem tudo numa lista por apartamento ("Aguardando", "Na portaria", "Retiradas"),
  e os lembretes e contagens tratam todas as origens do mesmo jeito.
- **Alternativas**: entidades separadas para código e encomenda — duplicaria telas, contagens e lembretes.

## R2. Tarefas com horário (amplia o `runDue` da spec 003)

- Lembrete de encomenda parada: `at-desk` há 3 dias ou mais, no máximo um por dia de Brasília (`lastReminderDay` =
  `AAAA-MM-DD`), pulando apartamentos em modo viagem; voltam no dia seguinte à volta.
- Código `awaiting` com mais de 7 dias vira `not-arrived`.
- Visitante `expected` de um dia que já passou vira `no-show`.
- Modo viagem e achados de mais de 60 dias são calculados na leitura (sem mudar o registro).

## R3. Código por mensagem no WhatsApp (constituição V)

- **Decisão**: `whatsappInbox.receive(phone, text)` (sem ator: quem fala é o celular) reconhece a mensagem com
  `parseDeliveryMessage(text)`:
  - lojas e apelidos, sem acento e sem maiúsculas: `ifood`; `mercado livre`, `mercadolivre`, `ml`; `shopee`;
    `amazon`; `correios`; o resto é "Outro";
  - palavras ignoradas: `código`, `codigo`, `cod`, `entrega`, `pedido`, `do`, `da`, `de`, `o`, `é`;
  - o código é o primeiro trecho de 1 a 30 letras, números e hífen que sobra.
  Resultado: `registered | unknown-phone | no-permission | not-understood`, com resposta no privado (caixa de saída).
- **Agora**: o painel `/dev` tem "Simular mensagem recebida" (celular + texto). **Etapa 3**: a mesma função atende o
  webhook da Evolution API.
- O reconhecedor tem testes com pelo menos 20 exemplos reais de formato (CS-006).

## R4. Fotos de comprovante

- **Decisão**: `resizePhoto` da spec 002 ganha um tamanho máximo configurável; encomendas e achados usam 1024 px,
  JPEG 0,7 (cerca de 100–150 KB), guardados no registro como `data:image/jpeg`. A câmera abre com
  `<input type="file" accept="image/*" capture="environment">`.
- **Etapa 3**: a foto vai para o R2 e o registro guarda só o endereço.

## R5. Falar em vez de escrever

- **Decisão**: componente `DictateButton` sobre o reconhecimento de fala do navegador (`SpeechRecognition` /
  `webkitSpeechRecognition`), no idioma escolhido (`pt-BR`, `en-US`, `es-ES`), com resultados parciais; o texto vai
  para o campo, para conferir antes de salvar. Sem suporte ou sem permissão do microfone: o botão mostra "Ditar não
  está disponível neste aparelho" e o campo continua digitável.
- **Testes**: o e2e injeta um reconhecimento falso (`addInitScript`) que "fala" um texto fixo; o caminho sem suporte
  também é testado.
- **Alternativas**: serviço de transcrição no servidor — exigiria envio de áudio e custo; fica como ideia para depois.

## R6. Equipe de plantão

- **Decisão**: `staff.board(at)` devolve quem está de plantão agora (portaria e limpeza) e os próximos turnos de hoje e
  amanhã, a partir das `ShiftAssignment` semanais e de `shiftCovers` (spec 001), que já tratam o turno que passa da
  meia-noite. Sem rodízio de folgas: quando o síndico definir, só a escala muda.

## R7. Notificações novas

- Tipos novos: `delivery-reminder`, `mail` (preferência "Entregas", pessoais: app + privado), `visitor` (já existia;
  preferência "Visitantes"), `lost-found` e `memo` (só no app, sem preferência e nunca no WhatsApp: são avisos entre
  morador e portaria ou portaria e síndico).
- `notify` passa a ter uma categoria "só no app" (`appOnly`), além de geral (grupo) e pessoal (privado).
- Público: `{ personIds }` calculado pelo serviço (quem cadastrou + responsável; todos do apartamento; porteiros;
  síndicos).

## R8. Permissões novas (matriz das specs 002 e 003 ampliada)

| Ação | Responsável | Outro morador | Portaria | Síndico |
|---|---|---|---|---|
| Ver entregas, visitantes e viagem do próprio apartamento | ✔ | ✔ | — | — |
| Cadastrar código, ativar viagem | ✔ | se `canRegisterDeliveries` | ✘ | ✘ |
| Confirmar retirada | ✔ | ✔ | ✔ (por um morador) | ✘ |
| Avisar visitante | ✔ | ✔ | ✘ | ✘ |
| Cancelar visitante | ✔ (qualquer do apto) | só o que avisou | ✘ | ✘ |
| Ver entregas, visitantes e viagem de todos os apartamentos; registrar chegada, encomenda, correspondência, entrada de visitante | ✘ | ✘ | ✔ | ✘ |
| Ver achados e perdidos | ✔ | ✔ | ✔ | ✔ |
| "É meu", avisar perdido | ✔ | ✔ | ✘ | ✘ |
| Registrar achado, "Devolvido", "Encontrei" | ✘ | ✘ | ✔ | ✘ |
| Mandar recado ao síndico | ✘ | ✘ | ✔ | ✘ |
| Ver recados, transformar em aviso | ✘ | ✘ | ✘ | ✔ |
| Ver equipe de plantão | ✔ | ✔ | ✔ | ✔ |

O síndico não vê entregas e visitantes dos apartamentos (privacidade); vê os do próprio apartamento quando entra como
morador.

## R9. Tela da portaria

- Início: busca de apartamento, 5 botões (Receber encomenda, Correspondência, Visitante chegou, Ditar recado, Achados),
  três números do dia e os visitantes esperados. Botões com no mínimo 56 px.
- Aba Entregas: grade de apartamentos por andar com marcas (códigos, na portaria, em viagem); tocar abre o painel do
  apartamento (moradores, códigos com "Chegou", encomendas com "Retirada", "Correspondência", "Receber encomenda").
- Aba Visitantes: esperados de hoje com "Chegou" e "Visitante sem cadastro".

## R10. Dados de exemplo v4

- `SEED_VERSION = 4`, relativos a `now` como na spec 003: códigos aguardando no 804 (iFood 4821, Mercado Livre
  MLB-73), encomenda na portaria com foto (desenho simples gerado no aparelho) e outra antiga (para o lembrete),
  retirada de ontem, correspondência, visitantes esperados hoje e já entrados, um apartamento em viagem, achados (um
  reclamado), um perdido e um recado ao síndico.
