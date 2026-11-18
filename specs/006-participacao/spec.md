# Especificação: Participação

**Branch**: `main` (sem branch própria da funcionalidade)

**Criada em**: 2026-11-18

**Status**: Rascunho

**Entrada**: Etapa 2 do `docs/backlog.md`, grupo Participação, com dados locais (front-end primeiro; WhatsApp e fotos
no R2 na Etapa 3). Sugestões dos moradores com "gostei"/"não gostei" e situação dada pelo síndico (aprovada vira
melhoria e avisa quem gostou); melhorias do prédio com andamento, fotos de antes e depois, mês e valor; avisar problema
nas áreas comuns com fotos e apoio dos vizinhos; aviso de barulho anônimo; prestadores indicados com nota e
comentário; comércio do bairro; pesquisa de satisfação periódica (portaria, limpeza e aplicativo).

**Referências**: `arquivos-gerais-terreo/minimundo-terreo.md` (Melhorias no prédio, Sugestões dos moradores,
Prestadores de serviço, Comércio do bairro, Pesquisa de satisfação, Aviso de barulho, Avisar problema no prédio),
mockups 10_sugestoes, 11_nova_sugestao, 18_reportar, 20_prestadores, 24_melhorias, 42_sindico_problemas,
`specs/002-acesso-e-cadastro/` (pessoa, apartamento, permissões), `specs/003-comunicacao/` (notificações e canais),
`specs/004-portaria/` (fotos reduzidas no aparelho, ditar), `.specify/memory/constitution.md` (1.2.0).

## Esclarecimentos

### Sessão 2026-11-18

- P: "Barulho" como tipo de problema e o aviso de barulho anônimo — como convivem? → R: Os dois ficam, separados.
  "Barulho" em Avisar problema é de equipamento ou estrutura (bomba, portão rangendo, exaustor), com identificação;
  barulho causado por vizinhos vai no aviso anônimo. A tela de problema explica a diferença e oferece o atalho para o
  aviso anônimo.
- P: Quem vê e quem indica prestadores e comércios? → R: Todos os perfis veem e todos indicam (moradores, portaria e
  síndico), com nota e comentário; a indicação mostra o nome e o apartamento ou "Portaria"/"Síndico".
- P: Na pesquisa de satisfação, quem do apartamento responde? → R: Cada morador ativo, uma vez por trimestre; as
  médias do síndico são por pessoa.
- P: Sugestão publicada "sem mostrar meu apto": o síndico vê quem foi? → R: Sim. Os outros moradores veem só
  "Morador"; o síndico vê o apartamento e o nome, para responder e acompanhar.

## Cenários de uso e testes *(obrigatório)*

### História 1: Sugestões que viram melhorias (Prioridade: P1)

Um morador tem uma ideia: um bicicletário na garagem. Ele abre Sugestões, toca em "+", escreve o título e a ideia,
escolhe a categoria (melhoria, segurança, lazer, economia, outro), pode pôr uma foto e decidir publicar sem mostrar o
apartamento. Todos os moradores veem a sugestão e marcam "gostei" ou "não gostei"; o app mostra quantos concordam. O
síndico vê o que é mais pedido, responde e muda a situação (recebida, em análise, aprovada, não será feita). Quando
aprova, a sugestão vira uma melhoria do prédio e todos que marcaram "gostei" são avisados.

**Por que esta prioridade**: é o principal canal de voz dos moradores e alimenta as melhorias; o minimundo dá o fluxo
encadeado completo.

**Teste independente**: o 804 publica "Bicicletário na garagem"; o familiar do 804 e outro morador dão "gostei"; o
síndico aprova com uma resposta; a sugestão aparece em Melhorias como planejada e quem gostou recebe o aviso.

**Cenários de aceite**:

1. **Dado** um morador em Sugestões, **quando** publica com título (5–80), descrição (10–1.000), categoria e, se
   quiser, uma foto, **então** a sugestão aparece para todos como "Recebida", com "Apto 804 · agora" ou "Morador ·
   agora" se escolheu não mostrar o apartamento.
2. **Dado** uma sugestão, **quando** um morador toca "gostei" ou "não gostei", **então** o voto conta uma vez por
   pessoa; tocar de novo no mesmo tira o voto; tocar no outro troca. O app mostra os dois números e "N% concordam".
