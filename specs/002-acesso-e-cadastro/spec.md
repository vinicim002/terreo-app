# Especificação: Acesso e cadastro

**Branch**: `main` (sem branch própria da funcionalidade)

**Criada em**: 2026-11-16

**Status**: Rascunho

**Entrada**: Etapa 2 do `docs/backlog.md`, primeiro grupo — Acesso e cadastro, com dados locais (front-end primeiro; a
API vem na Etapa 3). Login sem senha pelo celular com código enviado pelo WhatsApp do condomínio (envio simulado nesta
etapa, com o código visível no desenvolvimento e na demonstração); sessão que continua conectada e só pede novo código
ao trocar de aparelho ou após cerca de seis meses sem uso; saída da conta; cadastro de apartamentos e do responsável
pelo síndico e convite do responsável; o responsável convida, edita e remove as outras pessoas do apartamento; perfil
do morador; carros, animais e contato de emergência; boas-vindas no primeiro acesso; Regras com confirmação de leitura
obrigatória; lista de apartamentos do síndico com filtros e situação dos convites; o perfil passa a vir do login.

**Referências**: `arquivos-gerais-terreo/minimundo-terreo.md` (Cadastro e acesso dos moradores, Regras, Boas-vindas ao
morador novo), mockups 01_login, 02_codigo, 03_boas_vindas, 25_regras, 26_perfil, 27_convidar, 39_sindico_moradores,
40_sindico_cadastrar, `specs/001-base-do-app/`, `.specify/memory/constitution.md` (1.2.0).

## Esclarecimentos

### Sessão 2026-11-16

- P: Como a portaria entra no app? → R: Cada porteiro com o próprio celular e código, como os moradores; fica
  registrado quem fez cada ação.
- P: O convite deve ter as permissões do mockup? → R: Sim. O responsável escolhe, por pessoa, "Pode cadastrar
  entregas" e "Pode votar em enquetes" (só um voto por apartamento). O responsável sempre tem as duas.
- P: A mesma pessoa pode ter mais de um papel? → R: Sim. Um celular pode ter vários papéis (ex.: morador do 804 e
  síndico); depois de entrar, a pessoa escolhe o papel e pode trocar pelos Ajustes.
- P: O que a portaria pode ver dos moradores? → R: De cada apartamento, nome, foto, tipo e carros (placa, modelo e
  cor). Celulares, animais e contato de emergência ficam fora.
- P: O app aceita celular de fora do Brasil? → R: Sim. O campo começa em +55 e permite escolher outro país; o número é
  validado pelo formato daquele país.
- P: O síndico pode editar e remover qualquer pessoa? → R: Sim, em qualquer apartamento (inclusive trocar o celular).
  Convidar familiares continua sendo só do responsável.

## Cenários de uso e testes *(obrigatório)*

### História 1: Entrar com o celular e um código do WhatsApp (Prioridade: P1)

Uma pessoa cadastrada abre o Térreo, digita o número do celular e toca em "Receber código no WhatsApp". O condomínio
envia um código de 6 dígitos para o WhatsApp dela. Ela digita o código e entra direto na parte do app do seu perfil
(morador, portaria ou síndico). Depois disso, basta abrir o app: ele continua conectado.

**Por que esta prioridade**: sem entrar, nenhuma outra parte do app pode ser usada pelos moradores. É também a
primeira proteção dos dados do prédio.

**Teste independente**: entrar com o celular de um morador, de um porteiro e do síndico dos dados de exemplo e
conferir que cada um cai na sua parte do app; fechar e abrir o app e conferir que continua conectado.

**Cenários de aceite**:

1. **Dado** um celular cadastrado, **quando** a pessoa pede o código, **então** um código de 6 dígitos é enviado ao
   WhatsApp desse número e a tela pede o código, mostrando para qual número foi enviado.
2. **Dado** que a pessoa recebeu o código, **quando** digita o código certo dentro do prazo, **então** entra no app
   na parte do seu perfil.
3. **Dado** um celular que não está cadastrado, **quando** a pessoa pede o código, **então** o app informa que o
   número não está cadastrado e que é preciso falar com o síndico, sem enviar código.
4. **Dado** que a pessoa digitou o código errado, **quando** confirma, **então** o app informa que o código não
   confere e deixa tentar de novo; depois de 5 tentativas erradas, o código deixa de valer e é preciso pedir outro.
5. **Dado** que o código foi pedido há mais de 10 minutos, **quando** a pessoa o digita, **então** o app informa que
   expirou e oferece enviar outro.
