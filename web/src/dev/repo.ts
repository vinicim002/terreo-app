// Leitura do repositório pelo painel de desenvolvimento (só roda no `next dev`, no servidor).
import "server-only"
import { execFile } from "node:child_process"
import { readdir, readFile } from "node:fs/promises"
import { join, relative, resolve, sep } from "node:path"
import { promisify } from "node:util"
import {
  GIT_LOG_FORMAT,
  parseGitLog,
  progressFromBacklog,
  validateDocPath,
  type Commit,
} from "./parse"

const run = promisify(execFile)

/** Raiz do repositório: a pasta acima de web/. */
export const REPO_ROOT = resolve(process.cwd(), "..")

export interface DocFile {
  path: string
  group: string
}

async function walk(dir: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const files = await Promise.all(
    entries.map((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : Promise.resolve([join(dir, e.name)]),
    ),
  )
  return files.flat().filter((f) => f.endsWith(".md"))
}

export async function listDocs(): Promise<DocFile[]> {
  const found = [
    ...(await walk(join(REPO_ROOT, "docs"))),
    ...(await walk(join(REPO_ROOT, "specs"))),
  ]
  const docs = found
    .map((abs) => relative(REPO_ROOT, abs).split(sep).join("/"))
    .sort()
    .map((path) => {
      const parts = path.split("/")
      return {
        path,
        group: parts[0] === "specs" ? `specs/${parts[1]}` : parts.slice(0, -1).join("/"),
      }
    })
  return [{ path: "README.md", group: "README" }, ...docs]
}

export class DocPathError extends Error {}

/** Lê um documento validado; o caminho final precisa continuar dentro da raiz. */
export async function readDoc(path: string): Promise<string> {
  const valid = validateDocPath(path)
  if (!valid) throw new DocPathError("Caminho não permitido.")
  const abs = resolve(REPO_ROOT, valid)
  if (!abs.startsWith(REPO_ROOT + sep)) throw new DocPathError("Caminho não permitido.")
  return readFile(abs, "utf8")
}

export async function listCommits(limit = 50): Promise<Commit[]> {
  try {
    // execFile sem shell: nenhum texto vindo do pedido entra no comando.
    const { stdout } = await run(
      "git",
      ["log", `-${limit}`, "--date=short", `--format=${GIT_LOG_FORMAT}`],
      {
        cwd: REPO_ROOT,
      },
    )
    return parseGitLog(stdout)
  } catch {
    return [] // sem repositório ou sem commits (caso-limite da spec)
  }
}

export async function backlogProgress() {
  try {
    return progressFromBacklog(await readDoc("docs/backlog.md"))
  } catch {
    return []
  }
}