3. **Dado** a lista, **então** há as abas "Mais votadas" (mais "gostei" primeiro), "Recentes" e "Minhas".
4. **Dado** o síndico, **quando** muda a situação de uma sugestão e escreve uma resposta (até 500), **então** quem
   sugeriu é avisado e a resposta aparece na sugestão para todos.
5. **Dado** o síndico, **quando** aprova uma sugestão, **então** ela vira uma melhoria "Planejada" com o mesmo título,
   a origem ("Sugestão do apto 302 · 28 votos") e a ligação de volta; todos que deram "gostei" são avisados.
6. **Dado** quem sugeriu, **quando** a sugestão ainda está "Recebida", **então** pode editar ou apagar; depois de "Em
   análise", não.
7. **Dado** a portaria, **então** não vê Sugestões; o síndico vê todas mas não vota.

---

### História 2: Avisar um problema e acompanhar o conserto (Prioridade: P2)

Um morador vê o botão do elevador do 8º andar quebrado. Ele abre "Avisar problema", escolhe onde (elevador, garagem,
hall, escada, fachada, outro) e o que houve (quebrado, sujo, vazamento, lâmpada, barulho, outro), descreve, tira até
3 fotos e decide se mostra para todos — assim os vizinhos podem apoiar em vez de mandar o mesmo problema de novo. O
síndico vê os problemas em "Abertos", "Em andamento" e "Resolvidos", marca urgente, atualiza a situação com uma
mensagem ("Técnico agendado para segunda às 10h") e quem reportou e quem apoiou são avisados.

**Por que esta prioridade**: resolve problemas reais do prédio com rastreio; é o fluxo mais pedido do síndico
(mockup 42).

**Teste independente**: o 804 avisa "Botão do elevador · 8º" com foto e "mostrar para todos"; o familiar apoia; o
síndico marca "Em andamento" com mensagem; os dois recebem o aviso; depois "Resolvido".

**Cenários de aceite**:

1. **Dado** um morador, **quando** envia um problema com onde, o que houve, descrição (5–500) e de 0 a 3 fotos,
   **então** o síndico recebe uma notificação e o problema fica "Aberto" e "Novo".
2. **Dado** "mostrar para todos" ligado, **então** os outros moradores veem o problema e podem "Apoiar" (uma vez por
   pessoa, desfazível); o número de apoios aparece para todos e para o síndico. Desligado, só quem reportou, as pessoas
   do apartamento e o síndico veem.
3. **Dado** o síndico, **quando** muda a situação (aberto, em andamento, resolvido) com uma mensagem opcional (até
   300), **então** quem reportou e quem apoiou são avisados e o histórico das atualizações fica no problema.
4. **Dado** o síndico, **quando** marca "urgente", **então** o problema sobe para o topo e aparece com a marca
   "Urgente".
4a. **Dado** o tipo "Barulho" escolhido em Avisar problema, **então** a tela explica "Barulho de equipamento ou do
   prédio. Barulho de vizinho? Avise de forma anônima" com o atalho para o aviso de barulho.
5. **Dado** a portaria, **quando** também vê um problema, **então** pode avisar do mesmo jeito (sem "apoiar"); o
   síndico vê "Portaria" como origem.

---

### História 3: Aviso de barulho sem se expor (Prioridade: P3)

Às 23h há música alta no prédio. Uma moradora avisa pelo app, de forma anônima, com o andar ou a região se souber e o
horário. O síndico recebe o aviso sem saber quem mandou, evitando briga entre vizinhos.

**Por que esta prioridade**: privacidade é princípio do projeto; é simples, mas precisa ser rigorosamente anônimo.

**Teste independente**: o 804 avisa barulho "Andar de cima · agora"; o síndico vê o aviso sem nome nem apartamento;
nenhuma tela, notificação ou registro visível mostra quem enviou.

**Cenários de aceite**:

1. **Dado** um morador, **quando** avisa barulho com tipo (música, obra, festa, animal, outro), onde (andar, "de cima",
   "de baixo", área comum ou "não sei") e quando (agora ou outro horário de hoje), **então** o síndico recebe uma
   notificação "Aviso de barulho" sem nome nem apartamento.
2. **Dado** o síndico, **quando** abre a lista de avisos de barulho, **então** vê data, hora, tipo e onde, nunca quem
   enviou; pode marcar como "visto".
3. **Dado** o mesmo morador, **quando** tenta mandar outro aviso em menos de 30 minutos, **então** o app pede para
   esperar (evita excesso).