6. **Dado** que a pessoa não recebeu o código, **quando** passa 1 minuto, **então** pode pedir o reenvio.
7. **Dado** que a pessoa já entrou neste aparelho, **quando** abre o app de novo, **então** entra direto, sem código.
8. **Dado** que a pessoa ficou mais de 6 meses sem abrir o app neste aparelho, **quando** abre, **então** precisa
   entrar de novo com um código.
9. **Dado** que a pessoa está conectada, **quando** toca em "Sair", **então** volta à tela de entrada e, para entrar
   de novo, precisa de um novo código.
10. **Dado** que a pessoa foi removida do apartamento, **quando** abre o app em qualquer aparelho, **então** é
    desconectada e não consegue mais entrar.

---

### História 2: Primeiro acesso — boas-vindas e regras (Prioridade: P2)

Na primeira vez que um morador entra, o app mostra um guia rápido de boas-vindas em poucas telas, com o nome do prédio
e do apartamento, explicando o que cada parte do app faz. Em seguida, mostra as Regras do condomínio, e o morador
confirma que leu. Só então ele chega ao Início. As Regras continuam disponíveis no app a qualquer momento.

**Por que esta prioridade**: a confirmação das regras é exigida para todo morador novo, e o guia diminui as dúvidas
de quem tem menos costume com tecnologia.

**Teste independente**: entrar pela primeira vez com um morador que nunca acessou, passar pelas boas-vindas,
confirmar as regras e conferir que, nas próximas entradas, isso não aparece de novo.

**Cenários de aceite**:

1. **Dado** um morador entrando pela primeira vez, **quando** confirma o código, **então** vê as boas-vindas com o
   nome do prédio, o número do apartamento e o tipo de morador.
2. **Dado** as boas-vindas, **quando** o morador avança, **então** passa por no máximo 4 telas explicando avisos,
   entregas, sugestões, emergência e regras, e pode pular o guia a qualquer momento.
3. **Dado** que o morador terminou ou pulou o guia, **quando** chega às Regras, **então** só consegue seguir para o
   Início depois de tocar em "Li e concordo com as regras".
4. **Dado** que o morador confirmou as regras, **quando** entra de novo (no mesmo ou em outro aparelho), **então** vai
   direto ao Início, e fica registrado quando ele confirmou.
5. **Dado** qualquer morador, **quando** abre "Regras" pelo app, **então** vê as regras agrupadas (convivência,
   garagem, animais, lixo, mudanças e as demais) e pode buscar por uma palavra.
6. **Dado** um porteiro ou o síndico entrando pela primeira vez, **quando** confirma o código, **então** não precisa
   passar pelas boas-vindas do morador nem confirmar as regras.

---

### História 3: O responsável cuida das pessoas do apartamento (Prioridade: P3)

O morador responsável vê, no Perfil, quem mora no apartamento. Ele convida uma nova pessoa informando nome, celular e
tipo (familiar, inquilino ou proprietário); a pessoa recebe o convite pelo WhatsApp e passa a poder entrar com o
próprio celular. O responsável também edita os dados das pessoas e remove quem se mudou. Os outros moradores do
apartamento só veem a lista.

**Por que esta prioridade**: o síndico só cadastra o responsável; sem o convite, o resto da família não entra.

**Teste independente**: entrar como responsável, convidar uma pessoa, entrar com o celular dela, voltar ao
responsável, editar e remover essa pessoa; entrar com um morador que não é responsável e conferir que ele não
consegue convidar, editar nem remover.

**Cenários de aceite**:

1. **Dado** o responsável no Perfil, **quando** abre "Moram no apartamento", **então** vê cada pessoa com nome, tipo,
   permissões,
   a marca "Você" na própria linha, "Responsável" no responsável e "Convite pendente" em quem ainda não entrou.
2. **Dado** o responsável, **quando** convida alguém com nome, celular, tipo e as permissões de cadastrar entregas e
   de votar em enquetes, **então** o convite é enviado ao
   WhatsApp da pessoa e ela aparece na lista como "Convite pendente".
3. **Dado** uma pessoa convidada, **quando** ela entra pela primeira vez com o celular convidado, **então** passa pelas
   boas-vindas e regras e deixa de aparecer como pendente.
4. **Dado** o responsável, **quando** edita o nome, o tipo ou as permissões de uma pessoa do apartamento, **então** a
   mudança aparece na lista e para a própria pessoa.
