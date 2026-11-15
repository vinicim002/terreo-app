# Especificação: Base do app

**Branch**: `main` (sem branch própria da funcionalidade)

**Criada em**: 2026-11-15

**Status**: Rascunho

**Entrada**: Etapa 1 do `docs/backlog.md`. Base do app Térreo: projeto com interface e API no mesmo repositório e
ambiente local; app instalável no celular com os ícones do kit da marca; tema claro, escuro e alto contraste; textos em
português, inglês e espanhol desde o início; navegação separada por perfil (morador, portaria, síndico) com telas ainda
vazias; camada de serviços tipados com dados locais, que depois será trocada pela API sem mudar as telas; dados de
exemplo do Edifício Taquaretinga; painel de desenvolvimento (fora da versão publicada) com andamento das etapas,
backlog, histórico de alterações, commits e documentos de `docs/` e `specs/`, nos moldes do painel do OnPath.

**Referências**: `docs/backlog.md` (Etapa 1), `docs/documentacao/` (capítulos 1 a 4),
`.specify/memory/constitution.md` (1.2.0), mockups em `arquivos-gerais-terreo/terreo_telas/` (material local).

## Esclarecimentos

### Sessão 2026-11-15

- P: Enquanto não existe login, como o síndico e outras pessoas vão ver as telas? → R: Por uma versão de demonstração
  publicada, com a escolha de perfil e só dados fictícios. A versão real, com moradores, nunca terá a escolha de perfil.
- P: Como o alto contraste funciona junto com claro e escuro? → R: É um interruptor separado, que vale tanto para o
  tema claro quanto para o escuro (como no mockup de acessibilidade).
- P: Quantos apartamentos e andares tem o Taquaretinga? → R: Provisoriamente 48 apartamentos em 12 andares (4 por
  andar, numerados 101 a 1204), até a confirmação com o síndico.
- P: O que deve abrir sem internet depois da primeira abertura? → R: Todas as telas e a navegação, com os dados já
  guardados no aparelho e um aviso de sem conexão.

## Cenários de uso e testes *(obrigatório)*

### História 1: Navegar pelo app como cada perfil (Prioridade: P1)

Uma pessoa abre o Térreo no navegador do celular, escolhe com qual perfil quer ver o app (morador, portaria ou
síndico) e encontra a navegação daquele perfil: uma barra fixa na parte de baixo com as seções principais e um
cabeçalho com o nome da tela, o atalho de acessibilidade e o sino de notificações. Cada seção abre uma tela ainda sem
conteúdo, com o título certo e uma mensagem de que a tela será construída nas próximas etapas.

| Perfil | Seções da barra de baixo (conforme os mockups) |
|---|---|
| Morador | Início, Entregas, Sugestões, Perfil |
| Portaria | Portaria, Entregas, Visitantes, Mais |
| Síndico | Painel, Avisos, Moradores, Mais |

No perfil morador, a tela Início leva também a "Todos os serviços", que lista as demais funcionalidades do morador
agrupadas como nos mockups (Comunicação, Portaria, Prédio, Úteis). Na portaria e no síndico, "Mais" lista as demais
funcionalidades daquele perfil. Cada item leva a uma tela vazia com o nome da funcionalidade.

**Por que esta prioridade**: é a base sobre a qual todas as telas seguintes serão construídas. Sem ela, nenhuma outra
etapa pode ser vista nem validada com o síndico.

**Teste independente**: abrir o app, escolher cada perfil, tocar em cada item da barra de baixo e de "Mais"/"Todos os
serviços" e conferir que a tela certa abre, com o título certo, e que a barra de baixo continua visível.

**Cenários de aceite**:

1. **Dado** que a pessoa abre o app pela primeira vez, **quando** a primeira tela carrega, **então** ela vê a escolha de
   perfil (morador, portaria, síndico).
2. **Dado** que a pessoa escolheu um perfil, **quando** a tela inicial daquele perfil abre, **então** a barra de baixo
   mostra as quatro seções da tabela acima, com a primeira marcada.
