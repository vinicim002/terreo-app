# Histórico de alterações

Registro diário do que foi adicionado, alterado e removido no projeto. A entrada mais recente fica no topo.

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