5. **Dado** o responsável, **quando** remove uma pessoa e confirma, **então** ela sai da lista e perde o acesso ao app.
6. **Dado** o responsável, **quando** tenta convidar um celular que já está cadastrado no condomínio, **então** o app
   informa que esse número já está em uso.
7. **Dado** um morador que não é o responsável, **quando** abre a lista, **então** não vê as opções de convidar,
   editar ou remover.
8. **Dado** o responsável, **quando** tenta remover a si mesmo, **então** o app explica que só o síndico pode trocar
   o responsável do apartamento.

---

### História 4: Perfil, carros, animais e contato de emergência (Prioridade: P4)

Cada morador vê e edita o próprio perfil: nome, foto opcional (para o porteiro reconhecer) e tipo. O responsável
cadastra os carros (placa, modelo e cor) e os animais (nome e tipo) do apartamento e um contato de emergência
opcional, como um parente que mora fora. O app nunca pede CPF nem data de nascimento.

**Por que esta prioridade**: ajuda a portaria a reconhecer moradores e veículos e prepara o botão de emergência, mas
o app já funciona sem esses dados.

**Teste independente**: entrar como responsável, editar o próprio nome e foto, cadastrar um carro, um animal e o
contato de emergência e conferir que aparecem no Perfil; entrar com outro morador do apartamento e conferir que ele
vê esses dados, mas só edita o próprio perfil.

**Cenários de aceite**:

1. **Dado** um morador, **quando** edita o próprio nome ou foto, **então** a mudança aparece no Perfil.
2. **Dado** um morador, **quando** tenta mudar o próprio celular, **então** o app explica que o celular só muda com
   um novo convite do responsável ou com o síndico, porque o celular é o que dá acesso ao app.
3. **Dado** o responsável, **quando** cadastra um carro com placa, modelo e cor, **então** o carro aparece em "Carros e
   animais"; a placa é aceita nos formatos antigo (ABC-1234) e Mercosul (ABC1D23).
4. **Dado** o responsável, **quando** cadastra um animal com nome e tipo, **então** ele aparece em "Carros e animais".
5. **Dado** o responsável, **quando** cadastra o contato de emergência com nome, parentesco e telefone, **então** ele
   aparece no Perfil; se não houver, o Perfil mostra "Opcional · não informado".
6. **Dado** qualquer tela de cadastro, **quando** a pessoa preenche os dados, **então** não existe campo de CPF, data
   de nascimento ou documento.

---

### História 5: O síndico cadastra apartamentos e acompanha os convites (Prioridade: P5)

O síndico vê a lista de apartamentos do prédio, com a situação de cada um: ativo (o responsável já entrou), convite
pendente ou sem cadastro. Ele filtra por todos, sem cadastro e inquilinos, busca por número ou nome, cadastra o
responsável de um apartamento (nome, celular e tipo), reenvia convites e troca o responsável quando alguém se muda.

**Por que esta prioridade**: o cadastro inicial do prédio depende do síndico, mas pode ser feito uma vez e completado
aos poucos.

**Teste independente**: entrar como síndico, filtrar "sem cadastro", cadastrar o responsável de um desses
apartamentos, conferir que ele passa a "Convite pendente", entrar com o celular desse responsável e conferir que o
apartamento passa a "Ativo".

**Cenários de aceite**:

1. **Dado** o síndico em Moradores, **quando** a lista abre, **então** mostra o total de apartamentos e de andares e
   cada apartamento com número, nome do responsável, tipo, quantidade de pessoas e situação.
2. **Dado** a lista, **quando** o síndico escolhe "Sem cadastro" ou "Inquilinos", **então** só esses apartamentos
   aparecem, e o filtro mostra quantos são.
3. **Dado** a lista, **quando** o síndico busca por um número de apartamento ou um nome, **então** aparecem só os
   que combinam.
4. **Dado** um apartamento sem cadastro, **quando** o síndico informa nome, celular e tipo (proprietário ou inquilino)
   do responsável e salva, **então** o convite é enviado ao WhatsApp e o apartamento fica "Convite pendente", com a
   data do envio.
5. **Dado** um convite pendente, **quando** o síndico toca em "Reenviar convite", **então** um novo convite é enviado
   e a data é atualizada.
6. **Dado** um apartamento, **quando** o síndico abre o detalhe, **então** vê as pessoas, carros e animais e pode
   editar ou remover qualquer pessoa, com confirmação; não aparece a opção de convidar familiares.
