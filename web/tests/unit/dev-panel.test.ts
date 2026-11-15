import { describe, expect, it } from "vitest"
import { parseGitLog, progressFromBacklog, validateDocPath } from "@/dev/parse"

describe("andamento a partir do backlog", () => {
  it("conta feitos e total por etapa", () => {
    const backlog = [
      "# Backlog",
      "Texto de introdução com - [x] que não é tarefa no meio da linha.",
      "## Etapa 0 — Fundação",
      "- [x] Repositório",
      "- [X] Spec Kit",
      "- [ ] Stack",
      "## Etapa 1 — Base do app (Proposta)",
      "- [ ] PWA",
      "  - [x] subitem conta também",
      "## Notas",
      "Sem tarefas aqui.",
    ].join("\n")
    expect(progressFromBacklog(backlog)).toEqual([
      { title: "Etapa 0 — Fundação", done: 2, total: 3 },
      { title: "Etapa 1 — Base do app (Proposta)", done: 1, total: 2 },
    ])
  })
})

describe("validação do caminho dos documentos", () => {
  it.each([
    "README.md",
    "docs/backlog.md",
    "specs/001-base-do-app/spec.md",
    "docs/documentacao/01-visao-geral.md",
  ])("aceita %s", (path) => expect(validateDocPath(path)).toBe(path))

  it.each([
    "../.env",
    "docs/../../etc/passwd.md",
    "/etc/passwd.md",
    "docs\\backlog.md",
    ".env",
    "docs/backlog.txt",
    "web/package.json",
    "arquivos-gerais-terreo/minimundo-terreo.md",
    "CLAUDE.md",
    "",
  ])("recusa %s", (path) => expect(validateDocPath(path)).toBeNull())
})

describe("leitura do git log", () => {
  it("lê código, data, autor e mensagem", () => {
    const out =
      "c3c8d92\x1f2026-11-15\x1fVinicius Vila Nova\x1fdocs: registra stack\n0d2d833\x1f2026-11-15\x1fVinicius Vila Nova\x1fdocs: adiciona tarefas\n"
    expect(parseGitLog(out)).toEqual([
      {
        hash: "c3c8d92",
        date: "2026-11-15",
        author: "Vinicius Vila Nova",
        subject: "docs: registra stack",
      },
      {
        hash: "0d2d833",
        date: "2026-11-15",
        author: "Vinicius Vila Nova",
        subject: "docs: adiciona tarefas",
      },
    ])
  })

  it("histórico vazio não quebra", () => {
    expect(parseGitLog("")).toEqual([])
  })
})
