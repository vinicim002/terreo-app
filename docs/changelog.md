# Histórico de alterações

Registro diário do que foi adicionado, alterado e removido no projeto. A entrada mais recente fica no topo.

## 2026-11-17

### Adicionado

- Especificação completa da spec 003 pelo Spec Kit (`specs/003-comunicacao/`): spec com 3 esclarecimentos (voto
  oficial só do responsável, com sugestões da casa; assuntos gerais só no grupo do WhatsApp; aviso publicado pode ser
  editado e volta a não lido), plano, pesquisa, modelo de dados, contratos, 55 tarefas e análise com 11 achados
  corrigidos antes do código.
- Comunicação (spec 003), com dados no aparelho:
  - Avisos: o síndico publica na hora ou agenda (tipo, título, mensagem, importante, confirmação de leitura, data do
    assunto com lembrete na véspera, envio ao grupo); moradores e portaria leem, com "Todos" e "Não lidos (N)";
    "Confirmar leitura"; o síndico vê "Lido por N de M apartamentos", quem confirmou e quem falta; editar, marcar como
    resolvido com nota e apagar.
  - Enquetes: de 2 a 6 opções, encerramento, resultado parcial opcional, voto com um toque e "Mudar voto"; nas oficiais,
    só o responsável vota e as outras pessoas com permissão sugerem; encerradas mostram a vencedora ou o empate.
  - Agenda do prédio: calendário do mês com marcas, eventos do dia e "Próximos"; reuniões, manutenções e rotinas que se
    repetem (toda semana, todo mês, semestral, todo ano) e avisos com data.
  - Reuniões do conselho: data, horário, local e pauta; aviso na hora e na véspera; resumo do que foi decidido depois.
  - Notificações: sino com o número de não lidas em todas as telas, central em Hoje/Ontem/Antes com "Ler todas" e
    "Como receber" por tipo; emergências sempre ativas.
  - WhatsApp simulado no painel `/dev`: uma mensagem no grupo para assuntos gerais, privado só para assuntos pessoais.
  - Início do morador com avisos não lidos e a próxima reunião; atalhos do síndico (novo aviso, enquete, reunião).
  - Dados de exemplo v3 com avisos, enquetes, reuniões, eventos e notificações relativos ao dia em que são criados.
  - Testes: 433 unitários (com relógio controlado para agendamentos, véspera e encerramento) e 273 de ponta a ponta no
    desenvolvimento, incluindo acessibilidade das telas novas nas quatro aparências; builds de demonstração e real e
    Lighthouse conferidos.

- Especificação completa da spec 004 pelo Spec Kit (`specs/004-portaria/`): spec com 3 esclarecimentos (quem é avisado
  de cada entrega; lembrete no 3º dia e depois diário; qualquer pessoa do apartamento avisa visitante), plano, pesquisa,
  modelo de dados, contratos, 66 tarefas e análise com 10 achados corrigidos antes do código.
- Portaria (spec 004), com dados no aparelho:
  - Códigos de entrega pelo app (loja, código, observação e o que fazer na chegada) ou por mensagem ao WhatsApp do
    condomínio ("iFood 4821"), simulada no painel `/dev`; aviso de código repetido no mesmo dia.
  - Início da portaria com busca, 5 botões grandes e os números do dia; grade de apartamentos com marcas; painel do
    apartamento com os códigos em letras grandes, "Chegou", "Ligar para o morador" e "Subir pelo elevador".
  - Receber encomenda sem código com foto de comprovante (reduzida no celular); correspondência com um toque; retirada
    pelo app ("Retirei") ou registrada pela portaria; lembrete de encomenda parada no 3º dia e depois diário.
  - Avisos só no app e no privado, nunca no grupo: entrega com código avisa quem cadastrou e o responsável; sem código e
    correspondência, todos do apartamento.
  - Visitantes e prestadores avisados por qualquer pessoa do apartamento; a portaria vê os esperados do dia, toca
    "Chegou", é lembrada de interfonar para prestador e registra visitante sem cadastro. Sem documento de visitante.
  - Modo viagem (a portaria vê "Em viagem até" e não há lembretes) e equipe de plantão automática pela escala,
    inclusive a virada da meia-noite.
  - Ditar com o microfone do celular nos campos da portaria; "Ditar recado" ao síndico, que pode transformá-lo em aviso.
  - Achados e perdidos com foto, "É meu", "Devolvido", objeto perdido avisado pelo morador e "Encontrei".
  - Início do morador mostra encomendas na portaria e a visita esperada do dia.
  - Testes: 636 unitários (incluindo 24 mensagens de exemplo do WhatsApp e lembretes com relógio controlado) e 350 de
    ponta a ponta no desenvolvimento, com acessibilidade das telas novas nas quatro aparências e letra máxima em 320 px;
    builds de demonstração e real e Lighthouse conferidos.

### Alterado

- Portaria ganha "Avisos" e "Agenda do prédio" no "Mais".
- O início da portaria deixa de ser "em construção"; o síndico ganha "Recados da portaria", "Equipe de plantão" e
  "Achados e perdidos" (só leitura).
