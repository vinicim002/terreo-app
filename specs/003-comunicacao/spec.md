# Especificação: Comunicação

**Branch**: `main` (sem branch própria da funcionalidade)

**Criada em**: 2026-11-17

**Status**: Rascunho

**Entrada**: Etapa 2 do `docs/backlog.md`, grupo Comunicação, com dados locais (front-end primeiro; envio real pelo
WhatsApp e push na Etapa 3). Avisos do prédio (só o síndico publica; tipos; importante; agendar; lembrete na véspera;
envio ao grupo do WhatsApp simulado; confirmação de leitura; quantos leram; resolvido); agenda do prédio (calendário do
mês e "Próximos"); reuniões do conselho (data, horário, local, pauta e resumo depois); enquetes (pergunta, opções,
encerramento, oficial com um voto por apartamento, resultado parcial, mudar voto, vencedora); notificações (central do
sino e preferências por tipo e canal, com emergências sempre para todos).

**Referências**: `arquivos-gerais-terreo/minimundo-terreo.md` (Avisos do prédio, Calendário do prédio, Reuniões do
conselho, Enquetes rápidas), mockups 06_avisos, 07_aviso_detalhe, 21_enquetes, 22_agenda, 29_notificacoes,
37_sindico_novo_aviso, 38_sindico_enquete, `specs/002-acesso-e-cadastro/` (pessoas, papéis, permissão de votar),
`.specify/memory/constitution.md` (1.2.0).

## Esclarecimentos

### Sessão 2026-11-17

- P: Numa enquete oficial, se duas pessoas do apartamento têm permissão de votar, qual voto vale? → R: Só o do
  responsável. As outras pessoas com permissão registram uma sugestão, que o responsável vê ao votar.
- P: O aviso que vai ao grupo do WhatsApp também vai ao privado de cada morador? → R: Não. Avisos, reuniões e enquetes
  (assuntos gerais) vão ao grupo e ao app; no privado só vai o que é pessoal (entregas, visitantes, convites).
- P: O síndico pode editar um aviso já publicado? → R: Sim. O aviso mostra "Editado às HH:MM", volta a não lido para
  todos, gera a notificação "Aviso atualizado" e, se o original foi ao grupo, uma mensagem de correção vai ao grupo.

## Cenários de uso e testes *(obrigatório)*

### História 1: O síndico publica avisos e os moradores leem (Prioridade: P1)

