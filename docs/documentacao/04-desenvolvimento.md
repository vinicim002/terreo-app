# Desenvolvimento e manutenção

## Fluxo com o Spec Kit

Cada funcionalidade passa pelo [Spec Kit](https://github.com/github/spec-kit) e ganha uma pasta `specs/NNN-nome/`:

1. `/speckit-specify` — escreve o `spec.md`: o quê e por quê, sem tecnologia.
2. `/speckit-clarify` (opcional) — tira dúvidas da especificação.
3. `/speckit-plan` — escreve o `plan.md`: como construir, conferindo a constituição.
4. `/speckit-tasks` — escreve o `tasks.md`: a ordem de execução.
5. `/speckit-analyze` (opcional) — confere se spec, plano e tarefas estão coerentes.
6. `/speckit-implement` — executa as tarefas.

As regras que valem para todo o projeto estão na constituição, em `.specify/memory/constitution.md`.

## Commits

- Formato: `<prefixo em inglês>: <descrição em português>`, por exemplo `feat: adiciona cadastro de entregas`.
- Prefixos usuais: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`.
- O autor é a pessoa que fez o trabalho. Não se adicionam coautores de ferramentas de IA.

## Segurança do repositório

Nunca são versionados: arquivos `.env`, senhas, chaves, credenciais e dados reais de moradores. O `.gitignore` já
bloqueia esses arquivos; mesmo assim, o `git status` é conferido antes de cada commit.

## Encerramento do dia

Ao final de cada dia de trabalho, com o comando `/encerrar-dia` do Claude Code:

1. O `docs/changelog.md` recebe o que foi adicionado, alterado e removido no dia.
2. O `docs/backlog.md` é atualizado com o andamento das etapas.
3. Os capítulos de `docs/documentacao/` são atualizados se algo mudou (funcionalidades, arquitetura, estrutura).
4. O PDF é gerado de novo com `uv run scripts/gerar_pdf.py`.
5. Tudo é commitado e enviado, quando o desenvolvedor autorizar.

## Gerar o PDF manualmente

Requer o [uv](https://docs.astral.sh/uv/). As dependências (Markdown e WeasyPrint) são baixadas automaticamente.

```
uv run scripts/gerar_pdf.py
```

O resultado fica em `docs/pdf/terreo-documentacao.pdf`.

## Ambiente local

Requisitos: Docker com Docker Compose, Node.js 26 e [uv](https://docs.astral.sh/uv/). O `make` é opcional
(`sudo apt install make`); abaixo de cada comando está o equivalente sem ele.

```
cp .env.example .env        # valores de desenvolvimento, sem segredos
cd web && npm ci && cd ..   # node_modules da interface (também usado pelos testes e2e)
make dev                    # docker compose up --build -d --renew-anon-volumes
```

| Endereço | O quê |
|---|---|
| http://localhost:3100 | Interface (Next.js em modo de desenvolvimento) |
| http://localhost:3100/dev | Painel de desenvolvimento |
| http://localhost:3100/api/health | API, pelo repasse do Next.js (como fará o Caddy) |
| localhost:5440 · localhost:6390 | PostgreSQL e Redis |

Para abrir o ambiente de desenvolvimento no celular pela rede, coloque o IP da máquina em `DEV_ALLOWED_ORIGINS` no
`.env`. Para instalar o app no celular é preciso HTTPS: use a versão de demonstração.

## Testes e verificações

| Comando | O quê |
|---|---|
| `make test` | Vitest (interface) e pytest (API) |
| `make lint` | ESLint, Prettier e TypeScript (interface); Ruff (API) |
| `make e2e` | Playwright (Pixel 7 e iPhone 14) contra o `make dev`, no contêiner oficial do Playwright |
| `make e2e-build` | Gera a demonstração e testa PWA, uso sem internet, atualização e ausência do painel |
| `make perf` | Lighthouse no perfil móvel (4G simulado) sobre a demonstração |

Rodar um teste só:

```
cd web && npx vitest run tests/unit/screens.test.ts
docker compose --profile e2e run --rm e2e npx playwright test tests/e2e/navigation.spec.ts --project=pixel-7
cd api && uv run pytest tests/test_health.py::test_health_ok
```

## Versões do app

`NEXT_PUBLIC_APP_MODE` escolhe a versão:

- `dev` — desenvolvimento, com escolha de perfil e painel `/dev`.
- `demo` — demonstração publicável: escolha de perfil, faixa "Demonstração", só dados fictícios, sem painel.
- `real` — versão dos moradores; até o login (Etapa 2), mostra "Entrada em breve".

`npm run build:demo` (em `web/`) gera a demonstração em `web/out/`: arquivos estáticos com o service worker, que
guarda todas as telas para uso sem internet.

## Publicar a demonstração no Cloudflare Pages

1. No painel do Cloudflare: Workers & Pages → Create → Pages → conectar ao repositório do GitHub.
2. Configuração do build: diretório raiz `web`, comando `npm run build:demo`, pasta de saída `out`.
3. Variáveis: `NODE_VERSION=22` (o Next.js 16 exige Node 20.9 ou mais novo; a 22 é suportada pelo Cloudflare).
4. Cada push na `main` publica uma versão nova; o app instalado a recebe na abertura seguinte.

## Painel de desenvolvimento

Em `/dev`, só no `make dev`: visão geral (README, situação da API, dados de exemplo e botão para restaurá-los),
andamento das etapas do backlog, backlog, histórico, últimos 50 commits e todos os documentos de `docs/` e `specs/`,
lidos direto dos arquivos. As páginas do painel usam a extensão `.dev.tsx` e não existem no build (demonstração ou
versão real).