3. **Dado** que a pessoa está em qualquer tela de um perfil, **quando** toca em outra seção, **então** a tela muda sem
   recarregar a página e a seção tocada aparece marcada.
4. **Dado** que a pessoa digita no navegador o endereço de uma tela de um perfil, **quando** a página carrega, **então**
   essa tela abre diretamente.
5. **Dado** que a pessoa está no perfil morador, **quando** tenta abrir pelo endereço uma tela da portaria ou do
   síndico, **então** o app informa que a tela não pertence ao perfil escolhido e oferece voltar ao início do perfil.
6. **Dado** que a pessoa digita um endereço que não existe, **quando** a página carrega, **então** o app informa que a
   página não existe e oferece voltar ao início.
7. **Dado** que a pessoa escolheu um perfil, **quando** fecha e abre o app de novo, **então** o app volta para o mesmo
   perfil; e ela pode trocar de perfil a qualquer momento pela tela de perfil ou "Mais".

---

### História 2: Ler o app no próprio idioma e com conforto visual (Prioridade: P2)

A pessoa escolhe o idioma (português, inglês ou espanhol) e o tema (claro, escuro ou seguir o celular), pode ligar o
alto contraste (que vale para o tema claro e para o escuro) e pode aumentar o tamanho das letras. Todos os textos das telas, da navegação e das mensagens mudam na hora, e
a escolha é lembrada.

**Por que esta prioridade**: idiomas e acessibilidade são requisitos desde o início (constituição, princípios I e
IV). Se a base não os suportar, todas as telas seguintes teriam de ser refeitas.

**Teste independente**: trocar o idioma e conferir que nenhum texto fica no idioma anterior; trocar o tema e o tamanho
da letra e conferir que todas as telas mudam; fechar e abrir o app e conferir que as escolhas foram mantidas.

**Cenários de aceite**:

1. **Dado** um celular configurado em inglês ou espanhol, **quando** o app abre pela primeira vez, **então** os textos
   aparecem nesse idioma; em qualquer outro idioma do celular, aparecem em português.
2. **Dado** que a pessoa escolhe outro idioma, **quando** confirma, **então** todos os textos visíveis (títulos,
   navegação, botões, mensagens de erro e de tela vazia) mudam para o idioma escolhido sem recarregar a página.
3. **Dado** que a pessoa escolhe o tema escuro ou liga o alto contraste, **quando** navega por qualquer tela, **então**
   todas usam a aparência escolhida, sem nenhuma parte com as cores anteriores; as quatro combinações (claro, escuro,
   claro com alto contraste, escuro com alto contraste) funcionam.
4. **Dado** que o tema está em "seguir o celular", **quando** o celular muda entre claro e escuro, **então** o app
   acompanha a mudança.
5. **Dado** que a pessoa aumentou o tamanho das letras, **quando** navega por qualquer tela, **então** os textos ficam
   maiores sem cortar conteúdo nem exigir rolagem para os lados.
6. **Dado** que a pessoa fez escolhas de idioma, tema e tamanho de letra, **quando** abre o app de novo, **então** as
   escolhas são mantidas e a tela não pisca com o tema anterior ao carregar.

---

### História 3: Instalar o app na tela inicial do celular (Prioridade: P3)

A pessoa abre o link do Térreo no celular e adiciona o app à tela inicial. O ícone, o nome e a cor da marca aparecem
como em um app comum, e ao abrir pelo ícone o app ocupa a tela inteira, sem a barra do navegador.

**Por que esta prioridade**: o requisito "sem baixar nada da loja" depende disso, mas o app já pode ser navegado e
validado pelo navegador antes de ser instalável.

**Teste independente**: abrir o app em um celular Android e em um iPhone, adicionar à tela inicial e conferir o ícone,
o nome e a abertura em tela cheia.

**Cenários de aceite**:

1. **Dado** um celular Android com o app aberto no navegador, **quando** a pessoa escolhe instalar, **então** o ícone
   da marca e o nome "Térreo" aparecem na tela inicial.