7. **Dado** um apartamento ativo, **quando** o síndico troca o responsável por outra pessoa do apartamento ou por
   alguém novo, **então** o novo responsável passa a ter as permissões de responsável e o anterior, se sair do
   apartamento, perde o acesso.
8. **Dado** o síndico, **quando** tenta cadastrar um apartamento que já existe ou um celular já usado no condomínio,
   **então** o app informa o problema e não salva.

---

### Casos-limite

- Número digitado com ou sem DDD, parênteses, espaços ou traço: o app aceita e entende como o mesmo celular. Sem DDD,
  o app pede o número completo.
- Número de outro país: a pessoa escolhe o país antes de digitar; o mesmo número com e sem o código do país é tratado
  como o mesmo celular, e um número inválido para o país escolhido é recusado antes de enviar o código.
- Código pedido várias vezes seguidas: só o último vale; no máximo 5 pedidos por hora para o mesmo número, depois o
  app pede para esperar.
- Pessoa com mais de um papel (ex.: o síndico que também mora no 804): depois do código, o app pergunta com qual
  papel entrar e lembra a escolha; a troca fica nos Ajustes. Quem tem um papel só entra direto.
- Responsável removido pelo síndico com pessoas ainda no apartamento: o apartamento fica sem responsável até o
  síndico indicar outro; as outras pessoas continuam entrando.
- Convite não aceito por 30 dias: continua pendente; o síndico e o responsável veem há quanto tempo foi enviado e
  podem reenviar.
- Aparelho sem internet na hora de pedir ou confirmar o código: o app avisa que é preciso internet para entrar; quem
  já está conectado continua usando o app sem internet.
- Pessoa que perdeu o acesso tentando entrar: mesma mensagem de número não cadastrado, sem revelar o motivo.

## Requisitos *(obrigatório)*

### Requisitos funcionais

**Entrada e sessão**

- **RF-001**: O app DEVE permitir entrar só com o número do celular e um código de 6 dígitos enviado ao WhatsApp
  desse número; não existe senha.
- **RF-001a**: Todo campo de celular (entrada, convite, cadastro pelo síndico, contato de emergência) DEVE começar no
  Brasil (+55) e permitir escolher outro país; o número DEVE ser validado pelo formato do país escolhido e guardado
  sempre no formato internacional, para que o mesmo celular nunca seja cadastrado duas vezes.
- **RF-002**: Só pessoas cadastradas no condomínio (moradores, funcionários da portaria e síndico) DEVEM receber
  código; para números não cadastrados o app NÃO DEVE enviar código.
- **RF-003**: O código DEVE valer por 10 minutos, aceitar no máximo 5 tentativas erradas e deixar de valer quando um
  novo for pedido; o reenvio DEVE ficar disponível depois de 1 minuto; no máximo 5 pedidos por hora por número.
- **RF-004**: Depois de entrar, a pessoa DEVE continuar conectada naquele aparelho; um novo código só DEVE ser pedido
  ao entrar em outro aparelho, depois de sair da conta ou depois de 6 meses sem abrir o app naquele aparelho.
- **RF-005**: A pessoa DEVE poder sair da conta pelo Perfil (morador) ou pelos Ajustes (todos os perfis).
- **RF-006**: Remover uma pessoa DEVE encerrar o acesso dela em todos os aparelhos.
- **RF-007**: A parte do app mostrada (morador, portaria, síndico) DEVE vir do cadastro da pessoa que entrou. Uma
  pessoa pode ter mais de um papel no mesmo celular (ex.: moradora e síndica); depois do código, ela escolhe o papel,
  a escolha é lembrada e pode ser trocada nos Ajustes. Cada porteiro entra com o próprio celular. A escolha
  de perfil sem login da spec 001 DEVE continuar só no desenvolvimento e na demonstração, agora como "entrar como"
  uma pessoa dos dados de exemplo.
- **RF-008**: Nesta etapa o envio pelo WhatsApp é simulado: no desenvolvimento e na demonstração, o app DEVE mostrar
  o código enviado em um aviso visível na própria tela; na versão real, o código NUNCA aparece na tela.
- **RF-009**: Mensagens de erro na entrada NÃO DEVEM revelar se o número pertence a alguém removido ou a outro
  condomínio.

**Primeiro acesso**

- **RF-010**: No primeiro acesso de um morador, o app DEVE mostrar as boas-vindas (até 4 telas, com opção de pular) e
  depois as Regras, e só liberar o Início após a confirmação "Li e concordo com as regras".