4. **Dado** o morador, **quando** abre "Meus avisos", **então** vê só os próprios avisos e se o síndico já viu.
5. **Dado** qualquer outro perfil, incluindo a portaria, **então** não vê os avisos de barulho.

---

### História 4: Prestadores de confiança e comércio do bairro (Prioridade: P4)

A moradora precisa de um eletricista. Ela abre Prestadores, busca "eletricista" e vê "Zé da Luz · 9 vizinhos indicam",
com nota média e comentários; toca no WhatsApp. Ela mesma pode indicar um profissional ou dizer que também indica um que
já está na lista, com nota de 1 a 5 e comentário. No Comércio do bairro há padarias, farmácias e mercados que entregam,
com telefone e WhatsApp, indicados pelos moradores.

**Por que esta prioridade**: útil no dia a dia, sem dependência de outras histórias.

**Teste independente**: o 804 indica "Zé da Luz · Elétrica · (21) 98888-1111" com nota 5; o familiar marca "Também
indico" com nota 4; a lista mostra "2 vizinhos indicam · 4,5"; busca "luz" encontra.

**Cenários de aceite**:

1. **Dado** qualquer perfil (morador, portaria ou síndico), **quando** indica um prestador com nome (2–60), serviço (elétrica, hidráulica, pintura, limpeza,
   reformas, outro), telefone válido, observação (até 120), nota (1–5) e comentário (até 300), **então** ele aparece na
   lista com "1 vizinho indica".
2. **Dado** um prestador na lista, **quando** outra pessoa (de qualquer perfil) toca "Também indico" com nota e comentário, **então** o
   número de indicações e a nota média se atualizam; cada pessoa indica uma vez e pode mudar ou retirar.
3. **Dado** a lista, **então** há busca sem acento por nome, serviço e observação, filtro por serviço e ordem por
   número de indicações.
4. **Dado** um telefone celular, **então** há botão de WhatsApp; sempre há botão de ligar.
5. **Dado** o comércio do bairro, **então** funciona igual (nome, tipo — padaria, farmácia, mercado, restaurante,
   outro —, telefone, "faz entrega", observação e indicações), sem nota.
6. **Dado** o síndico, **quando** vê um prestador ou comércio inadequado, **então** pode removê-lo; quem indicou é
   avisado.
7. **Dado** o mesmo telefone já cadastrado, **quando** alguém tenta indicar de novo, **então** o app mostra o existente
   e oferece "Também indico".

---

### História 5: Pesquisa de satisfação (Prioridade: P5)

De três em três meses, o morador recebe um convite para dar uma nota de 1 a 5 para a portaria, a limpeza e o
aplicativo, com um comentário opcional. O síndico vê as médias de cada período, a comparação com o anterior e os
comentários, para saber o que melhorar.

**Por que esta prioridade**: dá retorno ao síndico, mas não bloqueia nada.

**Teste independente**: no período aberto, o 804 dá 5, 4 e 5 com comentário; o síndico vê a média do período e o
comentário; o 804 não consegue responder de novo no mesmo período.

**Cenários de aceite**:

1. **Dado** um período aberto (trimestre do calendário), **quando** o morador ainda não respondeu, **então** o início
   mostra "Pesquisa de satisfação: leva 30 segundos" e a tela tem as três notas (estrelas grandes) e o comentário
   (até 500).
2. **Dado** uma resposta, **então** cada pessoa responde uma vez por período; pode mudar até o fim do período.
3. **Dado** o síndico, **quando** abre Satisfação, **então** vê por período: número de respostas, média de cada item
   (uma casa decimal), a diferença para o período anterior e os comentários, sem o nome de quem respondeu.
4. **Dado** a portaria ou o síndico, **então** não respondem a pesquisa (avaliam-se a portaria e a limpeza).

---

### História 6: Melhorias do prédio (Prioridade: P6)

O síndico mostra as melhorias planejadas, em andamento e concluídas: pintura da garagem, LEDs nos corredores. Cada uma
tem situação, percentual quando está em andamento, mês, valor gasto e fotos de antes e depois. Os moradores veem tudo
e entendem onde o dinheiro foi aplicado.

**Por que esta prioridade**: completa o fluxo da História 1 e dá transparência; depende pouco do resto.

**Teste independente**: o síndico cria "Troca do portão" planejada, passa para "Em andamento 60%", conclui com foto de
antes e depois, mês e R$ 4.800; o morador vê o cartão concluído.

**Cenários de aceite**:

1. **Dado** o síndico, **quando** cria ou edita uma melhoria com título (5–80), descrição (até 500), situação
   (planejada, em andamento, concluída), percentual (0–100, só em andamento), mês, valor (opcional, em reais) e até
   duas fotos (antes, depois), **então** ela aparece para todos.
2. **Dado** uma melhoria que veio de sugestão, **então** mostra "Sugestão do apto N · X votos" (ou "Sugestão de um
   morador" se a sugestão não mostra o apartamento) e leva à sugestão.
3. **Dado** uma melhoria concluída, **quando** o síndico conclui, **então** quem deu "gostei" na sugestão de origem é
   avisado.
4. **Dado** a lista, **então** em andamento primeiro, depois planejadas, depois concluídas (mais recentes primeiro).

---

### Casos-limite

- Sugestão de quem saiu do prédio: continua visível, com "Ex-morador" no lugar do apartamento; os votos dela continuam.
- Morador vota na própria sugestão: pode (o mockup mostra "gostei" marcado).
- Sugestão aprovada e depois o síndico desiste: a melhoria pode ser apagada; a sugestão volta a "Em análise".
- Problema reportado duas vezes: o app mostra os problemas abertos do mesmo lugar antes de enviar, para apoiar em vez
  de duplicar.
- Aviso de barulho: nem o síndico nem o registro visível guardam quem mandou; só fica, de forma não identificável, o
  controle de 30 minutos no próprio aparelho do morador.
- Fotos grandes: reduzidas no aparelho, como na portaria (spec 004).
- Prestador com telefone fixo: sem WhatsApp.
- Sem período de pesquisa aberto: a tela mostra quando abre o próximo.

## Requisitos *(obrigatório)*

### Requisitos funcionais

**Sugestões**

- **RF-001**: Moradores ativos DEVEM poder publicar sugestões com título (5–80), descrição (10–1.000), categoria
  (melhoria, segurança, lazer, economia, outro), até 1 foto e a opção de não mostrar o apartamento aos vizinhos (o
  síndico sempre vê o apartamento e o nome).
- **RF-002**: Moradores DEVEM poder marcar "gostei" ou "não gostei", um voto por pessoa, desfazível e trocável; a
  sugestão mostra as contagens e o percentual de quem concorda.
- **RF-003**: A lista DEVE ter as abas Mais votadas, Recentes e Minhas, com a situação de cada sugestão.
- **RF-004**: O síndico DEVE poder mudar a situação (recebida, em análise, aprovada, não será feita) com resposta (até
  500); quem sugeriu é avisado.
- **RF-005**: Aprovar uma sugestão DEVE criar uma melhoria "Planejada" ligada a ela e avisar todos que deram "gostei".
- **RF-006**: Quem sugeriu DEVE poder editar ou apagar enquanto "Recebida".

**Problemas**

- **RF-007**: Moradores e portaria DEVEM poder avisar problemas com onde, o que houve (quebrado, sujo, vazamento,
  lâmpada, barulho de equipamento, outro), descrição (5–500), até 3 fotos e "mostrar para todos" (só moradores). Ao
  escolher "barulho", o app explica que barulho de vizinho vai no aviso anônimo e oferece o atalho.
- **RF-008**: Problemas públicos DEVEM poder ser apoiados pelos outros moradores, uma vez por pessoa; antes de enviar,
  o app mostra os abertos do mesmo lugar.
- **RF-009**: O síndico DEVE ver os problemas por situação (aberto, em andamento, resolvido), marcar urgente e atualizar
  com mensagem (até 300); quem reportou e quem apoiou são avisados a cada atualização; o histórico fica no problema.

**Barulho**

- **RF-010**: Moradores DEVEM poder avisar barulho com tipo, onde e quando; o aviso NÃO DEVE guardar nem mostrar a
  ninguém quem o enviou.
- **RF-011**: O síndico DEVE ver os avisos de barulho (data, hora, tipo, onde) e marcá-los como vistos; o morador vê
  os próprios avisos neste aparelho.
- **RF-012**: O app DEVE pedir 30 minutos entre avisos de barulho do mesmo morador.

**Prestadores e comércio**

- **RF-013**: Todos os perfis (morador, portaria e síndico) DEVEM ver as listas e poder indicar prestadores (nome 2–60, serviço, telefone válido, observação até 120, nota
  1–5, comentário até 300) e comércios (nome, tipo, telefone, faz entrega, observação), uma indicação por pessoa por
  item, editável e removível.
- **RF-014**: As listas DEVEM ter busca sem acento, filtro por serviço ou tipo, número de indicações, nota média
  (prestadores), ligar e WhatsApp (celulares).
- **RF-015**: Telefone já cadastrado DEVE levar ao item existente em vez de duplicar.
- **RF-016**: O síndico DEVE poder remover um prestador ou comércio; quem indicou é avisado.

**Pesquisa de satisfação**

- **RF-017**: A pesquisa DEVE abrir por trimestre do calendário; cada morador ativo (não só o responsável) responde
  uma vez por período (pode
  mudar até o fim), com notas de 1 a 5 para portaria, limpeza e aplicativo e comentário opcional (até 500).
- **RF-018**: O síndico DEVE ver, por período, o número de respostas, as médias com uma casa decimal, a diferença para
  o período anterior e os comentários, sem identificação.
- **RF-019**: O início do morador DEVE lembrar a pesquisa enquanto ele não respondeu no período aberto.

**Melhorias**

- **RF-020**: O síndico DEVE poder criar, editar e apagar melhorias com título, descrição, situação, percentual (em
  andamento), mês, valor e fotos de antes e depois; todos os perfis veem.
- **RF-021**: Concluir uma melhoria que veio de sugestão DEVE avisar quem deu "gostei".

**Comum**

- **RF-022**: Permissões conferidas nos serviços, na matriz das specs anteriores: a portaria não vê sugestões nem
  avisos de barulho; só o síndico muda situações e remove itens.
- **RF-023**: Notificações desta spec ficam só no app (sem WhatsApp), exceto as de quem sugeriu e quem apoiou, que
  seguem as preferências como avisos (spec 003).
- **RF-024**: Textos em português, inglês e espanhol; datas em Brasília; fotos reduzidas no aparelho; tudo acessível
  nas quatro aparências.
- **RF-025**: Os dados de exemplo DEVEM ter sugestões com votos em várias situações, uma aprovada que virou melhoria,
  melhorias concluídas com fotos, problemas abertos, em andamento e resolvidos, avisos de barulho, prestadores e
  comércios indicados e respostas da pesquisa no período anterior.

### Entidades principais

- **Sugestão**: autor, apartamento, mostrar apartamento, título, descrição, categoria, foto, situação, resposta do
  síndico, datas, melhoria gerada.
- **Voto em sugestão**: sugestão, pessoa, gostei ou não gostei.
- **Melhoria**: título, descrição, situação, percentual, mês, valor, fotos de antes e depois, sugestão de origem.
- **Problema**: autor, apartamento ou portaria, onde, o que houve, descrição, fotos, público, urgente, situação,
  atualizações (situação, mensagem, data), apoios.
- **Aviso de barulho**: tipo, onde, quando, criado em, visto em — sem autor.
- **Prestador / Comércio**: nome, serviço ou tipo, telefone, observação, faz entrega (comércio), indicações (pessoa,
  papel de quem indicou — apartamento, portaria ou síndico —, nota, comentário).
- **Resposta da pesquisa**: período, pessoa, notas de portaria, limpeza e aplicativo, comentário.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **CS-001**: O morador publica uma sugestão em menos de 1 minuto e vota com 1 toque.
- **CS-002**: 100% das sugestões aprovadas aparecem como melhoria e avisam quem gostou, conferido por teste.
- **CS-003**: O morador avisa um problema com foto em até 4 toques depois de abrir a tela.
- **CS-004**: 0 telas, notificações ou dados entregues ao síndico permitem identificar quem enviou um aviso de barulho,
  conferido por teste.
- **CS-005**: A pesquisa de satisfação é respondida em menos de 30 segundos.
- **CS-006**: 100% das ações sem permissão (portaria votando, morador mudando situação, alguém lendo barulho) são
  recusadas pelos serviços, conferido por teste.

## Premissas

- Front-end primeiro, sobre os serviços das specs 002 a 005; fotos ficam reduzidas no aparelho e vão ao R2 na Etapa 3.
- O anonimato do barulho vale para todos os perfis do app; no servidor (Etapa 3) o aviso também não guarda o autor.
- Notas e médias da pesquisa não são mostradas aos moradores nesta etapa.
- Sugestões e prestadores não passam por moderação prévia; o síndico remove o que for inadequado.
- "Ideias para o futuro" (reserva do salão etc.) estão fora do escopo.