2. **Dado** um iPhone com o app aberto no navegador, **quando** a pessoa usa "Adicionar à Tela de Início", **então** o
   ícone da marca aparece, sem bordas brancas ou ícone genérico.
3. **Dado** que o app foi instalado, **quando** a pessoa o abre pelo ícone, **então** ele abre em tela cheia, com a
   cor da marca na barra de status e na tela de abertura.
4. **Dado** que o app foi aberto ao menos uma vez, **quando** a pessoa o abre sem conexão, **então** a navegação e
   todas as telas de todos os perfis abrem, inclusive as nunca visitadas, com um aviso discreto de que está sem
   internet.
5. **Dado** que uma nova versão do app foi publicada, **quando** a pessoa abre o app com internet, **então** a nova
   versão é baixada e passa a valer na próxima abertura, sem a pessoa precisar reinstalar.

---

### História 4: Ver o app com dados de exemplo do prédio (Prioridade: P4)

Ao abrir o app no ambiente de desenvolvimento, já existem dados de exemplo do Edifício Taquaretinga: o condomínio, os
apartamentos, moradores fictícios, os funcionários e a escala de turnos. Esses dados alimentam as telas das próximas
etapas e ficam guardados no próprio aparelho, por trás de serviços com formato definido. Quando a API existir, os
mesmos serviços passarão a buscar os dados nela, sem mudar nenhuma tela.

**Por que esta prioridade**: permite construir e mostrar as telas ao síndico antes da API (ordem "front-end primeiro"
da constituição). Nesta etapa só a base é criada; as telas que usam os dados vêm na Etapa 2.

**Teste independente**: abrir o app em um navegador sem dados, conferir pela ferramenta de dados do painel de
desenvolvimento que os dados de exemplo existem, recarregar e conferir que nada foi duplicado; apagar os dados e
conferir que são recriados.

**Cenários de aceite**:

1. **Dado** um navegador sem dados do Térreo, **quando** o app abre, **então** existem o Edifício Taquaretinga, seus
   apartamentos, moradores fictícios distribuídos entre eles, os cinco funcionários (três porteiros e dois faxineiros) e
   a escala de turnos dos porteiros.
2. **Dado** que os dados de exemplo já existem, **quando** o app é aberto de novo ou a página é recarregada, **então** a
   quantidade de registros não muda.
3. **Dado** que a pessoa pede para restaurar os dados de exemplo no painel de desenvolvimento, **quando** confirma,
   **então** os dados locais são apagados e recriados como no primeiro uso.
4. **Dado** um serviço de dados, **quando** uma tela pede dados de outro condomínio, **então** nenhum dado do
   Taquaretinga é devolvido.

---

### História 5: Acompanhar o projeto pelo painel de desenvolvimento (Prioridade: P5)

Durante o desenvolvimento, o desenvolvedor abre o painel do projeto e vê, em um só lugar: o que é o Térreo, o andamento
de cada etapa do backlog, o backlog completo, o histórico de alterações, os commits recentes e todos os documentos de
`docs/` e `specs/`, formatados para leitura. O painel não existe na versão de demonstração nem na versão real.

**Por que esta prioridade**: ajuda a manutenção e a apresentação do projeto, mas não é usado pelos moradores.

**Teste independente**: abrir o painel no ambiente de desenvolvimento, conferir cada seção contra os arquivos do
repositório e o histórico do git; gerar a versão de demonstração e conferir que o endereço do painel não existe nela.

**Cenários de aceite**:

1. **Dado** o ambiente de desenvolvimento, **quando** o desenvolvedor abre o painel, **então** vê as seções Visão
   geral, Andamento, Backlog, Histórico, Commits e Documentos.
2. **Dado** o painel aberto, **quando** o desenvolvedor abre "Andamento", **então** vê cada etapa do backlog com a
   quantidade de itens feitos e o total, e o percentual concluído.
3. **Dado** o painel aberto, **quando** o desenvolvedor abre "Documentos", **então** vê a lista de documentos de
   `docs/` e de cada spec em `specs/`, e ao escolher um, o lê formatado (títulos, tabelas, listas).
