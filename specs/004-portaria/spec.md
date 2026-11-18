# Especificação: Portaria

**Branch**: `main` (sem branch própria da funcionalidade)

**Criada em**: 2026-11-17

**Status**: Rascunho

**Entrada**: Etapa 2 do `docs/backlog.md`, grupo Portaria, numa spec só, com dados locais (front-end primeiro; WhatsApp
real e fotos guardadas no servidor na Etapa 3). Entregas e códigos (cadastro pelo app ou por mensagem no WhatsApp do
condomínio, chegada, encomenda sem código com foto, aviso no privado, lembrete de encomenda parada, retirada com um
toque); correspondência; visitantes e prestadores; modo viagem; equipe de plantão pela escala; falar em vez de escrever
(e recado ditado para o síndico); achados e perdidos. Tela da portaria mínima: botões grandes, ícones, pouco texto.

**Referências**: `arquivos-gerais-terreo/minimundo-terreo.md` (Entregas e códigos, Visitantes, Modo viagem,
Funcionários de plantão, Falar em vez de escrever, Achados e perdidos, WhatsApp do condomínio), mockups 08_entregas,
09_nova_entrega, 14_plantao, 16_achados, 17_visitantes, 30_portaria_inicio, 31_portaria_entregas, 32_portaria_receber,
33_portaria_ditar, 35_portaria_visitante, `specs/002-acesso-e-cadastro/` (permissão "Pode cadastrar entregas", o que a
portaria vê), `specs/003-comunicacao/` (notificações, canais, preferências de entregas e visitantes),
`.specify/memory/constitution.md` (1.2.0).

## Esclarecimentos

### Sessão 2026-11-17

- P: Quando uma entrega chega, quem do apartamento é avisado? → R: Entrega com código: quem cadastrou o código e o
  responsável do apartamento. Encomenda sem código e correspondência: todas as pessoas ativas do apartamento. Sempre
  conforme as preferências de cada pessoa.
- P: Depois de quantos dias a encomenda parada gera lembrete? → R: No 3º dia na portaria, depois um por dia até a
  retirada (exceto em modo viagem), para as mesmas pessoas avisadas na chegada.
- P: Quem do apartamento pode avisar visitante ou prestador? → R: Qualquer pessoa ativa do apartamento; todos do
  apartamento veem os visitantes, e quem avisou ou o responsável pode cancelar.

## Cenários de uso e testes *(obrigatório)*

### História 1: Código de entrega informado antes e encontrado pela portaria (Prioridade: P1)

O morador vai receber um pedido (iFood, Mercado Livre, Shopee, Amazon, Correios ou outro) e cadastra antes o código que
o entregador vai pedir, com uma observação e o que fazer quando chegar: subir pelo elevador, deixar na portaria ou
ligar para ele. Quem não usa o app manda o código por mensagem ao WhatsApp do condomínio, e o código aparece do mesmo
jeito. Quando o entregador chega, o porteiro toca no apartamento e já vê o código, sem interfonar. Ao registrar a
chegada, o morador é avisado no privado.

**Por que esta prioridade**: é a função mais usada no dia a dia do prédio e a que mais poupa o porteiro e o morador.

**Teste independente**: o responsável do 804 cadastra o código 4821 do iFood ("subir pelo elevador"); a portaria abre
o 804, vê o código e registra a chegada; o morador recebe o aviso e a entrega passa a "Entregue".

**Cenários de aceite**:

1. **Dado** um morador com a permissão "Pode cadastrar entregas" (spec 002), **quando** cadastra loja, código,
   observação e o que fazer na chegada, **então** a entrega aparece em "Aguardando" para todas as pessoas do
   apartamento e para a portaria.
2. **Dado** um morador sem essa permissão, **quando** abre Entregas, **então** vê as entregas do apartamento, mas não
   pode cadastrar códigos.
3. **Dado** um morador que manda ao WhatsApp do condomínio uma mensagem como "iFood 4821" ou "código 4821 Mercado
   Livre", **quando** a mensagem chega do celular dele, **então** o código é cadastrado para o apartamento dele e ele
   recebe a confirmação no privado; se a mensagem não for entendida, recebe a explicação de como mandar.
