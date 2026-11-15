<!--
Relatório de sincronização
- Versão: 1.1.0 → 1.2.0 (stack definida)
- Princípio VI: stack fixa registrada (Next.js, FastAPI, PostgreSQL, ARQ/Redis, R2, Evolution API, Docker/Caddy,
  multi-condomínio).
- Princípio VII: ferramentas de teste (pytest, Vitest, Playwright) e isolamento entre condomínios.
- Restrições: ordem front-end primeiro, escopo do piloto e sessão.
- Modelos em .specify/templates/: sem mudança necessária
-->

# Constituição do Térreo

## Princípios

### I. Português em tudo que a pessoa lê

Especificações, planos, tarefas, documentação, textos da interface, mensagens de erro e comentários são em português do
Brasil, com acentuação correta. Identificadores de código (variáveis, funções, tabelas, colunas, rotas) ficam em
inglês. Textos da interface ficam separados do código, porque o app também será usado em inglês e espanhol. Datas
mostradas à pessoa seguem o fuso de Brasília.

**Por quê**: quem usa e quem mantém o app lê português; o código segue o padrão das bibliotecas.

### II. A documentação é a fonte oficial

`docs/` descreve como o produto é (documentação, backlog e histórico de alterações) e é publicada também em PDF;
`specs/NNN-nome/` descreve cada mudança. Mudança de comportamento atualiza `docs/` junto com o código. O `spec.md` diz **o quê e por quê**, sem tecnologia; a tecnologia fica no
`plan.md`. Decisões em aberto ficam marcadas como em aberto, não supostas. As regras de negócio do produto (o
"minimundo") são a referência de toda spec.

**Por quê**: o que não está escrito se perde quando outra pessoa entra no projeto.

### III. Segurança e dados pessoais primeiro (INEGOCIÁVEL)

- Guardar o mínimo: nada de CPF, data de nascimento ou número de documento de visitantes.
- Telefones, fotos, placas, entregas e códigos de entrega são dados pessoais (LGPD): acesso só com login e só para
  quem precisa. Códigos e entregas de um morador nunca vão para o grupo do WhatsApp nem para outros moradores.
- Avisos anônimos (como o de barulho) não guardam nem mostram quem enviou.
- Segredos (tokens, senhas, chaves de API, credenciais do WhatsApp) só em variáveis de ambiente (`.env`), nunca no
  código nem no repositório. Nenhum arquivo sensível ou dado real de moradores é versionado.
- Toda rota que altera dados exige login e confere o perfil (morador, portaria, síndico).

**Por quê**: o app guarda dados de famílias que moram no mesmo prédio; um vazamento afeta a segurança física delas.

### IV. Para qualquer pessoa usar

- A tela da portaria é a mais simples possível: botões grandes, ícones, pouco texto, e todo registro pode ser feito por
  voz.
- Acessibilidade é requisito: tamanho de letra, alto contraste, leitura em voz alta, legendas, modo escuro e Libras.
- Entrar sem senha (código pelo WhatsApp) e sem baixar app de loja (PWA instalado pelo link).

**Por quê**: o público inclui idosos e funcionários com pouca familiaridade com tecnologia.

### V. WhatsApp junto, não no lugar

Tudo o que é importante também chega pelo WhatsApp do condomínio: avisos gerais no grupo, avisos pessoais no privado.
Funções essenciais (como informar código de entrega) precisam funcionar também por mensagem no WhatsApp. Alertas de
emergência chegam sempre a todos, sem respeitar preferências de notificação.

**Por quê**: ninguém pode ficar de fora por não usar o app.

### VI. Simples e na stack combinada

Stack fixa (decidida em 2026-11-15):

- **Interface**: Next.js (App Router) + TypeScript como PWA, Tailwind CSS + shadcn/ui (ícones lucide), next-intl
  (pt, en, es desde o início), Web Push padrão (VAPID), reconhecimento de voz do navegador (Web Speech API), VLibras.
  O Next.js só renderiza telas: regras de negócio ficam no back-end, e o navegador chama a API no mesmo domínio.
- **Back-end**: Python + FastAPI + SQLAlchemy + Alembic + PostgreSQL; tarefas em segundo plano e agendadas com ARQ +
  Redis; fotos no Cloudflare R2 (bucket privado, acesso só por URL assinada de curta duração).