- Banco do aparelho na versão 4 e dados de exemplo v4 (entregas, visitantes, viagem, recado, achados).
- Fotos reduzidas no aparelho com tamanho configurável (perfil 512 px; comprovantes 1024 px).
- Publicação (capítulo `05-publicacao.md`): `infra/compose.prod.yaml` (projeto `terreo-prod` separado na VPS
  compartilhada, sem portas publicadas, com limites de memória), `infra/deploy.sh`, `infra/backup.sh` e
  `infra/prod.env.example`; Cloudflare Tunnel próprio para a API (`terreo-api.v2n.tech`); demonstração no
  Cloudflare Workers com arquivos estáticos (`terreo.v2n.tech`, `web/wrangler.jsonc`), com o Worker que repassa
  `/api/*` para a API e cabeçalhos de segurança. API no ar em `terreo-api.v2n.tech`.
- Ajustes depois da revisão das telas:
  - Calendário do Térreo no lugar do seletor de data do navegador, em todos os formulários (avisos, enquetes,
    reuniões, eventos, visitantes e modo viagem), com mês, dias em botões grandes, "Hoje" e "Limpar".
  - Aviso de "Outro" tipo, com nome livre (ex.: "Obras").
  - Portaria com "Perfil" na barra de baixo (nome, foto, celular, editar e sair).
  - Início da portaria com 6 botões do mesmo tamanho (novo: "Em viagem"), sem cortar palavras no meio.
  - "Quem retirou?" em botões grandes no lugar da lista do navegador.
  - País do celular escolhido num painel do app, com busca e bandeiras.
  - Bandeiras também na troca de idioma (🇧🇷 🇺🇸 🇪🇸). No Windows, que não desenha bandeiras com emoji, o app carrega
    uma fonte só de bandeiras (Twemoji, CC BY 4.0, crédito nos Ajustes e no README), guardada no próprio app.
  - Sem barras de rolagem aparentes em todo o app (a rolagem continua com o dedo, a roda e o teclado).
  - Telas de entrada (login, código, escolha de papel) com o topo laranja e o sabiá branco, e o formulário num cartão
    de cantos arredondados; contas de demonstração mostram uma conta por vez, com seletor das outras.
  - Abertura (preloader) com o sabiá branco enquanto o app carrega, no lugar da tela em branco.
  - Dicas do primeiro acesso no estilo "ilustração em cima, cartão embaixo", com os pontinhos de página.
  - O mascote colorido saiu do app (licença ainda a confirmar); fica só o sabiá branco, em PNG leve (12 KB).

### Corrigido

- Na versão compilada (demonstração publicada), as listas apareciam vazias: o cache de dados era limpo no instante em
  que as telas começavam a buscar os dados. Agora as consultas são reiniciadas, sem misturar dados entre contas; novo
  teste de build confere telas com dados.
- O familiar de exemplo do 804 pode votar em enquetes (para sugerir nas oficiais).
- Banco do aparelho na versão 3 (os dados de exemplo são recriados).
- O atalho de testes troca de conta sem esperar o intervalo entre códigos (só em desenvolvimento e demonstração).

## 2026-11-16

### Adicionado

- Especificação completa da spec 002 pelo Spec Kit (`specs/002-acesso-e-cadastro/`): spec com 6 esclarecimentos
  (portaria com celular próprio, permissões no convite, mais de um papel por pessoa, o que a portaria vê, celular de
  outro país, poderes do síndico), plano, pesquisa, modelo de dados, contratos (serviços, matriz de permissões e
  rotas), 67 tarefas e análise de consistência com 10 achados corrigidos antes do código.
- Acesso e cadastro (spec 002), com dados no aparelho:
  - Entrada com celular e código de 6 dígitos "enviado" pelo WhatsApp (simulado, com o código visível no
    desenvolvimento e na demonstração), com as regras reais: 10 minutos, 5 tentativas, reenvio após 1 minuto e até 5
    pedidos por hora; continua conectado; "Sair"; sessão encerrada ao remover a pessoa ou trocar o celular.
  - Celular de qualquer país, começando pelo Brasil (+55).
  - Pessoas com mais de um papel (a síndica que mora no 1201) escolhem com qual entrar e trocam nos Ajustes.
  - Primeiro acesso do morador: boas-vindas em 3 passos e Regras com "Li e concordo" obrigatório; Regras com busca
    para todos os perfis.
  - Perfil com foto (reduzida no aparelho), "Moram no apto", carros (placa antiga ou Mercosul), animais e contato de
    emergência.
  - O responsável convida (com as permissões de cadastrar entregas e votar em enquetes), edita e remove pessoas do
    apartamento.
  - O síndico vê os 48 apartamentos com filtros, busca e situação dos convites, cadastra o responsável, reenvia
    convites, troca o responsável e edita ou remove qualquer pessoa.
  - A portaria consulta, por apartamento, só nome, foto, tipo e carros.
  - Matriz de permissões conferida em todos os serviços; sem ninguém conectado, nada funciona além da entrada.
  - Painel `/dev` mostra as mensagens de WhatsApp simuladas.
  - Testes: 292 unitários, 187 de ponta a ponta no desenvolvimento, 10 sobre os builds de demonstração e real, e
    auditoria de acessibilidade das telas novas nas quatro aparências.