4. **Dado** a portaria, **quando** busca ou toca num apartamento, **então** vê os códigos aguardando, com loja, código
   em letras grandes, observação e o que fazer na chegada.
5. **Dado** um código aguardando, **quando** o porteiro registra a chegada, **então** o que acontece segue a escolha do
   morador: "subir pelo elevador" e "me ligar" encerram como **Entregue**; "deixar na portaria" passa a **Na
   portaria**; e quem cadastrou o código e o responsável do apartamento recebem o aviso no privado (conforme as
   preferências).
6. **Dado** um código aguardando, **quando** o morador o apaga (pedido cancelado), **então** some da portaria.
7. **Dado** qualquer entrega ou código, **então** nunca aparece no grupo do WhatsApp nem para moradores de outros
   apartamentos.

---

### História 2: Encomenda sem código, foto, correspondência e retirada (Prioridade: P2)

Chega uma caixa sem aviso. O porteiro toca em "Receber encomenda", escolhe o apartamento, o tamanho (envelope, pequena,
média, grande) e a loja, tira uma foto como comprovante e registra. O morador recebe o aviso no privado com a foto.
Quando busca a encomenda, confirma a retirada com um toque, e fica registrado quem retirou e quando. Se a encomenda
fica dias na portaria, o morador recebe um lembrete. Para cartas e contas, o porteiro só aperta "Correspondência" no
apartamento e o morador recebe um aviso simples.

**Por que esta prioridade**: completa o ciclo das encomendas e dá o comprovante (a foto) que hoje não existe.

**Teste independente**: a portaria recebe uma caixa média da Amazon para o 804 com foto; o morador vê em "Na portaria"
com a foto e confirma a retirada; a portaria vê quem retirou e quando.

**Cenários de aceite**:

1. **Dado** a portaria, **quando** registra uma encomenda com apartamento, tamanho, loja e foto, **então** ela aparece
   em "Na portaria" para o apartamento e na contagem da portaria, com quem recebeu e a hora.
2. **Dado** uma encomenda registrada com "Avisar o morador", **então** todas as pessoas ativas do apartamento recebem no
   privado o aviso com a foto (conforme as preferências); sem foto, o aviso diz só que chegou.
3. **Dado** uma encomenda na portaria, **quando** uma pessoa do apartamento toca em "Retirei", **então** ela passa a
   **Retirada**, com o nome de quem retirou e a hora, e sai da contagem da portaria.
4. **Dado** uma encomenda na portaria, **quando** o morador vem buscar sem usar o app, **então** o porteiro pode
   registrar a retirada informando quem levou (pessoa do apartamento).
5. **Dado** uma encomenda na portaria há 3 dias ou mais, **então** o apartamento recebe um lembrete no privado, uma vez
   por dia, até a retirada (exceto em modo viagem).
6. **Dado** a portaria, **quando** aperta "Correspondência" num apartamento, **então** as pessoas do apartamento recebem
   "Chegou correspondência para você na portaria", sem dizer o que é, e a correspondência fica registrada até a retirada.

---

### História 3: Visitantes e prestadores (Prioridade: P3)

O morador avisa que vai receber uma visita: nome, dia, faixa de horário e quantas pessoas; ou um prestador (técnico da
internet, do gás) com o dia e a faixa de horário. A portaria vê os esperados do dia e, quando a pessoa chega e o
porteiro confere o documento, toca em "Chegou". No caso de prestador, o app lembra o porteiro de interfonar antes de
liberar. Se chega alguém que não foi avisado, o porteiro registra "Visitante sem cadastro" depois de interfonar. O app
não guarda documento, só o nome e o horário.

**Por que esta prioridade**: tira do interfone as visitas combinadas e deixa histórico; depende só da base.

**Teste independente**: o 804 avisa "Mariana Costa, hoje, das 19h às 21h, 2 pessoas"; a portaria vê em Esperados e
toca "Chegou"; o morador recebe o aviso e vê no histórico "Chegou às 19:05, liberado por Jonas".

**Cenários de aceite**:

1. **Dado** qualquer pessoa ativa do apartamento, **quando** cadastra visita (nome, dia, faixa de horário, número de pessoas) ou prestador (nome
   ou empresa, dia, faixa de horário), **então** aparece em "Esperados" para o apartamento e para a portaria no dia.