O síndico escreve um aviso — tipo (falta d'água, elevador, energia, reunião ou geral), título e mensagem — e publica na
hora. O aviso aparece para todos os moradores e para a portaria, chega como alerta no celular e é enviado ao grupo do
WhatsApp do condomínio. O morador vê a lista de avisos, com os não lidos em destaque, abre um aviso e ele passa a
contar como lido. Os avisos antigos continuam guardados para consulta.

**Por que esta prioridade**: avisos são a principal razão do app no piloto (falta d'água, elevador, energia) e o que
substitui procurar mensagens no grupo.

**Teste independente**: entrar como síndica, publicar um aviso; entrar como morador, ver o aviso como não lido, abrir e
ver que passou a lido; conferir a mensagem simulada no grupo do WhatsApp.

**Cenários de aceite**:

1. **Dado** o síndico em Avisos, **quando** publica um aviso com tipo, título e mensagem, **então** o aviso aparece no
   topo da lista de todos os moradores e da portaria, com a data e a hora da publicação.
2. **Dado** um aviso publicado com "Enviar também no WhatsApp", **quando** é publicado, **então** uma mensagem com o
   título e o texto é enviada ao grupo do WhatsApp do condomínio, e o detalhe do aviso informa isso.
3. **Dado** um aviso novo, **quando** é publicado, **então** cada morador recebe uma notificação "Novo aviso do síndico"
   (conforme as preferências da História 5).
4. **Dado** um morador com avisos não lidos, **quando** abre Avisos, **então** vê o filtro "Não lidos (N)" e uma marca
   em cada aviso não lido; ao abrir um aviso, ele passa a lido.
5. **Dado** um morador, **quando** abre o detalhe de um aviso, **então** vê tipo, título, autor (síndico), data, texto
   completo e se foi enviado ao grupo.
6. **Dado** um morador ou porteiro, **quando** tenta criar um aviso, **então** a opção não existe; só o síndico publica.

---

### História 2: Avisos importantes, agendados e resolvidos (Prioridade: P2)

O síndico marca um aviso como importante e pede confirmação de leitura: o morador precisa tocar em "Confirmar leitura",
e o síndico vê quantos apartamentos leram e quem confirmou. O síndico pode escrever o aviso com antecedência e agendar o
dia e a hora da publicação, e pedir um lembrete na véspera. Quando o problema acaba (a água voltou), o síndico marca o
aviso como resolvido e todos são avisados.

**Por que esta prioridade**: completa o fluxo de avisos que o minimundo descreve; depende da História 1.

**Teste independente**: publicar um aviso importante com confirmação; confirmar como dois moradores de apartamentos
diferentes; conferir "Lido por 2 de 48 apartamentos" e a lista de quem confirmou; agendar outro aviso para o futuro e
ver que só aparece na hora; marcar o primeiro como resolvido e ver a notificação nos moradores.

**Cenários de aceite**:

1. **Dado** um aviso com "Pedir confirmação de leitura", **quando** o morador o abre, **então** vê o botão "Confirmar
   leitura"; ao tocar, o botão vira "Lido ✓" e a confirmação fica registrada com data e hora.
2. **Dado** um aviso publicado, **quando** o síndico abre o detalhe, **então** vê "Lido por N de M apartamentos" (um
   apartamento conta como lido quando qualquer pessoa dele leu) e, se pediu confirmação, a lista de quem confirmou e de
   quem ainda não confirmou.
3. **Dado** o síndico criando um aviso, **quando** escolhe "Publicar em" uma data e hora futuras, **então** o aviso fica
   em "Agendados" (visível só para o síndico) e é publicado sozinho no horário, com o alerta e o envio ao grupo.
4. **Dado** um aviso agendado, **quando** o síndico o edita ou cancela antes do horário, **então** a mudança vale e
   nenhum morador o vê antes.
5. **Dado** um aviso com "Lembrar na véspera" e um assunto com data (ex.: falta d'água na quinta), **quando** chega a
   véspera, **então** os moradores recebem um lembrete do aviso.
6. **Dado** um aviso publicado, **quando** o síndico marca como resolvido (podendo escrever uma nota, ex.: "A água
   voltou às 13h"), **então** o aviso mostra "Resolvido" e todos os moradores recebem uma notificação.
7. **Dado** um aviso importante, **quando** aparece na lista, **então** tem a marca "Importante" e fica destacado.
8. **Dado** um aviso já publicado, **quando** o síndico o edita (título, mensagem, tipo ou importante), **então** o aviso
   mostra "Editado às HH:MM", volta a aparecer como não lido para todos, os moradores recebem "Aviso atualizado" e, se o
   original foi ao grupo, uma mensagem de correção vai ao grupo. Confirmações de leitura anteriores são zeradas, para
   que todos confirmem a versão nova.

---

### História 3: Enquetes (Prioridade: P3)

O síndico cria uma enquete: pergunta, de 2 a 6 opções, data de encerramento, se é oficial (um voto por apartamento) e
se mostra o resultado parcial. Os moradores votam com um toque e podem mudar o voto enquanto ela estiver aberta. Nas
enquetes comuns, vota quem tem a permissão "Pode votar em enquetes" (spec 002), cada um com o seu voto. Nas oficiais,
o voto do apartamento é do responsável; as outras pessoas com permissão deixam uma sugestão, que o responsável vê.
Encerrada, a enquete mostra a opção vencedora e as porcentagens.

**Por que esta prioridade**: decisões rápidas do prédio (cor da fachada, horário do portão) hoje se perdem no grupo.

**Teste independente**: criar uma enquete oficial com resultado parcial; sugerir uma opção como familiar do 804 com
permissão; votar como o responsável do 804 vendo a sugestão; mudar o voto; encerrar e conferir a vencedora.

**Cenários de aceite**:

1. **Dado** o síndico, **quando** cria uma enquete com pergunta, opções, data de encerramento, "Um voto por
   apartamento" e "Mostrar resultado parcial", **então** ela aparece aberta para os moradores e eles recebem uma
   notificação.
2. **Dado** uma enquete aberta, **quando** um morador que pode votar toca numa opção, **então** o voto é registrado, a
   opção aparece marcada ("Você votou em …") e, se o resultado parcial estiver ligado, as porcentagens aparecem.
3. **Dado** uma enquete aberta em que o morador já votou, **quando** toca em "Mudar voto" e escolhe outra opção,
   **então** o voto anterior é substituído.
4. **Dado** uma enquete oficial, **quando** o responsável do apartamento vota, **então** esse é o voto do apartamento,
   e o apartamento conta um voto só.
5. **Dado** uma enquete oficial, **quando** outra pessoa do apartamento com permissão de votar a abre, **então** pode
   tocar numa opção como "Sugerir ao responsável"; o responsável vê as sugestões da casa ("Luiza sugeriu: Bege") ao
   votar, e a sugestão não conta no resultado.
6. **Dado** uma enquete (oficial ou comum), **quando** um morador sem a permissão de votar a abre, **então** vê a
   pergunta e, se for o caso, o resultado parcial, sem poder votar nem sugerir.
6a. **Dado** uma enquete comum, **quando** pessoas do mesmo apartamento com permissão votam, **então** cada pessoa tem o
   seu voto.
7. **Dado** uma enquete com "Mostrar resultado parcial" desligado, **quando** o morador vota, **então** não vê as
   porcentagens até o encerramento.
8. **Dado** a data de encerramento, **quando** ela passa (ou o síndico encerra antes), **então** a enquete vai para
   "Encerradas", mostra a vencedora com a porcentagem e o total de votos, e ninguém mais vota. Empate: o app mostra
   "Empate" e as opções empatadas.

---

### História 4: Agenda do prédio e reuniões do conselho (Prioridade: P4)

A agenda mostra o mês em forma de calendário, com uma marca nos dias que têm algo, e a lista "Próximos": reuniões do
conselho, manutenções programadas e lembretes da rotina (ex.: coleta seletiva toda terça). O síndico cadastra reuniões
com data, horário, local e pauta; os moradores são avisados com antecedência. Depois da reunião, o síndico registra o
resumo do que foi decidido, que fica disponível para todos. O síndico também cadastra eventos da rotina e manutenções,
que podem se repetir.

**Por que esta prioridade**: reúne em um lugar o que hoje fica espalhado; usa os avisos e as notificações das
histórias anteriores.

**Teste independente**: cadastrar uma reunião para daqui a 5 dias e um evento semanal; conferir as marcas no calendário
e a ordem em "Próximos"; registrar o resumo da reunião depois da data e conferir que o morador o lê.

**Cenários de aceite**:

1. **Dado** um morador, **quando** abre a Agenda, **então** vê o mês atual com marcas nos dias com eventos e a lista
   "Próximos", em ordem de data, com o tipo de cada evento (reunião, manutenção, rotina, mudança).
2. **Dado** o calendário, **quando** o morador toca num dia, **então** vê os eventos daquele dia; pode ir ao mês
   anterior e ao próximo.
3. **Dado** o síndico, **quando** cadastra uma reunião com data, horário, local e pauta, **então** ela aparece na agenda
   e nas reuniões, e os moradores recebem uma notificação na hora e um lembrete na véspera.
4. **Dado** uma reunião que já aconteceu, **quando** o síndico registra o resumo do que foi decidido, **então** o
   resumo aparece na reunião, com a marca "Resumo disponível", e os moradores são notificados.
5. **Dado** o síndico, **quando** cadastra um evento de rotina ou manutenção que se repete (toda semana, todo mês, a cada
   6 meses ou todo ano), **então** as próximas ocorrências aparecem na agenda com a marca da repetição.
6. **Dado** um morador ou porteiro, **quando** abre a agenda ou uma reunião, **então** só vê; cadastrar, editar e
   registrar resumo são só do síndico.

---

### História 5: Notificações e preferências (Prioridade: P5)

O sino do cabeçalho mostra quantas notificações não lidas a pessoa tem. A central de notificações lista tudo agrupado em
"Hoje", "Ontem" e "Antes", com "Ler todas". Cada notificação leva para o que ela fala (o aviso, a enquete, a reunião).
Em "Como receber", a pessoa escolhe, por tipo, se recebe no app; e, para o que é pessoal (entregas e visitantes), se
recebe também no privado do WhatsApp. Assuntos gerais (avisos, reuniões, enquetes) vão ao grupo do WhatsApp do
condomínio, nunca ao privado. Alertas de emergência chegam sempre, para todos.

**Por que esta prioridade**: o minimundo pede que cada morador escolha o que recebe; os avisos e enquetes já geram
notificações nas histórias anteriores.

**Teste independente**: publicar um aviso e criar uma enquete; conferir o número no sino, a central agrupada e
"Ler todas"; desligar "Enquetes no app" e conferir que a próxima enquete não gera notificação no app, mas continua indo
ao grupo do WhatsApp.

**Cenários de aceite**:

1. **Dado** notificações não lidas, **quando** a pessoa olha o cabeçalho, **então** o sino mostra a quantidade (até "9+").
2. **Dado** a central, **quando** a pessoa a abre, **então** vê as notificações em "Hoje", "Ontem" e "Antes", da mais
   nova para a mais antiga, com ícone, título, texto curto e hora; as não lidas ficam destacadas.
3. **Dado** uma notificação, **quando** a pessoa toca nela, **então** vai para o item correspondente e ela passa a lida.
4. **Dado** a central, **quando** a pessoa toca em "Ler todas", **então** todas passam a lidas e o sino zera.
5. **Dado** "Como receber", **quando** a pessoa desliga um tipo num canal (ex.: enquetes no app, ou entregas no
   WhatsApp), **então** os próximos envios daquele tipo não vão por aquele canal; a escolha é lembrada em todos os
   aparelhos da pessoa. Para avisos, reuniões e enquetes, o WhatsApp aparece como "Pelo grupo do condomínio", sem
   opção de privado.
6. **Dado** qualquer preferência, **quando** chega um alerta de emergência, **então** ele chega no app e no WhatsApp
   para todos, e a opção de emergência aparece travada como "Sempre ativa".
7. **Dado** um aviso enviado ao grupo do WhatsApp, **quando** é publicado, **então** nenhum morador recebe cópia no
   privado do WhatsApp, qualquer que seja a preferência.

---

### Casos-limite

- Aviso agendado para um horário que já passou quando o síndico salva: o app avisa e oferece publicar agora.
- Aviso apagado pelo síndico: some da lista dos moradores; as notificações que apontavam para ele mostram "Aviso não
  está mais disponível".
- Morador que entra depois de um aviso publicado: vê o aviso como não lido; ele conta no "Lido por N de M" quando abrir.
- Apartamento sem cadastro (spec 002): não entra no total "de M apartamentos".
- Enquete com uma opção só, ou pergunta vazia: o app não deixa publicar (mínimo 2, máximo 6 opções).
- Enquete oficial em apartamento sem responsável (spec 002): o apartamento não vota; as sugestões ficam guardadas.
- Troca de responsável durante uma enquete oficial aberta: o voto já dado continua valendo para o apartamento; o novo
  responsável pode mudá-lo.
- Voto feito sem internet: nesta etapa os dados estão no aparelho; quando houver servidor, o app avisa que é preciso
  internet para votar.
- Reunião editada (data ou local) depois de avisada: os moradores recebem uma notificação da mudança.
- Evento que se repete com data inválida no mês (ex.: dia 31 em mês de 30 dias): cai no último dia do mês.
- Fuso: todas as datas e horas no fuso de Brasília.

## Requisitos *(obrigatório)*

### Requisitos funcionais

**Avisos**

- **RF-001**: Só o síndico DEVE poder criar, editar, agendar, apagar e marcar avisos como resolvidos; moradores e
  portaria DEVEM poder ler.
- **RF-002**: Um aviso DEVE ter tipo (falta d'água, elevador, energia, reunião, geral), título (3 a 120 caracteres),
  mensagem (até 2.000 caracteres), marca de importante, opção de enviar ao grupo do WhatsApp (ligada por padrão),
  opção de pedir confirmação de leitura e opção de lembrar na véspera de uma data.
- **RF-003**: O aviso DEVE poder ser publicado na hora ou agendado para data e hora futuras; agendados só aparecem para
  o síndico, em "Agendados", até a hora da publicação.
- **RF-004**: Ao ser publicado, o aviso DEVE gerar uma notificação no app para cada morador (conforme as preferências)
  e, se marcado, uma única mensagem ao grupo do WhatsApp do condomínio (simulada nesta etapa); nunca cópias no privado.
- **RF-005**: A lista de avisos DEVE ter os filtros "Todos" e "Não lidos (N)" para todos e "Agendados" para o síndico,
  em ordem do mais novo para o mais antigo, com importantes destacados.
- **RF-006**: Abrir o detalhe de um aviso DEVE marcá-lo como lido para aquela pessoa; em avisos com confirmação, a
  leitura só conta como confirmada ao tocar em "Confirmar leitura".
- **RF-007**: O síndico DEVE ver, em cada aviso, "Lido por N de M apartamentos" (M = apartamentos com pessoas ativas)
  e, nos com confirmação, a lista de pessoas que confirmaram e de apartamentos que ainda não confirmaram.
- **RF-007a**: O síndico DEVE poder editar um aviso publicado; a edição registra a data, mostra "Editado às HH:MM",
  zera leituras e confirmações daquele aviso, notifica os moradores ("Aviso atualizado") e, se o original foi ao grupo,
  envia uma mensagem de correção ao grupo.
- **RF-008**: Marcar um aviso como resolvido DEVE registrar a data, aceitar uma nota opcional e notificar todos os
  moradores.
- **RF-009**: O lembrete na véspera DEVE gerar uma notificação aos moradores no dia anterior à data indicada no aviso.

**Enquetes**

- **RF-010**: Só o síndico DEVE criar e encerrar enquetes; uma enquete tem pergunta (5 a 200 caracteres), de 2 a 6
  opções, data de encerramento futura, "Um voto por apartamento" (oficial) e "Mostrar resultado parcial".
- **RF-011**: Em enquetes oficiais, só o responsável do apartamento DEVE votar, e cada apartamento DEVE ter no máximo
  um voto. As outras pessoas do apartamento com a permissão "Pode votar em enquetes" (spec 002) DEVEM poder registrar uma
  sugestão (uma por pessoa, trocável enquanto aberta), que o responsável vê ao votar e que não conta no resultado.
- **RF-012**: Em enquetes comuns, cada morador com a permissão "Pode votar em enquetes" DEVE ter o próprio voto;
  moradores sem a permissão só veem.
- **RF-013**: Enquanto a enquete estiver aberta, quem votou DEVE poder mudar o voto.
- **RF-014**: O resultado DEVE mostrar porcentagem e total de votos; com resultado parcial desligado, só depois do
  encerramento.
- **RF-015**: Encerrada (pela data ou pelo síndico), a enquete DEVE parar de aceitar votos e mostrar a vencedora ou
  "Empate".
- **RF-016**: A portaria NÃO DEVE votar nem ver enquetes.

**Agenda e reuniões**

- **RF-017**: A agenda DEVE mostrar um mês por vez, com marca nos dias com eventos, navegação entre meses e a lista
  "Próximos" (os 10 próximos eventos a partir de hoje).
- **RF-018**: A agenda DEVE reunir: reuniões do conselho, eventos cadastrados pelo síndico (manutenção ou rotina, com
  repetição: nenhuma, toda semana, todo mês, a cada 6 meses, todo ano) e avisos com data.
- **RF-019**: Só o síndico DEVE cadastrar, editar e cancelar reuniões e eventos; moradores e portaria só veem.
- **RF-020**: Uma reunião DEVE ter data, horário, local (até 120 caracteres) e pauta (lista de assuntos); ao ser
  cadastrada ou mudada, os moradores DEVEM ser notificados, e na véspera recebem um lembrete.
- **RF-021**: Depois da data da reunião, o síndico DEVE poder registrar o resumo do que foi decidido (até 5.000
  caracteres); os moradores DEVEM ser notificados e ver o resumo na reunião.

**Notificações**

- **RF-022**: Toda pessoa DEVE ter uma central de notificações com contagem de não lidas no sino, grupos "Hoje",
  "Ontem" e "Antes", marcação de lida ao tocar e "Ler todas".
- **RF-023**: Cada notificação DEVE ter tipo, título, texto curto, data e hora e o destino (aviso, enquete, reunião);
  tocar leva ao destino.
- **RF-024**: A pessoa DEVE poder ligar e desligar, por tipo (avisos, reuniões, enquetes, entregas, visitantes), o que
  recebe no app; e, só para os tipos pessoais (entregas, visitantes), o que recebe no privado do WhatsApp. O padrão é
  tudo ligado. As preferências valem para a pessoa em todos os aparelhos.
- **RF-025**: Alertas de emergência DEVEM ignorar as preferências e chegar a todos, no app e no WhatsApp; a opção
  aparece travada como "Sempre ativa".
- **RF-026**: Assuntos gerais (avisos, reuniões, enquetes) DEVEM ir ao grupo do WhatsApp do condomínio, que não depende
  das preferências individuais, e NUNCA ao privado; o privado do WhatsApp é só para assuntos pessoais.
- **RF-027**: Nesta etapa, o envio ao WhatsApp (grupo e privado) é simulado: as mensagens ficam na caixa de saída do
  painel de desenvolvimento.

**Comum**

- **RF-028**: Todas as permissões desta spec DEVEM ser conferidas nos serviços (como na spec 002), inclusive "só o
  síndico publica" e "um voto por apartamento".
- **RF-029**: Todos os textos novos DEVEM existir em português, inglês e espanhol; datas e horas no fuso de Brasília.
- **RF-030**: Os dados de exemplo DEVEM incluir avisos (lidos, não lidos, importante com confirmação, agendado,
  resolvido), uma enquete aberta e duas encerradas, uma reunião futura e uma passada com resumo, e eventos de rotina.

### Entidades principais

- **Aviso**: tipo, título, mensagem, importante, enviar ao grupo, pedir confirmação, data de referência para o
  lembrete, publicar em, publicado em, editado em, resolvido em e nota de resolução, autor.
- **Leitura de aviso**: pessoa, aviso, lido em, confirmado em.
- **Enquete**: pergunta, opções, encerra em, oficial, mostrar parcial, encerrada em, autor.
- **Voto**: enquete, opção, pessoa e, nas oficiais, apartamento (sempre do responsável).
- **Sugestão de voto**: enquete oficial, opção, pessoa e apartamento; só visível para o responsável daquele apartamento.
- **Reunião**: data e hora, local, pauta, resumo e data do resumo.
- **Evento da agenda**: título, tipo (manutenção, rotina), data e hora, repetição.
- **Notificação**: pessoa, tipo, título, texto, destino, criada em, lida em.
- **Preferências de notificação**: pessoa; por tipo, no app (ligado/desligado); para entregas e visitantes, também no
  privado do WhatsApp.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **CS-001**: O síndico publica um aviso em menos de 1 minuto, do toque em "Novo aviso" até a publicação.
- **CS-002**: Um morador encontra um aviso de até 30 dias atrás em menos de 15 segundos, sem procurar no grupo.
- **CS-003**: O morador vota numa enquete com no máximo 2 toques a partir da lista de enquetes.
- **CS-004**: 100% das tentativas de publicar aviso, criar enquete, cadastrar reunião ou votar duas vezes pelo mesmo
  apartamento numa enquete oficial são recusadas pelos serviços quando não permitidas, conferido por teste automático.
- **CS-005**: A contagem "Lido por N de M apartamentos" confere com as leituras registradas em 100% dos casos de teste.
- **CS-006**: Com uma preferência desligada, 0 mensagens daquele tipo chegam pelo canal desligado; 0 avisos, reuniões ou
  enquetes chegam ao privado do WhatsApp; emergências chegam a 100% das pessoas.
- **CS-007**: Avisos agendados ficam visíveis aos moradores só a partir do horário marcado, em 100% dos testes com
  relógio controlado.

## Premissas

- Front-end primeiro: tudo funciona com os dados no aparelho, sobre os serviços da spec 002. Sem servidor, a
  "publicação na hora marcada", os lembretes da véspera e o encerramento das enquetes acontecem quando alguém abre o app
  depois do horário (o app confere e aplica na hora). Na Etapa 3, a fila de tarefas faz isso no servidor.
- O "alerta no celular" (push) é simulado como notificação na central do app; o push de verdade vem na Etapa 3.
- A portaria lê avisos e a agenda (ex.: elevador em manutenção), mas não vota em enquetes nem confirma leitura.
- "Lido por N de M": um apartamento conta como lido quando qualquer pessoa ativa dele abriu o aviso. A confirmação de
  leitura é por pessoa, e o síndico vê também por apartamento.
- Nas enquetes oficiais, o voto pertence ao apartamento e é sempre dado pelo responsável; nas comuns, cada pessoa com
  permissão vota.
- Os tipos "entregas" e "visitantes" já aparecem nas preferências, mas só passam a gerar notificações na spec da
  Portaria. Alertas de emergência são criados na spec de Segurança; aqui só a regra de que ignoram preferências.
- Confirmar leitura pelo WhatsApp (respondendo à mensagem) depende do WhatsApp real e fica para a Etapa 3.
- Lembretes da rotina obrigatórios do síndico (extintores, vistoria) e a edição de outros textos ficam para o grupo
  Administração; aqui o síndico já pode cadastrar eventos de rotina e manutenção que se repetem.
- Os textos dos avisos, enquetes e reuniões são conteúdo do condomínio (não traduzidos); só a interface é traduzida.
