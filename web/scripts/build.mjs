// Build completo da interface: next build (exportação estática) + service worker,
// com o mesmo identificador de versão nos dois (RF-023a).
import { spawnSync } from "node:child_process"
import { rename, rm } from "node:fs/promises"

process.env.NEXT_PUBLIC_BUILD_ID ??= new Date().toISOString()

// O link out-current (usado pelos testes @build) pode ficar apontando para uma pasta que não existe mais,
// e o next build falha ao encontrá-lo. É recriado pelo `make e2e-build`.
await rm("out-current", { force: true })
const result = spawnSync("npx", ["next", "build"], { stdio: "inherit", env: process.env })
if (result.status !== 0) process.exit(result.status ?? 1)

const { bundleServiceWorker, inject } = await import("./build-sw.mjs")
await bundleServiceWorker()
await inject()

// BUILD_OUT=out-real (por exemplo) guarda o resultado em outra pasta, sem misturar com a demonstração.
const target = process.env.BUILD_OUT
if (target && target !== "out") {
  await rm(target, { recursive: true, force: true })
  await rename("out", target)
  console.log(`Resultado em ${target}/`)
}
console.log(
  `Versão ${process.env.NEXT_PUBLIC_BUILD_ID} (modo ${process.env.NEXT_PUBLIC_APP_MODE ?? "real"})`,
)
