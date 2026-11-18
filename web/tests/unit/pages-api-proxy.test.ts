import { afterEach, describe, expect, it, vi } from "vitest"
import { onRequest } from "../../functions/api/[[path]].js"

// Publicação: o Cloudflare Pages repassa /api/* para a API na VPS pelo túnel (mesmo domínio, sem CORS).
afterEach(() => vi.unstubAllGlobals())

describe("repasse de /api no Cloudflare Pages", () => {
  it("encaminha caminho, busca e método para a API e não deixa em cache", async () => {
    const fetchMock = vi.fn(async () => new Response('{"status":"ok"}', { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const request = new Request("https://terreo.v2n.tech/api/health?x=1", { method: "GET" })
    const response = await onRequest({
      request,
      env: { API_ORIGIN: "https://terreo-api.v2n.tech" },
    })
    const [target, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit]
    expect(String(target)).toBe("https://terreo-api.v2n.tech/api/health?x=1")
    expect(init.method).toBe("GET")
    expect((init.headers as Headers).get("X-Forwarded-Host")).toBe("terreo.v2n.tech")
    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
  })

  it("sem API_ORIGIN responde 503", async () => {
    const response = await onRequest({ request: new Request("https://x/api/health"), env: {} })
    expect(response.status).toBe(503)
  })
})