4. **Dado** que um documento ou o backlog foi alterado no repositório, **quando** o desenvolvedor recarrega o painel,
   **então** vê o conteúdo novo, sem precisar copiar nada para o app.
5. **Dado** o painel aberto, **quando** o desenvolvedor abre "Commits", **então** vê os commits mais recentes com
   código, data, autor e mensagem.
6. **Dado** a versão de demonstração ou a versão real, **quando** alguém acessa o endereço do painel, **então** recebe a página de
   "não existe".

---

### Casos-limite

- Navegador sem suporte a instalação: o app continua funcionando no navegador, sem oferecer a instalação.
- Armazenamento do navegador bloqueado ou cheio (modo anônimo, por exemplo): o app abre com os dados de exemplo apenas
  em memória e avisa que as preferências não serão lembradas.
- Texto traduzido mais longo que o original (comum em espanhol): a navegação e os botões não cortam nem sobrepõem o
  texto.
- Tamanho de letra no máximo em tela pequena: a barra de baixo continua usável e legível.
- Falta de tradução de um texto em inglês ou espanhol: aparece o texto em português, nunca a chave interna do texto.
- Repositório sem histórico do git: a seção Commits do painel informa que não há commits, sem quebrar o painel.
- Documento em `docs/` ou `specs/` com formatação inválida: o painel mostra o texto bruto em vez de falhar.
- Sem internet, o tradutor de Libras (serviço externo) não funciona: o botão fica oculto e o menu de acessibilidade
  informa que a tradução para Libras está indisponível sem internet; ao voltar a conexão, ele reaparece.

## Requisitos *(obrigatório)*

### Requisitos funcionais

**Projeto e ambiente**

- **RF-001**: O repositório DEVE conter a interface e a API como partes separadas, e o ambiente local completo (as duas
  partes e os serviços de que dependem) DEVE subir com um único comando documentado.
- **RF-002**: A API DEVE responder a uma verificação de funcionamento, e a interface DEVE mostrar no painel de
  desenvolvimento se a API está no ar. Nenhuma tela de perfil depende da API nesta etapa.
- **RF-003**: Nenhum segredo ou configuração sensível DEVE estar no repositório; o repositório DEVE trazer apenas um
  exemplo das variáveis de ambiente, sem valores reais.

**Navegação por perfil**

- **RF-004**: O app DEVE oferecer uma escolha de perfil (morador, portaria, síndico) sem login apenas no ambiente de
  desenvolvimento e na versão de demonstração. A versão real (com moradores) NÃO DEVE ter essa escolha; nela o perfil
  virá do login da Etapa 2.
- **RF-004a**: A versão de demonstração DEVE ser publicável em um endereço próprio, usar só os dados fictícios de
  exemplo guardados no aparelho, mostrar em todas as telas uma marca discreta de "Demonstração" e não se conectar a
  nenhum dado real.
- **RF-005**: Cada perfil DEVE ter sua própria barra de navegação de baixo, com as seções da História 1, e seu próprio
  conjunto de endereços.
- **RF-006**: Cada tela DEVE ter cabeçalho com título, atalho de acessibilidade e sino de notificações (ainda sem
  notificações), e telas internas DEVEM ter o botão de voltar.
- **RF-007**: Todas as funcionalidades do capítulo "Funcionalidades" da documentação DEVEM ter uma tela vazia
  alcançável a partir do perfil que a usa, com o título e a mensagem de "em construção".
- **RF-008**: Abrir pelo endereço uma tela de outro perfil DEVE mostrar a mensagem de tela não permitida; endereço
  inexistente DEVE mostrar a página de "não existe".
- **RF-009**: O app DEVE lembrar o último perfil escolhido e permitir trocar de perfil.
- **RF-010**: A interface DEVE ser feita para celular (largura a partir de 320 px), com áreas de toque de no mínimo
  44 × 44 px; na portaria, botões de ação maiores, com ícone e pouco texto.