- **WhatsApp**: Evolution API em contêiner próprio, sempre atrás de um serviço de envio trocável e com fila (limite de
  ritmo para evitar bloqueio do número).
- **Infraestrutura**: monorepo (`web/` e `api/`), Docker Compose no desenvolvimento e na VPS, Caddy como proxy reverso
  com HTTPS.
- **Multi-condomínio desde o início**: todo dado pertence a um condomínio e toda consulta filtra por ele.

Dependência nova, serviço novo ou camada nova só entra com justificativa no `plan.md` (seção de complexidade).
Mudança de banco sempre por migração Alembic nova; migração já aplicada não é editada. Funcionalidades da seção "Ideias
para o futuro" do minimundo não entram sem spec própria.

**Por quê**: um app simples e parecido por dentro com os outros projetos é mais fácil de manter e de ajustar durante o
piloto.

### VII. Pronto é verificado

Toda regra de negócio tem teste automatizado no back-end (pytest) cobrindo o caminho feliz, a recusa por permissão, o
isolamento entre condomínios e os casos-limite da spec. Na interface, Vitest para componentes e serviços e Playwright
para os fluxos principais em tela de celular. Telas são validadas pelo `quickstart.md` da spec, com os cenários escritos
antes da implementação. Os comandos de teste e lint entram no `CLAUDE.md` quando o código existir.

**Por quê**: o teste e o roteiro de validação são a revisão quando não há outra pessoa revisando.

## Restrições do Térreo

- Três perfis com interfaces distintas: morador, portaria (porteiros e funcionários) e síndico.
- A unidade é o apartamento. O síndico cadastra o apartamento e o morador responsável; só o responsável convida ou
  remove as outras pessoas do apartamento. Enquetes oficiais têm um voto por apartamento.
- Piloto: Edifício Taquaretinga.
- Ordem de construção: front-end primeiro. As telas usam serviços tipados com dados locais; depois os mesmos serviços
  passam a chamar a API, sem mudar as telas.
- Escopo do piloto: todas as funcionalidades do minimundo, exceto "Ideias para o futuro".
- A sessão fica em cookie httpOnly (Secure em produção) com token aleatório; o banco guarda só o hash. Expira após 6
  meses sem uso e pode ser revogada.

## Fluxo de trabalho

- Spec Kit: `/speckit-specify` → (`/speckit-clarify`) → `/speckit-plan` → `/speckit-tasks` → (`/speckit-analyze`) →
  `/speckit-implement`. Cada mudança relevante tem sua pasta em `specs/NNN-nome/`, numerada em sequência.
- Correção pequena e óbvia (texto, bug de uma linha) não precisa de spec.
- Commits: `<prefixo em inglês>: <descrição em português>` (ex.: `feat: adiciona cadastro de entregas`). Autor é só a
  pessoa que fez o commit; **nunca** coautor de IA, `Co-Authored-By` de ferramenta ou "Generated with". Commitar só
  quando o desenvolvedor pedir.
- Antes de cada commit, conferir que nenhum arquivo sensível (`.env`, credenciais, dados reais) está incluído.

## Documentação e encerramento do dia

- A documentação completa do projeto existe também em PDF (`docs/pdf/terreo-documentacao.pdf`), gerado por
  `uv run scripts/gerar_pdf.py` a partir de `docs/documentacao/`, `docs/backlog.md` e `docs/changelog.md`. Ela serve
  para manutenção, para quem entra no projeto e para apresentar as funcionalidades a clientes.
- Ao fim de cada dia de trabalho (`/encerrar-dia`): o changelog recebe o que foi adicionado, alterado e removido; o
  backlog e os capítulos afetados são atualizados; o PDF é gerado de novo e commitado.
- O app terá um painel de desenvolvimento (fora da versão publicada) com andamento, backlog, histórico e documentos.

## Governança

Esta constituição vale acima de qualquer outro guia do projeto. Todo `plan.md` confere cada princípio na
"Verificação da constituição"; violação só entra justificada na seção de complexidade. Versão: MAIOR remove ou
redefine princípio; MENOR acrescenta princípio ou seção; CORREÇÃO só ajusta texto.

**Versão**: 1.2.0 | **Ratificada**: 2026-11-15 | **Última alteração**: 2026-11-15
