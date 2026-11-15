// Gera out/sw.js depois do `next build` (research R4, T060):
// 1. compila sw.ts com o rolldown; 2. o Serwist injeta a lista de arquivos de out/.
import { mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { injectManifest } from "@serwist/build"
import { build } from "rolldown"

const root = fileURLToPath(new URL("..", import.meta.url))
const outDir = `${root}out`
const bundle = `${root}.serwist/sw.bundle.js`
export async function bundleServiceWorker(
  buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? new Date().toISOString(),
) {
  await mkdir(`${root}.serwist`, { recursive: true })
  await build({
    input: `${root}sw.ts`,
    platform: "browser",
    transform: { define: { __BUILD_ID__: JSON.stringify(buildId) } },
    output: { file: bundle, format: "iife", minify: true },
    logLevel: "warn",
  })
}

export async function inject(dir = outDir) {
  const { count, size, warnings } = await injectManifest({
    swSrc: bundle,
    swDest: `${dir}/sw.js`,
    globDirectory: dir,
    globPatterns: ["**/*.{html,txt,js,css,json,webmanifest,svg,png,ico,woff2}"],
    globIgnores: ["sw.js"],
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  })
  for (const w of warnings) console.warn(w)
  console.log(`Service worker: ${count} arquivos guardados (${(size / 1024).toFixed(0)} KB)`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await bundleServiceWorker()
  await inject()
}
