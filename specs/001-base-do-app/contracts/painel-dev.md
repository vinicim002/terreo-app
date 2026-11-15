# Contrato: painel de desenvolvimento

Existe só com `next dev` (arquivos `*.dev.tsx` / `*.dev.ts`, ver `research.md` R7). Em português (RF-033).

## Páginas

| Rota | Conteúdo |
|---|---|
| `/dev` | Visão geral: `README.md` renderizado, situação da API (`GET /api/health`), contagem dos dados locais e botão "Restaurar dados de exemplo" (com confirmação) |
| `/dev/progress` | Andamento: cada `## Etapa` do `docs/backlog.md` com feitos/total e percentual |
| `/dev/backlog` | `docs/backlog.md` renderizado |
| `/dev/changelog` | `docs/changelog.md` renderizado |
| `/dev/commits` | Últimos 50 commits: código curto, data, autor, mensagem |
| `/dev/docs` | Lista de documentos em `docs/` e `specs/` (agrupados por pasta) |
| `/dev/docs?path=<caminho>` | Documento escolhido renderizado (títulos, tabelas, listas); em erro, texto bruto |

## Rotas internas (route handlers de desenvolvimento)

### `GET /dev/api/files`

Lista os `.md` de `docs/` e `specs/` e o `README.md`.

```json
{ "files": [ { "path": "docs/backlog.md", "group": "docs" }, { "path": "specs/001-base-do-app/spec.md", "group": "specs/001-base-do-app" } ] }
```

### `GET /dev/api/file?path=<caminho>`

```json
{ "path": "docs/backlog.md", "content": "# Backlog..." }
```

- `400` se o caminho não terminar em `.md`, contiver `..` ou sair de `README.md`, `docs/` ou `specs/`.
- `404` se o arquivo não existir.

### `GET /dev/api/commits`

```json
{ "commits": [ { "hash": "c3c8d92", "date": "2026-11-15", "author": "Vinicius Vila Nova", "subject": "docs: ..." } ] }
```

- Executa `git log -50` sem shell. Sem repositório ou sem commits: `{ "commits": [] }` (caso-limite da spec).

### `GET /dev/api/progress`

```json
{ "stages": [ { "title": "Etapa 0 — Fundação", "done": 4, "total": 5 } ] }
```

Calculado do `docs/backlog.md`: cada título `## ` é uma etapa; conta linhas `- [x]` e `- [ ]` até o próximo título.