**Idiomas**

- **RF-011**: Nenhum texto mostrado à pessoa DEVE estar escrito diretamente nas telas; todos DEVEM vir de arquivos de
  tradução, com versões completas em português, inglês e espanhol.
- **RF-012**: O idioma inicial DEVE seguir o idioma do celular (inglês ou espanhol, se for o caso; português nos
  demais), e a pessoa DEVE poder trocá-lo; a escolha DEVE ser lembrada.
- **RF-013**: Datas e horários DEVEM ser mostrados no fuso de Brasília e no formato do idioma escolhido.
- **RF-014**: Uma verificação automática DEVE falhar se algum texto existir em um idioma e faltar em outro.

**Tema e acessibilidade**

- **RF-015**: O app DEVE ter os temas claro e escuro, além de "seguir o celular", e um interruptor de alto contraste
  independente que se combina com qualquer tema (quatro aparências no total); todas as cores DEVEM vir do tema, nunca
  escritas diretamente nos componentes.
- **RF-016**: A pessoa DEVE poder aumentar o tamanho das letras em pelo menos três níveis acima do padrão.
- **RF-017**: Tema e tamanho de letra DEVEM ser aplicados antes da primeira exibição da tela, sem piscar.
- **RF-018**: Os temas claro e escuro DEVEM ter contraste mínimo AA para textos; com o alto contraste ligado, AAA.
- **RF-019**: O app DEVE carregar o tradutor de Libras (VLibras), disponível em todas as telas quando houver
  internet; sem internet, o botão fica oculto com aviso no menu de acessibilidade.
- **RF-020**: Todos os elementos interativos DEVEM ter nome acessível para leitores de tela e ser alcançáveis por
  teclado.

**App instalável**

- **RF-021**: O app DEVE ser instalável na tela inicial, com nome "Térreo", os ícones do kit da marca (incluindo a
  versão com margem de segurança para Android e o ícone para iPhone) e a cor `#1B4FD8`.
- **RF-022**: Instalado, o app DEVE abrir em tela cheia, sem a barra do navegador.
- **RF-023**: Depois da primeira abertura, a navegação e todas as telas DEVEM abrir sem conexão, com os dados já
  guardados no aparelho e um aviso de que está sem internet; ao voltar a conexão, o aviso some.
- **RF-023a**: Uma nova versão publicada DEVE ser baixada automaticamente e passar a valer na abertura seguinte.

**Dados locais**

- **RF-024**: As telas NÃO DEVEM acessar o armazenamento diretamente; DEVEM usar serviços com formatos de dados
  definidos, um por área (condomínio, apartamentos, moradores, funcionários, escala).
- **RF-025**: Cada serviço DEVE ter a mesma forma de uso que terá ao chamar a API (operações assíncronas, mesmos
  formatos de entrada e saída e os mesmos erros), para que a troca não mude nenhuma tela.
- **RF-026**: Todo dado DEVE pertencer a um condomínio, e toda consulta dos serviços DEVE filtrar pelo condomínio
  atual.
- **RF-027**: No primeiro uso, os dados de exemplo do Edifício Taquaretinga DEVEM ser criados uma única vez; o painel
  de desenvolvimento DEVE permitir restaurá-los.
- **RF-028**: Os dados de exemplo DEVEM ser fictícios: nenhum nome, telefone ou placa real de morador ou funcionário.
- **RF-028a**: Os dados de exemplo DEVEM ter 48 apartamentos em 12 andares (4 por andar, numerados 101 a 1204), com
  alguns apartamentos sem responsável cadastrado, e DEVEM ficar definidos em um único lugar, para que os números reais
  possam substituí-los sem mudar telas ou serviços.

**Painel de desenvolvimento**

- **RF-029**: O painel DEVE existir apenas no ambiente de desenvolvimento e NÃO DEVE fazer parte da versão de
  demonstração nem da versão real.
- **RF-030**: O painel DEVE ter as seções Visão geral (README), Andamento (por etapa do backlog), Backlog, Histórico
  (changelog), Commits (últimos 50, com código, data, autor e mensagem) e Documentos (`docs/` e `specs/`).
