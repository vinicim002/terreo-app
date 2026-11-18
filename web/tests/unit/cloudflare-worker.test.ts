import { afterEach, describe, expect, it, vi } from "vitest"
import worker, { proxyApi } from "../../worker/index.js"

// Publicação: o Worker do Cloudflare repassa /api/* para a API na VPS pelo túnel (mesmo domínio, sem CORS)
// e entrega o resto dos arquivos estáticos.
afterEach(() => vi.unstubAllGlobals())

describe("Worker do Cloudflare: repasse de /api e arquivos", () => {
  it("encaminha caminho, busca e método para a API e não deixa em cache", async () => {
    const fetchMock = vi.fn(async () => new Response('{"status":"ok"}', { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const request = new Request("https://terreo.v2n.tech/api/health?x=1", { method: "GET" })
    const response = await proxyApi(request, { API_ORIGIN: "https://terreo-api.v2n.tech" })
    const [target, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit]
    expect(String(target)).toBe("https://terreo-api.v2n.tech/api/health?x=1")
    expect(init.method).toBe("GET")
    expect((init.headers as Headers).get("X-Forwarded-Host")).toBe("terreo.v2n.tech")
    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
  })

  it("sem API_ORIGIN responde 503", async () => {
    const response = await proxyApi(new Request("https://x/api/health"), {})
    expect(response.status).toBe(503)
  })

  it("o que não é /api vai para os arquivos estáticos", async () => {
    const assets = { fetch: vi.fn(async () => new Response("tela")) }
    const fetchMock = vi.fn(async () => new Response("{}"))
    vi.stubGlobal("fetch", fetchMock)
    const r = await worker.fetch(new Request("https://terreo.v2n.tech/resident/"), {
      ASSETS: assets,
      API_ORIGIN: "x",
    })
    expect(await r.text()).toBe("tela")
    expect(fetchMock).not.toHaveBeenCalled()
    await worker.fetch(new Request("https://terreo.v2n.tech/api/health"), {
      ASSETS: assets,
      API_ORIGIN: "https://terreo-api.v2n.tech",
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