2. **Dado** a portaria, **quando** abre Visitantes, **então** vê os esperados de hoje em ordem de horário, com o
   apartamento, e os que já entraram hoje.
3. **Dado** um visitante esperado, **quando** o porteiro toca "Chegou", **então** fica registrado o horário e quem
   liberou; quem avisou e o responsável do apartamento recebem o aviso (conforme as preferências) e veem no histórico.
4. **Dado** um prestador esperado, **quando** o porteiro o abre, **então** vê "Interfone antes de liberar" e só depois
   confirma a entrada.
5. **Dado** alguém sem cadastro, **quando** o porteiro registra nome e apartamento, **então** a entrada fica no
   histórico do apartamento com a marca "sem cadastro" e todas as pessoas ativas do apartamento são avisadas.
6. **Dado** qualquer cadastro de visitante, **então** não há campo de documento, CPF ou foto da visita.
7. **Dado** um visitante esperado que não veio, **quando** o dia termina, **então** ele sai de "Esperados" e fica no
   histórico como "Não veio".

---

### História 4: Tela da portaria simples e falar em vez de escrever (Prioridade: P4)

O início da portaria mostra o essencial em botões grandes: buscar apartamento, Receber encomenda, Correspondência,
Visitante chegou, Ditar recado, Achados e Em viagem; e os números do dia (códigos aguardando, encomendas na portaria, visitas esperadas).
Em todo campo de texto da portaria há um microfone: o porteiro fala e o app escreve. Com "Ditar recado", o porteiro
fala um recado para o síndico (ex.: "o elevador social está parado"), confere o texto e envia; o síndico recebe e pode
transformar o recado num aviso.

**Por que esta prioridade**: torna a portaria utilizável por quem tem pouca familiaridade com o celular; usa o que as
histórias anteriores registram.

**Teste independente**: a portaria dita "O elevador social está parado", corrige uma palavra e envia; o síndico recebe
a notificação, abre o recado e toca "Transformar em aviso", com o texto já preenchido.

**Cenários de aceite**:

1. **Dado** o porteiro no início, **então** vê no máximo 6 botões de ação do mesmo tamanho, cada um com ícone e uma ou duas palavras, e
   os três números do dia; tocar num número leva à lista correspondente.
2. **Dado** um campo de texto da portaria, **quando** o porteiro toca no microfone e fala, **então** o texto aparece no
   campo para conferir e corrigir antes de salvar.
3. **Dado** um aparelho que não permite ditar (sem suporte ou sem permissão do microfone), **então** o microfone avisa
   que não está disponível e o porteiro digita normalmente.
4. **Dado** o porteiro em "Ditar recado", **quando** envia, **então** o síndico recebe uma notificação e vê o recado
   com quem mandou e a hora, em "Recados da portaria".
5. **Dado** o síndico num recado, **quando** toca "Transformar em aviso", **então** abre o novo aviso (spec 003) com o
   texto do recado preenchido; e pode marcar o recado como visto.

---

### História 5: Modo viagem e equipe de plantão (Prioridade: P5)

O morador avisa que vai viajar, de que dia até que dia. A portaria vê o apartamento marcado "em viagem" (na busca, nas
entregas e no início) e guarda as encomendas até a volta, sem mandar lembrete de encomenda parada. Todos veem quem está
trabalhando agora — porteiro e limpeza, com foto e nome — e os próximos turnos, calculados pela escala, sem ninguém
precisar marcar ponto.

**Por que esta prioridade**: são avisos simples que dão segurança e evitam ligações; a escala já existe nos dados.

**Teste independente**: o 804 ativa o modo viagem por 5 dias; a portaria vê "Em viagem até …" no 804; o morador abre
"Equipe de plantão" e vê o porteiro e a faxineira do turno atual.

**Cenários de aceite**:

1. **Dado** o responsável (ou quem pode cadastrar entregas), **quando** ativa o modo viagem com data de ida e volta,
   **então** a portaria vê o apartamento "Em viagem até dd/mm" e o morador vê o aviso ativo.
2. **Dado** o modo viagem ativo, **quando** chega uma encomenda, **então** ela fica na portaria sem lembretes até o
   dia seguinte à volta.
