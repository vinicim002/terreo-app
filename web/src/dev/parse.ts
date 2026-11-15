// Funções puras do painel de desenvolvimento (contracts/painel-dev.md). Testadas em dev-panel.test.ts.

export interface Stage {
  title: string
  done: number
  total: number
}

export interface Commit {
  hash: string
  date: string
  author: string
  subject: string
}

/** Cada título "## " do backlog é uma etapa; conta as caixas "- [x]" e "- [ ]" até o próximo título. */
export function progressFromBacklog(markdown: string): Stage[] {
  const stages: Stage[] = []
  let current: Stage | null = null
  for (const line of markdown.split("\n")) {
    const heading = line.match(/^## (.+)$/)
    if (heading) {
      current = { title: heading[1].trim(), done: 0, total: 0 }
      stages.push(current)
      continue
    }
    const box = line.match(/^\s*- \[([ xX])\] /)
    if (box && current) {
      current.total += 1
      if (box[1] !== " ") current.done += 1
    }
  }
  return stages.filter((s) => s.total > 0)
}

/**
 * Só aceita .md do README, de docs/ e de specs/, com caminho relativo e sem "..".
 * Devolve o caminho validado ou null.
 */
export function validateDocPath(path: string): string | null {
  if (!path || !path.endsWith(".md")) return null
  if (path.includes("\\") || path.includes("\0") || path.startsWith("/")) return null
  const parts = path.split("/")
  if (parts.some((p) => p === ".." || p === "." || p === "")) return null
  if (path === "README.md") return path
  if (parts[0] === "docs" || parts[0] === "specs") return path
  return null
}

const SEP = "\x1f"
export const GIT_LOG_FORMAT = ["%h", "%ad", "%an", "%s"].join("%x1f")

export function parseGitLog(stdout: string): Commit[] {
  return stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, date, author, ...subject] = line.split(SEP)
      return { hash, date, author, subject: subject.join(SEP) }
    })
}
