// Worker do Térreo no Cloudflare (Workers com arquivos estáticos): entrega as telas de `out/` e repassa /api/* para a
// API na VPS, que só é alcançável pelo Cloudflare Tunnel (API_ORIGIN, ex.: https://terreo-api.v2n.tech). Assim o
// navegador fala sempre com o mesmo domínio (constituição: FastAPI em /api no mesmo domínio; cookie sem CORS).
// Configuração: web/wrangler.jsonc (o Worker só roda primeiro em /api/*; o resto vem direto dos arquivos).

export async function proxyApi(request, env) {
  if (!env.API_ORIGIN) return new Response("API_ORIGIN não configurado", { status: 503 })
  const incoming = new URL(request.url)
  const target = new URL(incoming.pathname + incoming.search, env.API_ORIGIN)
  const headers = new Headers(request.headers)
  headers.set("X-Forwarded-Host", incoming.host)
  headers.set("X-Forwarded-Proto", "https")
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual",
  })
  // Respostas da API nunca ficam em cache compartilhado.
  const out = new Response(response.body, response)
  out.headers.set("Cache-Control", "no-store")
  return out
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (pathname === "/api" || pathname.startsWith("/api/")) return proxyApi(request, env)
    return env.ASSETS.fetch(request)
  },
}