3. **Dado** o modo viagem, **quando** a data de volta passa ou o morador encerra antes, **então** a marca some.
4. **Dado** qualquer perfil, **quando** abre "Equipe de plantão", **então** vê quem está de plantão agora (porteiro e
   limpeza) com foto, nome e horário do turno, e os próximos turnos de hoje e de amanhã.
5. **Dado** o fim de um turno, **quando** o horário muda, **então** a tela mostra o novo plantão sem ninguém atualizar
   nada.

---

### História 6: Achados e perdidos (Prioridade: P6)

O porteiro registra um objeto encontrado: foto, descrição (falada) e onde foi achado. Todos os moradores veem em
"Achados". O dono toca "É meu", a portaria é avisada e, quando entrega o objeto, marca como devolvido. O morador também
pode avisar que perdeu algo; se a portaria encontrar, marca "Encontrei" e o morador é avisado.

**Por que esta prioridade**: útil, mas menos frequente que as outras.

**Teste independente**: a portaria registra "Chaveiro com 3 chaves, hall do elevador" com foto; o morador do 804 toca
"É meu"; a portaria vê o pedido e marca devolvido ao 804.

**Cenários de aceite**:

1. **Dado** a portaria, **quando** registra um achado com foto, descrição e local, **então** ele aparece em "Achados"
   para todos os moradores, com a data.
2. **Dado** um achado, **quando** um morador toca "É meu", **então** a portaria recebe o pedido com o apartamento e o
   objeto mostra "Alguém disse que é dele".
3. **Dado** um achado, **quando** a portaria marca "Devolvido" (escolhendo o apartamento), **então** ele vai para
   "Devolvidos".
4. **Dado** um morador, **quando** avisa um objeto perdido (descrição e onde pode ter sido), **então** aparece em
   "Perdidos" para a portaria e os moradores.
5. **Dado** um perdido, **quando** a portaria toca "Encontrei", **então** o dono é avisado para buscar na portaria.
6. **Dado** um achado não reclamado há 60 dias, **então** sai da lista de achados e fica só no histórico da portaria.

---

### Casos-limite

- Código cadastrado duas vezes para a mesma loja e apartamento no mesmo dia: o app avisa e pergunta se é outro pedido.
- Mensagem no WhatsApp de um celular que não está cadastrado: resposta de que o número não está no condomínio; nada é
  cadastrado.
- Mensagem de quem não pode cadastrar entregas: resposta explicando que fale com o responsável.
- Código aguardando há mais de 7 dias sem chegada: sai de "Aguardando" e vai para o histórico como "Não chegou".
- Encomenda para apartamento sem moradores ativos: a portaria registra, mas o app avisa que ninguém será notificado.
- Foto que não pôde ser tirada (sem câmera ou permissão): a encomenda é registrada sem foto.
- Visitante com faixa de horário que já passou: continua em "Esperados" até o fim do dia.
- Modo viagem com volta antes da ida, ou mais de 120 dias: o app não deixa salvar.
- Turno que passa da meia-noite (22h às 6h): aparece como plantão até as 6h do dia seguinte.
- Sem ninguém na escala no horário: a tela mostra "Sem plantão na escala agora".
- Fuso: todas as datas e horas no fuso de Brasília.

## Requisitos *(obrigatório)*

### Requisitos funcionais

**Entregas e códigos**

- **RF-001**: Pessoas do apartamento com a permissão "Pode cadastrar entregas" DEVEM poder cadastrar um código de
  entrega com loja (iFood, Mercado Livre, Shopee, Amazon, Correios, Outro — com nome livre), código (1 a 30
  caracteres), observação opcional (até 140) e o que fazer na chegada (subir pelo elevador, deixar na portaria, me
  ligar).
- **RF-002**: O código DEVE poder ser informado também por mensagem ao WhatsApp do condomínio, vinda do celular
  cadastrado da pessoa; o app reconhece a loja e o código na mensagem, cadastra para o apartamento da pessoa e responde
  no privado (confirmação ou como mandar). Nesta etapa, a mensagem é simulada no painel de desenvolvimento.
- **RF-003**: Todas as pessoas do apartamento DEVEM ver as entregas do apartamento em "Aguardando", "Na portaria" e
  "Retiradas"; moradores de outros apartamentos NÃO DEVEM ver.
