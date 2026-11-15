// Build completo da interface: next build (exportação estática) + service worker,
// com o mesmo identificador de versão nos dois (RF-023a).
import { spawnSync } from "node:child_process"

process.env.NEXT_PUBLIC_BUILD_ID ??= new Date().toISOString()
const result = spawnSync("npx", ["next", "build"], { stdio: "inherit", env: process.env })
if (result.status !== 0) process.exit(result.status ?? 1)

const { bundleServiceWorker, inject } = await import("./build-sw.mjs")
await bundleServiceWorker()
await inject()
console.log(
  `Versão ${process.env.NEXT_PUBLIC_BUILD_ID} (modo ${process.env.NEXT_PUBLIC_APP_MODE ?? "real"})`,
)