- **RF-011**: A confirmação das regras DEVE ser registrada com data e hora e valer em todos os aparelhos da pessoa.
- **RF-012**: As Regras DEVEM ficar disponíveis para todos os perfis, agrupadas por tema e com busca por palavra.
- **RF-013**: Porteiros e síndico NÃO DEVEM passar pelas boas-vindas do morador nem pela confirmação das regras.

**Pessoas do apartamento**

- **RF-014**: Cada apartamento DEVE ter no máximo um responsável. Só o responsável DEVE poder convidar pessoas para o
  apartamento; editar e remover as outras pessoas do apartamento é permitido ao responsável e ao síndico. Nenhum outro
  morador pode convidar, editar ou remover.
- **RF-015**: O convite DEVE pedir nome, celular e tipo (familiar, inquilino ou proprietário), as permissões "Pode
  cadastrar entregas" (ligada por padrão) e "Pode votar em enquetes" (desligada por padrão, com a explicação "Só um voto
  por apartamento"), e ser enviado pelo WhatsApp. O responsável pode mudar as permissões depois.
- **RF-015a**: O responsável DEVE ter sempre as duas permissões, e elas não podem ser tiradas dele.
- **RF-016**: Uma pessoa convidada DEVE aparecer como "Convite pendente" até entrar pela primeira vez.
- **RF-017**: Um celular DEVE pertencer a no máximo uma pessoa no condomínio; o app DEVE recusar convite ou cadastro
  com celular já em uso.
- **RF-018**: O responsável NÃO DEVE poder remover a si mesmo; a troca do responsável é feita pelo síndico.
- **RF-019**: Remover uma pessoa DEVE pedir confirmação.

**Perfil e dados do apartamento**

- **RF-020**: Cada pessoa DEVE poder editar o próprio nome e a própria foto (opcional); o tipo só é editado pelo
  responsável (para as pessoas do apartamento) ou pelo síndico (para o responsável).
- **RF-021**: O celular de uma pessoa NÃO DEVE ser editado por ela mesma; a troca é feita pelo responsável (para as
  pessoas do apartamento) ou pelo síndico (para qualquer pessoa) e encerra o acesso no celular antigo.
- **RF-022**: O responsável DEVE poder cadastrar, editar e remover carros (placa, modelo, cor), animais (nome e tipo:
  cachorro, gato, pássaro, outro) e um contato de emergência (nome, parentesco, telefone) do apartamento.
- **RF-023**: Todos os moradores do apartamento DEVEM ver as pessoas, carros, animais e o contato de emergência do seu
  apartamento, e nenhum dado de outros apartamentos.
- **RF-024**: O app NÃO DEVE pedir nem guardar CPF, data de nascimento ou número de documento.
- **RF-025**: A foto DEVE ser reduzida no próprio aparelho antes de ser guardada, para no máximo 512 × 512 px.

**Apartamentos pelo síndico**

- **RF-026**: O síndico DEVE ver todos os apartamentos com número, andar, responsável, tipo, quantidade de pessoas e
  situação: "Ativo", "Convite pendente" (com há quanto tempo) ou "Sem cadastro".
- **RF-027**: A lista DEVE ter os filtros "Todos", "Sem cadastro" e "Inquilinos", com a contagem de cada um, e busca
  por número do apartamento ou nome.
- **RF-028**: O síndico DEVE poder cadastrar o responsável de um apartamento (nome, celular, tipo proprietário ou
  inquilino), reenviar convites e trocar o responsável.
- **RF-028a**: O síndico DEVE ver as pessoas de cada apartamento e poder editar (nome, tipo, celular) e remover
  qualquer uma delas, com confirmação; ele não convida familiares, que é papel do responsável.
- **RF-029**: Só o síndico DEVE acessar a lista de todos os apartamentos com os celulares e demais dados de contato.
- **RF-029a**: A portaria DEVE poder consultar, de qualquer apartamento, só o nome, a foto e o tipo de cada pessoa e os
  carros (placa, modelo e cor), para reconhecer moradores e veículos. Celulares, animais, contato de emergência,
  permissões e situação dos convites NÃO DEVEM aparecer para a portaria.

**Dados e permissões**

- **RF-030**: Todas as regras de permissão desta spec (quem convida, edita, remove, vê) DEVEM ser conferidas pelos
  serviços de dados, e não só escondidas na tela, para valerem igual quando a API existir.