- **RF-004**: A portaria DEVE ver, por apartamento, os códigos aguardando e as encomendas na portaria, e DEVE poder
  registrar a chegada de um código; o resultado segue a escolha do morador (RF-001).
- **RF-005**: A portaria DEVE poder registrar uma encomenda sem código com apartamento, tamanho (envelope, pequena,
  média, grande), loja e foto opcional (reduzida no aparelho), e escolher se avisa o morador (ligado por padrão).
- **RF-006**: Chegada de entrega ou correspondência DEVE avisar no app e no privado do WhatsApp, conforme as
  preferências de "Entregas" (spec 003), e NUNCA no grupo: entrega com código avisa quem cadastrou o código e o
  responsável do apartamento; encomenda sem código e correspondência avisam todas as pessoas ativas do apartamento.
- **RF-007**: Uma pessoa do apartamento DEVE poder confirmar a retirada com um toque; a portaria DEVE poder registrar a
  retirada por uma pessoa do apartamento; fica registrado quem retirou e quando.
- **RF-008**: Encomendas na portaria há 3 dias ou mais DEVEM gerar um lembrete por dia, para as mesmas pessoas avisadas
  na chegada (RF-006), até a retirada, exceto durante o modo viagem.
- **RF-009**: A portaria DEVE poder avisar "Correspondência" para um apartamento com um toque; o aviso não diz o
  conteúdo.
- **RF-010**: Códigos aguardando há mais de 7 dias DEVEM sair da lista e ir para o histórico como "Não chegou".

**Visitantes**

- **RF-011**: Qualquer pessoa ativa do apartamento DEVE poder avisar visita (nome, dia, faixa de horário, número de
  pessoas de 1 a 20) ou prestador (nome ou empresa, dia, faixa de horário) para o seu apartamento, para hoje ou até 30
  dias à frente; todas as pessoas do apartamento veem os visitantes; quem avisou ou o responsável pode cancelar antes da
  chegada. Moradores de outros apartamentos NÃO DEVEM ver.
- **RF-012**: A portaria DEVE ver os esperados de hoje de todos os apartamentos e registrar "Chegou" (com hora e
  porteiro); para prestador, o app DEVE mostrar "Interfone antes de liberar".
- **RF-013**: A portaria DEVE poder registrar visitante sem cadastro (nome e apartamento).
- **RF-013a**: A chegada de visitante DEVE avisar, no app e no privado conforme a preferência "Visitantes": visitante
  esperado — quem avisou e o responsável do apartamento; sem cadastro — todas as pessoas ativas do apartamento.
- **RF-014**: O app NÃO DEVE pedir nem guardar documento, CPF, data de nascimento ou foto de visitante.
- **RF-015**: Esperados que não chegaram até o fim do dia DEVEM ir para o histórico como "Não veio".

**Portaria e voz**

- **RF-016**: O início da portaria DEVE ter busca por apartamento, até 6 botões grandes de ação do mesmo tamanho, com ícone e os números
  do dia (códigos aguardando, encomendas na portaria, visitas esperadas).
- **RF-017**: Todo campo de texto livre da portaria DEVE ter a opção de ditar; sem suporte, o app avisa e permite
  digitar.
- **RF-018**: A portaria DEVE poder enviar um recado ditado ao síndico; o síndico DEVE recebê-lo como notificação, ver
  a lista de recados e poder transformar um recado em aviso (spec 003) com o texto preenchido.

**Modo viagem e plantão**

- **RF-019**: Pessoas com a permissão "Pode cadastrar entregas" DEVEM poder ativar o modo viagem do apartamento com ida
  e volta (no máximo 120 dias) e encerrá-lo antes; a portaria DEVE ver a marca "Em viagem até dd/mm".
- **RF-020**: "Equipe de plantão" DEVE mostrar, para todos os perfis (morador, portaria e síndico), quem trabalha agora (portaria e limpeza) e os
  próximos turnos de hoje e amanhã, calculados pela escala semanal, inclusive turnos que passam da meia-noite.

**Achados e perdidos**

- **RF-021**: A portaria DEVE registrar achados com foto opcional, descrição (até 200) e local (até 80); todos os
  moradores DEVEM ver os achados dos últimos 60 dias.
- **RF-022**: Um morador DEVE poder marcar "É meu" num achado; a portaria DEVE ser avisada e poder marcar
  "Devolvido" a um apartamento.
