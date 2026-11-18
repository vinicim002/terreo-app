# Especificação: Segurança

**Branch**: `main` (sem branch própria da funcionalidade)

**Criada em**: 2026-11-18

**Status**: Rascunho

**Entrada**: Etapa 2 do `docs/backlog.md`, grupo Segurança, com dados locais (front-end primeiro; push e WhatsApp
reais na Etapa 3). Botão de emergência do morador (segurar 3 segundos, tipo opcional, alerta em tela cheia na
portaria com apartamento, andar, quem enviou e o contato de emergência; "Estou indo"; cancelar; ligar direto; síndico
avisado; histórico); alerta geral do porteiro ou do síndico para todos os moradores (tipo, mensagem curta ditada,
destaque no app e WhatsApp no grupo e no privado, ignorando preferências; encerrar e avisar todos); contatos
importantes (do prédio e de emergência, com busca, ligar ou WhatsApp; o síndico mantém a lista).

**Referências**: `arquivos-gerais-terreo/minimundo-terreo.md` (Botão de emergência, Alerta geral, Contatos
importantes), mockups 12_emergencia, 13_emergencia_enviada, 15_contatos, 34_portaria_alerta,
`specs/002-acesso-e-cadastro/` (contato de emergência do apartamento), `specs/003-comunicacao/` (notificações;
emergência ignora preferências), `specs/004-portaria/` (equipe de plantão, ditar), `.specify/memory/constitution.md`
(1.2.0).

## Esclarecimentos

### Sessão 2026-11-18

- P: Além da portaria e do síndico, quem é avisado quando o morador aperta o botão de emergência? → R: As outras
  pessoas ativas do apartamento (no app e no privado) e o contato de emergência do apartamento (spec 002), por uma
  mensagem no WhatsApp dele, mesmo não sendo usuário do app.
- P: O celular pessoal do síndico e do porteiro-chefe aparece para todos nos Contatos? → R: Só se a própria pessoa
  autorizar ("Mostrar meu celular nos contatos", desligado por padrão). Sem autorização, aparece o nome e a função, sem
  número; a portaria aparece sempre.
- P: Dá para pedir ajuda pelo WhatsApp do condomínio, sem o app? → R: Sim. Mensagem com "SOS" ou "socorro", vinda de
  um celular cadastrado, cria o mesmo alerta do botão (tipo "não informado") e responde que a portaria foi avisada.
  Nesta etapa é simulado no painel `/dev`, como os códigos de entrega (spec 004).

## Cenários de uso e testes *(obrigatório)*

### História 1: O morador pede ajuda e a portaria vai até ele (Prioridade: P1)

Uma moradora idosa que mora sozinha passa mal e não consegue interfonar. Ela abre o Térreo, toca em Emergência e
**segura** o botão grande por 3 segundos — assim ninguém dispara sem querer. Se quiser, escolhe o que está
acontecendo (saúde, incêndio, invasão, vazamento, outro). Na mesma hora, o celular da portaria mostra um alerta em tela
cheia com o apartamento, o andar, quem pediu ajuda, o tipo e o contato de emergência do apartamento. O porteiro de
plantão toca "Estou indo", e a moradora vê "Jonas viu o alerta e está a caminho". O síndico também é avisado.

**Por que esta prioridade**: é a função que pode salvar uma vida; é o motivo de segurança mais citado no minimundo.

**Teste independente**: o responsável do 804 segura o botão por 3 segundos com "Saúde"; a portaria vê o alerta em
tela cheia com "Apto 804 · 8º andar · Saúde" e o contato de emergência; toca "Estou indo"; o morador vê o nome do
porteiro e "a caminho".

**Cenários de aceite**:

1. **Dado** um morador em Emergência, **quando** segura o botão, **então** vê o progresso dos 3 segundos; se soltar
   antes, nada é enviado.
2. **Dado** o botão segurado por 3 segundos, **então** o alerta é enviado com o apartamento, quem enviou, a hora e o
   tipo escolhido (ou "não informado"), e o morador vê "Alerta enviado — a portaria foi avisada às HH:MM".
