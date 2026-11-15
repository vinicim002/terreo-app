# Histórico de alterações

Registro diário do que foi adicionado, alterado e removido no projeto. A entrada mais recente fica no topo.

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
