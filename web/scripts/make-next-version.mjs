// Usado pelo teste de atualização (RF-023a): cria out-next/ como se fosse a próxima versão
// publicada — mesmo conteúdo com outro identificador de build e um sw.js novo.
import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { bundleServiceWorker, inject } from "./build-sw.mjs"

const root = fileURLToPath(new URL("..", import.meta.url))
const out = join(root, "out")
const next = join(root, "out-next")

const html = await readFile(join(out, "index.html"), "utf8")
const current = html.match(/name="terreo-build" content="([^"]+)"/)?.[1]
if (!current) throw new Error("Identificador de build não encontrado em out/index.html")
const nextId = `${current}-next`

await rm(next, { recursive: true, force: true })
await cp(out, next, { recursive: true })

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await walk(path)
    else if (/\.(html|txt|js)$/.test(entry.name) && entry.name !== "sw.js") {
      const text = await readFile(path, "utf8")
      if (text.includes(current)) await writeFile(path, text.replaceAll(current, nextId))
    }
  }
}
await walk(next)
await bundleServiceWorker(nextId)
await inject(next)
console.log(nextId)