3. **Dado** um alerta enviado, **então** todos os porteiros com plantão agora (spec 004) recebem na hora um alerta em
   tela cheia, por cima de qualquer tela da portaria, com som e vibração quando o aparelho permitir; os outros
   porteiros e o síndico recebem a notificação de emergência. As outras pessoas do apartamento também são avisadas
   (app e privado), e o contato de emergência do apartamento recebe uma mensagem no WhatsApp ("Ana Queiroz pediu ajuda
   no apartamento 804 do Edifício Taquaretinga às 21:14. A portaria foi avisada.").
4. **Dado** o alerta na portaria, **então** ele mostra o apartamento em letras grandes, o andar, o tipo, quem enviou,
   há quanto tempo e o contato de emergência do apartamento (nome, parentesco e celular), se houver.
5. **Dado** o alerta na portaria, **quando** um porteiro toca "Estou indo", **então** o alerta fica atendido por ele, os
   outros porteiros veem quem foi, e o morador vê "Jonas viu o alerta e está a caminho".
6. **Dado** um alerta em aberto, **quando** o morador toca "Cancelar alerta" e confirma, **então** a portaria vê
   "Cancelado pelo morador" e o alerta sai da tela cheia.
7. **Dado** um alerta atendido, **quando** o porteiro toca "Resolvido" (com uma nota opcional, ditada), **então** o
   alerta é encerrado e fica no histórico.
8. **Dado** a tela de Emergência, **então** o morador também pode ligar direto para a portaria, para o SAMU (192), os
   Bombeiros (193) e a Polícia (190) com um toque.
9a. **Dado** um morador sem o app, **quando** manda "SOS" ou "socorro" ao WhatsApp do condomínio do celular cadastrado,
   **então** o mesmo alerta é criado (tipo "não informado") e ele recebe no privado "A portaria foi avisada. Se puder,
   ligue para 192 (SAMU)"; mensagem de celular desconhecido não cria alerta.
9. **Dado** um alerta em aberto do mesmo apartamento, **quando** alguém do apartamento tenta enviar outro, **então** o
   app mostra o alerta em andamento em vez de criar um novo.

---

### História 2: Alerta geral para o prédio inteiro (Prioridade: P2)

Começa um princípio de incêndio no 3º andar. O porteiro (ou o síndico) toca em "Alerta geral", escolhe o tipo
(incêndio, vazamento de gás, falta de energia, segurança, outro), dita uma mensagem curta ("Fumaça no 3º andar, desçam
pela escada") e envia. Todos os moradores recebem ao mesmo tempo um alerta com destaque em tela cheia no app e a
mensagem no grupo do WhatsApp do condomínio e no privado de cada um, mesmo quem desligou as notificações. Quando a
situação passa, quem enviou marca o alerta como encerrado ("Situação controlada") e todos são avisados.

**Por que esta prioridade**: em emergência coletiva, avisar todos em segundos é essencial; usa a regra de canais da
spec 003.

**Teste independente**: a portaria envia um alerta geral de incêndio com mensagem ditada; o morador do 804 vê a tela
cheia; a caixa de saída simulada tem uma mensagem no grupo e uma no privado de cada morador ativo; o porteiro encerra
e todos recebem "Situação controlada".

**Cenários de aceite**:

1. **Dado** a portaria ou o síndico, **quando** envia um alerta geral com tipo e mensagem (até 280 caracteres),
   **então** ele precisa confirmar ("Enviar para todos os moradores?") antes de enviar.
2. **Dado** um alerta geral enviado, **então** todas as pessoas ativas do condomínio (moradores, porteiros e síndico)
   recebem a notificação de emergência e, no app aberto, o alerta em tela cheia com o tipo, a mensagem, quem enviou e
   a hora.
3. **Dado** um alerta geral, **então** vai uma mensagem ao grupo do WhatsApp do condomínio e uma no privado de cada
   pessoa ativa, mesmo com as preferências desligadas (spec 003, RF-025).
4. **Dado** o alerta em tela cheia no app do morador, **quando** ele toca "Entendi", **então** a tela cheia fecha e o
   alerta continua no topo do início enquanto estiver em aberto.
5. **Dado** um alerta geral em aberto, **quando** quem enviou (ou o síndico) toca "Encerrar" com uma mensagem opcional,
   **então** todos recebem "Alerta encerrado" (no app, no grupo e no privado) e o destaque some.
6. **Dado** um morador, **quando** tenta enviar um alerta geral, **então** a opção não existe; só a portaria e o síndico
   enviam.
7. **Dado** o porteiro no alerta geral, **então** pode ditar a mensagem (spec 004) e há mensagens prontas por tipo para
   enviar com um toque.

---

### História 3: Contatos importantes (Prioridade: P3)

Os contatos mais importantes ficam em um só lugar, sempre à mão: do prédio (portaria, síndico, porteiro-chefe) e de
emergência e serviços (SAMU, Bombeiros, Polícia Militar, Defesa Civil, concessionárias de luz, gás e água). Cada um tem
o botão de ligar e, quando é celular, o de WhatsApp. Há busca. O síndico mantém a lista: acrescenta, edita, reordena e
remove os contatos.

**Por que esta prioridade**: útil todo dia e na emergência; simples de entregar.

**Teste independente**: o morador busca "luz" e encontra a concessionária de energia; toca em ligar; o síndico
acrescenta "Chaveiro 24h" e ele aparece para todos.

**Cenários de aceite**:

1. **Dado** qualquer perfil, **quando** abre Contatos, **então** vê os grupos "Do prédio" e "Emergência e serviços",
   cada contato com nome, descrição curta (ex.: "24h") e número.
2. **Dado** um contato, **quando** a pessoa toca em ligar, **então** o celular abre a ligação para o número; se o
   número for celular, também há o botão de WhatsApp.
3. **Dado** a busca, **quando** a pessoa digita parte do nome ou da descrição (sem precisar de acento), **então** a
   lista mostra só os contatos que combinam.
4. **Dado** o síndico, **quando** acrescenta, edita, muda a ordem ou remove um contato, **então** a lista muda para
   todos.
5. **Dado** os contatos do prédio, **então** portaria, síndico e porteiro-chefe vêm do cadastro (spec 002 e 001) e se
   atualizam sozinhos quando o cadastro muda.
5a. **Dado** o síndico ou o porteiro-chefe, **quando** liga "Mostrar meu celular nos contatos" no próprio perfil,
   **então** o celular dele aparece em Contatos com ligar e WhatsApp; desligado (o padrão), aparece só o nome e a
   função, sem número.
6. **Dado** um morador ou porteiro, **quando** abre Contatos, **então** só vê; editar é só do síndico.

---

### História 4: Histórico de emergências (Prioridade: P4)

O síndico e a portaria veem o histórico dos alertas — de apartamentos e gerais — com data, tipo, quem enviou, quem
atendeu, quanto tempo levou até alguém responder e como terminou. O morador vê os alertas do próprio apartamento.

**Por que esta prioridade**: ajuda o síndico a acompanhar e melhorar o atendimento; depende das histórias 1 e 2.

**Teste independente**: depois de um alerta atendido e de um alerta geral encerrado, o síndico abre o histórico e vê
os dois, com o tempo até o "Estou indo".

**Cenários de aceite**:

1. **Dado** o síndico ou a portaria, **quando** abre o histórico, **então** vê os alertas dos últimos 90 dias, do mais
   novo para o mais antigo, com tipo, apartamento (ou "Geral"), quem enviou, quem atendeu, tempo até o atendimento e
   situação (em aberto, atendido, resolvido, cancelado, encerrado).
2. **Dado** um morador, **quando** abre o histórico na tela de Emergência, **então** vê só os alertas do próprio
   apartamento e os alertas gerais.

---

### Casos-limite

- Sem nenhum porteiro de plantão na escala no momento: o alerta vai para todos os porteiros e para o síndico, e o
  morador vê "Sem porteiro de plantão agora — o síndico também foi avisado".
- Ninguém toca "Estou indo" em 2 minutos: o alerta volta a tocar na portaria e o síndico recebe um segundo aviso.
- Apartamento sem contato de emergência: a portaria vê "Sem contato de emergência cadastrado" e nenhuma mensagem sai
  para fora do prédio.
- O morador perde a internet depois de segurar o botão: nesta etapa os dados estão no aparelho; quando houver
  servidor, o app avisa que não conseguiu enviar e oferece ligar para a portaria.
- Dois porteiros tocam "Estou indo" quase juntos: vale o primeiro; o segundo vê quem já foi.
- Alerta geral com outro alerta geral em aberto: o app mostra o que está em aberto e pede para encerrar antes de
  enviar outro (atualizar um alerta aberto fica para depois).
- Contato sem número válido: o síndico não consegue salvar.
- Fuso: todas as datas e horas no fuso de Brasília.

## Requisitos *(obrigatório)*

### Requisitos funcionais

**Botão de emergência**

- **RF-001**: Toda pessoa ativa de um apartamento DEVE ter acesso ao botão de emergência, que só envia depois de
  segurado por 3 segundos contínuos, com o progresso visível; soltar antes cancela.
- **RF-002**: O alerta de apartamento DEVE registrar apartamento, quem enviou, hora e tipo opcional (saúde, incêndio,
  invasão, vazamento, outro).
- **RF-003**: O alerta DEVE chegar na hora a todos os porteiros de plantão (escala da spec 004) como tela cheia por cima
  de qualquer tela da portaria; os demais porteiros e o síndico DEVEM receber a notificação de emergência (no app e no
  privado do WhatsApp, ignorando preferências).
- **RF-003a**: O alerta de apartamento DEVE avisar também as outras pessoas ativas do apartamento (app e privado) e
  mandar uma mensagem no WhatsApp ao contato de emergência do apartamento, se houver, com quem pediu ajuda, o
  apartamento, o prédio e a hora; o cancelamento e a resolução DEVEM avisar as mesmas pessoas.
- **RF-004**: A portaria DEVE ver no alerta: apartamento, andar, tipo, quem enviou, há quanto tempo e o contato de
  emergência do apartamento (spec 002).
- **RF-005**: Um porteiro DEVE poder marcar "Estou indo" (o primeiro vale) e depois "Resolvido" com nota opcional; o
  morador DEVE ver quem atendeu e a situação.
- **RF-006**: Quem enviou ou o responsável do apartamento DEVE poder cancelar o alerta em aberto, com confirmação.
- **RF-007**: A tela de emergência DEVE ter ligação direta para a portaria, SAMU 192, Bombeiros 193 e Polícia 190.
- **RF-007a**: O alerta DEVE poder ser pedido também por mensagem ao WhatsApp do condomínio com "SOS" ou "socorro"
  (sem diferença de maiúsculas ou acento), vinda do celular de uma pessoa ativa de um apartamento; responde no privado
  confirmando. Celular desconhecido não cria alerta. Nesta etapa, simulado no painel `/dev` (constituição V).
- **RF-008**: Só pode haver um alerta em aberto por apartamento; um novo envio mostra o que está em andamento.
- **RF-009**: Sem "Estou indo" em 2 minutos, o alerta DEVE ser repetido na portaria e o síndico avisado de novo.

**Alerta geral**

- **RF-010**: Só a portaria e o síndico DEVEM enviar alerta geral, com tipo (incêndio, vazamento de gás, falta de
  energia, segurança, outro) e mensagem de 5 a 280 caracteres, com confirmação antes de enviar; a mensagem pode ser
  ditada e há mensagens prontas por tipo.
- **RF-011**: O alerta geral DEVE chegar a todas as pessoas ativas do condomínio no app (tela cheia quando o app está
  aberto) e no WhatsApp — uma mensagem no grupo e uma no privado de cada pessoa —, ignorando as preferências.
- **RF-012**: Quem enviou ou o síndico DEVE poder encerrar o alerta geral com mensagem opcional; o encerramento DEVE
  chegar pelos mesmos canais.
- **RF-013**: Enquanto um alerta geral estiver em aberto, ele DEVE aparecer em destaque no topo do início de todos os
  perfis.

**Contatos importantes**

- **RF-014**: Todos os perfis DEVEM ver os contatos em dois grupos ("Do prédio" e "Emergência e serviços"), com busca
  sem acento, botão de ligar e, para celulares, botão de WhatsApp.
- **RF-015**: Os contatos do prédio (portaria, síndico, porteiro-chefe) DEVEM vir do cadastro e se atualizar sozinhos.
  O celular pessoal do síndico e do porteiro-chefe só aparece se a própria pessoa ligar "Mostrar meu celular nos
  contatos" no perfil (desligado por padrão); o número da portaria aparece sempre.
- **RF-016**: O síndico DEVE poder acrescentar, editar (nome 2–60, descrição até 60, número válido), reordenar e
  remover os contatos de emergência e serviços; os demais só veem.
- **RF-017**: A lista inicial DEVE trazer SAMU 192, Bombeiros 193, Polícia Militar 190, Defesa Civil 199 e as
  concessionárias de energia, gás e água do Rio de Janeiro (nomes e números a confirmar com o síndico).

**Histórico**

- **RF-018**: O síndico e a portaria DEVEM ver o histórico dos últimos 90 dias (alertas de apartamento e gerais) com
  tipo, apartamento, quem enviou, quem atendeu, tempo até o atendimento e situação; o morador vê os do próprio
  apartamento e os gerais.

**Comum**

- **RF-019**: Alertas de emergência e alertas gerais NUNCA DEVEM depender das preferências de notificação (spec 003,
  RF-025); são os únicos avisos que vão ao privado de todos.
- **RF-020**: Todas as permissões desta spec DEVEM ser conferidas nos serviços, na matriz das specs anteriores.
- **RF-021**: Todos os textos novos em português, inglês e espanhol; datas e horas no fuso de Brasília; telas de alerta
  com contraste alto, letras grandes e botões de no mínimo 56 px.
- **RF-022**: Os dados de exemplo DEVEM incluir a lista de contatos, um alerta de apartamento resolvido e um alerta
  geral encerrado no histórico.

### Entidades principais

- **Alerta de emergência**: apartamento, tipo, quem enviou, criado em, situação (em aberto, atendido, resolvido,
  cancelado), quem atendeu e quando, nota de resolução, quem cancelou, repetições.
- **Alerta geral**: tipo, mensagem, quem enviou (portaria ou síndico), criado em, situação (em aberto, encerrado),
  mensagem de encerramento, quem encerrou e quando.
- **Contato**: grupo (do prédio, emergência e serviços), nome, descrição, número, é celular, ordem, origem (cadastro ou
  manual).
- **Preferência de exibição do celular**: pessoa (síndico ou porteiro-chefe), mostrar nos contatos (sim/não).
- **Número da portaria**: telefone fixo ou celular da portaria do condomínio, mantido pelo síndico.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **CS-001**: Do toque no botão ao alerta na tela da portaria, em menos de 5 segundos (incluindo os 3 segundos
  segurando), com o app da portaria aberto.
- **CS-002**: 0 alertas enviados por toque rápido sem querer (menos de 3 segundos segurando), conferido por teste.
- **CS-003**: 100% das pessoas ativas recebem o alerta geral no app e no WhatsApp (grupo e privado), mesmo com todas as
  preferências desligadas, conferido por teste.
- **CS-004**: O porteiro responde "Estou indo" com 1 toque a partir do alerta em tela cheia.
- **CS-005**: O morador encontra e liga para um contato de emergência em no máximo 2 toques a partir do início (atalho
  "Contatos" no início → ligar).
- **CS-006a**: "SOS", "sos", "Socorro!" e "SOCORRO" criam o alerta; mensagens sem essas palavras não criam,
  conferido por teste.
- **CS-006**: 100% das tentativas de enviar alerta geral, cancelar alerta de outro apartamento ou editar contatos sem
  permissão são recusadas pelos serviços, conferido por teste.

## Premissas

- Front-end primeiro: tudo funciona com os dados no aparelho, sobre os serviços das specs 002 a 004. "Na hora" aqui
  significa que a tela da portaria aberta confere novos alertas a cada poucos segundos; na Etapa 3, o push e a
  atualização em tempo real substituem isso. A repetição de 2 minutos é aplicada como as tarefas com horário da spec
  003.
- Som, vibração e tela cheia dependem do que o navegador e o aparelho permitem; sem permissão, a portaria vê o alerta
  em destaque e a notificação.
- Ligar e abrir o WhatsApp usam os links do próprio celular (o app não faz a ligação).
- Os números das concessionárias vêm pré-cadastrados como exemplo e precisam ser conferidos pelo síndico antes do
  lançamento.
- O alerta geral também pode ser criado pelo síndico pelo painel dele; o "Alerta geral" da portaria e o "Alertas de
  emergência" do catálogo (spec 001) passam a ter conteúdo nesta spec.