### Alterado

- Guia de publicação no Cloudflare Pages: `NODE_VERSION` passa a ser 22 (o Next.js 16 exige Node 20.9 ou mais novo).
- Nova marca (`terreo-kit/`): laranja `#E8590C`, branco, marrom `#7A4E35` e creme `#F4EEE2`, com o mascote
  sabiá-laranjeira. Ícone do app, favicon, ícones do PWA, quadrados dos ícones e o mascote nas boas-vindas usam o
  laranja exato; botões e textos usam o mesmo laranja mais escuro (`#C2410C`), porque o laranja exato com texto branco
  fica abaixo do mínimo de leitura. Modo escuro em marrom-escuro e creme. O PDF da documentação também foi atualizado.
- A escolha de perfil da spec 001 foi substituída pela entrada; nos modos de desenvolvimento e demonstração, a tela de
  entrada oferece "Contas de exemplo".
- Dados de exemplo na versão 2: pessoas separadas dos papéis, síndica, porteiros com celular, convite pendente (902),
  carros, animais, contato de emergência e 12 regras.
- Campos e botões da entrada só ficam ativos depois de a página carregar, para nada do que for digitado se perder.

### Corrigido

- O tema e o alto contraste podiam se perder quando o React renderizava a página de novo no navegador.
- Identificadores e o hash do código passaram a funcionar também fora de HTTPS (rede local e testes).
- Erro de hidratação no seletor de país do celular (nomes dos países diferentes no servidor e no navegador), que
  fazia a página ser refeita no navegador; um teste novo falha se aparecer erro de hidratação.

## 2026-11-15

### Adicionado

- Repositório do projeto no GitHub, com README, `.gitignore` e `CLAUDE.md`.
- Spec Kit com a constituição 1.0.0: português, documentação como fonte oficial, segurança e dados pessoais, uso por
  qualquer pessoa, WhatsApp junto ao app, simplicidade e verificação.
- Regras de commit: prefixo em inglês, descrição em português, sem coautores de IA.
- Documentação em `docs/` (visão geral, funcionalidades, arquitetura, desenvolvimento), backlog e este histórico.
- Geração da documentação em PDF (`scripts/gerar_pdf.py`) e rotina de encerramento do dia (`/encerrar-dia`).

- Stack técnica definida: Next.js (PWA) com Tailwind e shadcn/ui, FastAPI, PostgreSQL, ARQ com Redis, Cloudflare R2,
  Evolution API para o WhatsApp, Web Push, voz pelo navegador, VLibras, Docker Compose e Caddy em VPS.
- Decisões de projeto: monorepo (`web/` e `api/`), vários condomínios desde o início, front-end primeiro, sessão em
  cookie protegido, três idiomas desde o início e piloto com todas as funcionalidades do minimundo.

- Base do app (spec 001, Etapa 1):
  - Navegação dos três perfis (morador, portaria e síndico), com barra de baixo, "Mais" e "Todos os serviços" e
    uma tela "em construção" para cada funcionalidade do minimundo.
  - Escolha de perfil nas versões de desenvolvimento e de demonstração; faixa "Demonstração".
  - Português, inglês e espanhol, com troca na hora; idioma inicial pelo celular.
  - Tema claro, escuro ou seguir o celular, alto contraste e quatro tamanhos de letra, aplicados sem piscar; VLibras.
  - App instalável (ícones e cores da marca) que abre todas as telas sem internet e se atualiza sozinho.
  - Dados de exemplo fictícios do Edifício Taquaretinga (48 apartamentos, 5 funcionários, escala) no aparelho, por
    trás de serviços que depois usarão a API, separados por condomínio.
  - API mínima com verificação de saúde, banco, Redis e worker no ambiente local (`make dev`).
  - Painel de desenvolvimento em `/dev`: visão geral, andamento, backlog, histórico, commits e documentos.
  - Testes: 159 unitários, 4 da API, 103 de ponta a ponta (Android e iPhone simulados) e Lighthouse no perfil móvel.

### Alterado

- Cores e fontes alinhadas ao kit da marca: azul `#1B4FD8` com branco nos dois temas e títulos em Plus Jakarta Sans
  peso 800.
- Constituição 1.0.0 → 1.1.0: documentação em PDF atualizada ao fim de cada dia de trabalho.
- Constituição 1.1.0 → 1.2.0: stack registrada no princípio VI e ferramentas de teste no princípio VII.
- Capítulo "Arquitetura e estrutura" com a stack, o diagrama das partes, login, riscos e as pastas `web/` e `api/`.
- Backlog reorganizado em etapas: base do app, telas com dados locais, API e integrações, piloto.