- **RF-031**: O painel DEVE ler os documentos direto dos arquivos do repositório e os commits direto do histórico do
  git, sem cópia manual.
- **RF-032**: O painel DEVE mostrar a situação da API (no ar ou fora) e oferecer a restauração dos dados de exemplo.
- **RF-033**: O painel PODE ficar só em português, por ser de uso interno.

### Entidades principais

- **Condomínio**: o prédio atendido. Nome, endereço resumido, número de andares e apartamentos. Todos os outros dados
  pertencem a um condomínio.
- **Apartamento**: unidade do condomínio. Número, andar e o morador responsável.
- **Morador**: pessoa que mora em um apartamento. Nome, celular, foto opcional, tipo (proprietário, inquilino ou
  familiar) e se é o responsável.
- **Funcionário**: porteiro ou faxineiro. Nome, função e foto opcional.
- **Turno da escala**: período de trabalho de um funcionário (dia da semana, horário de início e fim), usado para saber
  quem está de plantão.
- **Preferências do aparelho**: perfil escolhido, idioma, tema (claro, escuro ou seguir o celular), alto contraste
  (ligado ou desligado) e tamanho de letra, guardados só no aparelho.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **CS-001**: Uma pessoa sem treinamento chega a qualquer tela vazia de qualquer perfil em no máximo 3 toques a
  partir da tela inicial do perfil.
- **CS-002**: 100% dos textos das telas existem nos três idiomas, conferido pela verificação automática.
- **CS-003**: Ao trocar idioma, tema ou tamanho de letra, a mudança aparece em menos de 1 segundo, sem recarregar.
- **CS-004**: O app é instalado e aberto em tela cheia com o ícone correto em um Android e um iPhone reais.
- **CS-005**: A primeira tela aparece em até 3 segundos em um celular intermediário com internet 4G, e em até
  1 segundo nas aberturas seguintes.
- **CS-006**: Uma auditoria automática de acessibilidade não aponta erros graves em nenhuma tela, nas quatro
  aparências (claro, escuro e cada um com alto contraste).
- **CS-007**: Um desenvolvedor novo sobe o ambiente local completo seguindo apenas o README em até 15 minutos.
- **CS-008**: O endereço do painel de desenvolvimento responde "não existe" em 100% das verificações da versão de
  demonstração e da versão real.
- **CS-009**: O síndico abre a versão de demonstração no próprio celular, pelo link, e navega pelos três perfis sem
  ajuda.

## Premissas

- Ainda não há login: a escolha de perfil serve para navegar e validar as telas, no ambiente local e na versão de
  demonstração. O login pelo WhatsApp vem na Etapa 2. A hospedagem da demonstração é definida no `plan.md`.
- A organização do repositório, as tecnologias e os serviços seguem a constituição 1.2.0 (princípio VI) e o capítulo
  "Arquitetura e estrutura"; o `plan.md` detalha.
- A navegação segue os mockups de `arquivos-gerais-terreo/terreo_telas/`, trocando "Condô" por "Térreo" e "Edifício
  Aurora" por "Edifício Taquaretinga".
- O número real de apartamentos e andares do Taquaretinga ainda não é conhecido; os 48 apartamentos em 12 andares são
  provisórios e serão confirmados com o síndico.
- A escala de exemplo usa os turnos fixos do minimundo (6h–14h, 14h–22h, 22h–6h) com um rodízio de folgas simples;
  as regras reais do rodízio e o horário dos faxineiros ainda serão confirmados com o síndico.
- As traduções para inglês e espanhol desta etapa são feitas pela equipe e poderão ser revisadas por falantes nativos
  depois.
- Leitura em voz alta, legendas e as demais opções do menu de acessibilidade entram com as telas que as usam (Etapa
  2); nesta etapa entram tema, tamanho de letra e Libras.
- O painel de desenvolvimento só é usado no computador do desenvolvedor; não precisa de login.