- **RF-023**: Um morador DEVE poder avisar um objeto perdido; a portaria DEVE poder marcar "Encontrei", avisando o
  dono.

**Comum**

- **RF-024**: Todas as permissões desta spec DEVEM ser conferidas nos serviços, na matriz da spec 002; a portaria só vê
  de cada apartamento o necessário (nomes, códigos, encomendas, visitantes e modo viagem).
- **RF-025**: Todos os textos novos em português, inglês e espanhol; datas e horas no fuso de Brasília; botões da
  portaria com no mínimo 56 px de altura.
- **RF-026**: Os dados de exemplo DEVEM incluir códigos aguardando (inclusive no 804), encomendas na portaria com e sem
  foto, uma retirada, correspondência, visitantes esperados hoje e já entrados, um apartamento em viagem, achados,
  um perdido e um recado ao síndico.

### Entidades principais

- **Entrega**: apartamento, origem (código cadastrado pelo app, código por WhatsApp, recebida sem código,
  correspondência), loja, código, observação, ação na chegada, tamanho, foto, situação (aguardando, na portaria,
  entregue, retirada, não chegou), quem cadastrou, quem recebeu na portaria e quando, quem retirou e quando, último
  lembrete.
- **Visitante esperado**: apartamento, tipo (visita, prestador), nome, dia, faixa de horário, número de pessoas,
  situação (esperado, chegou, não veio, cancelado), quem avisou, hora da chegada e quem liberou, sem cadastro.
- **Modo viagem**: apartamento, ida, volta, quem ativou, encerrado em.
- **Recado da portaria**: texto, quem mandou, quando, visto em, aviso gerado.
- **Achado/perdido**: tipo (achado, perdido), descrição, local, foto, situação (aberto, reclamado, devolvido,
  encontrado), apartamento que reclamou ou que perdeu, datas.
- **Mensagem recebida do WhatsApp** (simulada): celular de origem, texto, quando, resultado do reconhecimento.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **CS-001**: O morador cadastra um código de entrega em menos de 30 segundos.
- **CS-002**: O porteiro encontra o código de um apartamento em no máximo 2 toques a partir do início da portaria.
- **CS-003**: O porteiro registra uma encomenda sem código, com foto, em menos de 45 segundos.
- **CS-004**: 100% das entregas, códigos e correspondências geram aviso só no privado e no app, nunca no grupo,
  conferido por teste automático.
- **CS-005**: 100% das tentativas de ver ou mexer em entregas, visitantes ou modo viagem de outro apartamento são
  recusadas pelos serviços, conferido por teste automático.
- **CS-006**: Mensagens no formato "loja código" (ex.: "iFood 4821", "Mercado Livre MLB-73") são reconhecidas em pelo
  menos 95% dos exemplos de teste.
- **CS-007**: A equipe de plantão confere com a escala em 100% dos horários testados, incluindo a virada da meia-noite.

## Premissas

- Front-end primeiro: tudo funciona com os dados no aparelho, sobre os serviços das specs 002 e 003. Lembretes de
  encomenda parada, códigos sem chegada e visitantes que não vieram são aplicados ao abrir o app (como a spec 003).
- O WhatsApp real (receber a mensagem com o código e mandar a foto no privado) vem na Etapa 3; agora a mensagem
  recebida é simulada no painel `/dev` e a mensagem enviada fica na caixa de saída simulada.
- Fotos ficam no aparelho, reduzidas (como a foto do perfil); na Etapa 3 vão para o armazenamento de fotos.
- Ditar usa o reconhecimento de fala do próprio aparelho; onde não houver, o porteiro digita.
- A escala usada é a semanal da spec 001 (porteiros 6–14h, 14–22h, 22–6h; limpeza em horário comercial). O rodízio de
  folgas e o horário exato dos faxineiros ainda serão definidos com o síndico; quando definidos, só a escala muda.
  Editar a escala pelo síndico fica para o grupo Administração.
- "Interfone" é o interfone físico do prédio; o app só lembra o porteiro de usá-lo e não liga para ninguém.
- O botão de emergência e o alerta geral da portaria ficam na spec de Segurança.
- Pedido de controle ou chave fica no grupo Administração.