- **RF-031**: Os dados de exemplo DEVEM incluir, para cada perfil, pessoas fictícias prontas para entrar (síndico,
  porteiros, responsáveis e familiares), um apartamento com convite pendente e apartamentos sem cadastro.
- **RF-032**: Todos os textos novos DEVEM existir em português, inglês e espanhol.

### Entidades principais

- **Pessoa (morador)**: já existe na spec 001; ganha situação (convite pendente ou ativa), data do convite, data do
  primeiro acesso, data da confirmação das regras e foto.
- **Papel**: o que uma pessoa é no condomínio — morador de um apartamento, porteiro ou síndico. Uma pessoa (um
  celular) pode ter mais de um papel; cada porteiro e o síndico entram com o próprio celular.
- **Permissões do morador**: pode cadastrar entregas e pode votar em enquetes; o responsável tem as duas sempre.
- **Pedido de código**: celular, código, quando foi pedido, quando expira, tentativas erradas e se já foi usado.
- **Sessão**: pessoa, aparelho, quando começou, último uso; encerrada ao sair, ao ser removido ou após 6 meses sem uso.
- **Convite**: pessoa convidada, quem convidou, quando foi enviado e reenviado.
- **Carro**: apartamento, placa, modelo, cor.
- **Animal**: apartamento, nome, tipo.
- **Contato de emergência**: apartamento, nome, parentesco, telefone.
- **Regra**: tema, título, texto e ordem.
- **Mensagem enviada (simulada)**: para quem, tipo (código, convite) e quando — para conferir no desenvolvimento.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **CS-001**: Uma pessoa cadastrada entra no app, do número digitado até a tela inicial, em menos de 1 minuto (sem
  contar a espera pela mensagem).
- **CS-002**: Depois da primeira entrada, 100% das aberturas seguintes no mesmo aparelho (dentro de 6 meses) vão
  direto ao app, sem código.
- **CS-003**: Um morador novo termina as boas-vindas e a confirmação das regras em menos de 2 minutos.
- **CS-004**: O responsável convida uma pessoa em menos de 1 minuto.
- **CS-005**: O síndico cadastra o responsável de um apartamento em menos de 1 minuto e encontra qualquer apartamento
  pela busca em menos de 10 segundos.
- **CS-006**: Nenhuma tela de cadastro tem campo de CPF, data de nascimento ou documento (100% das telas conferidas).
- **CS-007a**: 100% das consultas da portaria devolvem só nome, foto, tipo e carros, conferido por teste automático.
- **CS-007**: 100% das tentativas de convidar, editar ou remover feitas por quem não é responsável são recusadas
  pelos serviços, conferido por teste automático.
- **CS-008**: Uma pessoa removida perde o acesso em todos os aparelhos na próxima vez que o app conferir a sessão.
- **CS-009**: Uma pessoa com dois papéis troca de papel em no máximo 3 toques, sem precisar de novo código.

## Premissas

- Front-end primeiro: tudo nesta spec funciona com os dados guardados no aparelho, por trás dos serviços da spec 001.
  A troca pela API, o envio real pelo WhatsApp e a sessão em cookie protegido (constituição) vêm na Etapa 3.
- Nesta etapa, "outro aparelho" é simulado por outro navegador ou por limpar os dados do navegador.
- O envio simulado guarda as mensagens no próprio aparelho e mostra o código na tela só no desenvolvimento e na
  demonstração.
- O texto das Regras e das boas-vindas usa um conteúdo de exemplo baseado no minimundo (silêncio, elevador, lixo,
  animais, garagem, mudanças); o texto real será fornecido pelo síndico. A edição das regras pelo síndico fica para o
  grupo Administração da Etapa 2.
- O cadastro de funcionários e da escala pelo síndico fica para o grupo Portaria; os porteiros já existem nos dados de
  exemplo e ganham celulares fictícios. Nos dados de exemplo, o síndico também mora em um apartamento, para testar a
  troca de papel.
- Como as enquetes ainda não existem, a permissão de votar só é guardada nesta spec; ela passa a valer na spec de
  Comunicação. O mesmo vale para "cadastrar entregas" e a spec de Portaria.
- Os vídeos curtos de ajuda, mencionados no minimundo, ficam fora desta spec.
- Os botões de WhatsApp seguem a identidade do Térreo (azul `#1B4FD8` com branco e o ícone do WhatsApp), e não o verde
  dos mockups.
- O número de 6 meses é contado desde a última abertura do app no aparelho.
