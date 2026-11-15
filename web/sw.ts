/// <reference lib="webworker" />
// Service worker do Térreo (research R4). Compilado e preenchido por scripts/build-sw.mjs.
import { Serwist, StaleWhileRevalidate, type PrecacheEntry } from "serwist"

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[]
}

declare const __BUILD_ID__: string

const serwist = new Serwist({
  // Todas as páginas e recursos do build ficam guardados na primeira abertura (RF-023).
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    // Navegações internas do Next.js pedem os mesmos arquivos com parâmetros (?_rsc=...).
    ignoreURLParametersMatching: [/.*/],
  },
  // Sem skipWaiting: a versão nova é baixada em segundo plano e assume na abertura seguinte (RF-023a).
  skipWaiting: false,
  clientsClaim: false,
  navigationPreload: false,
  runtimeCaching: [
    {
      // O resto do mesmo domínio (exceto a API) usa cópia guardada e atualiza em segundo plano.
      // Scripts de terceiros, como o VLibras, não passam por aqui (research R3a).
      matcher: ({ url, sameOrigin }) => sameOrigin && !url.pathname.startsWith("/api/"),
      handler: new StaleWhileRevalidate({ cacheName: `terreo-runtime` }),
    },
  ],
})

self.addEventListener("message", (event) => {
  if (event.data === "terreo:build-id") event.ports[0]?.postMessage(__BUILD_ID__)
})

serwist.addEventListeners()
