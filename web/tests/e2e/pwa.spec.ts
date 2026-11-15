import { execFileSync } from "node:child_process"
import { rmSync, symlinkSync } from "node:fs"
import { join } from "node:path"
import type { Page } from "@playwright/test"
import { expect, test, withPrefs } from "./helpers"

// História 3 — rodar com E2E_BUILD=1 (build estático). Service worker só no Chromium do
// Playwright; no iPhone real, os cenários 17 a 21 do quickstart.
test.skip(({ browserName }) => browserName !== "chromium", "service worker só no Chromium")

const web = join(__dirname, "../..")

function serve(dir: "out" | "out-next") {
  const link = join(web, "out-current")
  rmSync(link, { force: true })
  symlinkSync(dir, link)
}

async function buildId(page: Page) {
  return page.locator('meta[name="terreo-build"]').getAttribute("content")
}

async function waitForServiceWorker(page: Page) {
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true))
  await page.reload() // a partir daqui, a página é controlada pelo service worker
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
}

test.beforeEach(() => serve("out"))
test.afterAll(() => serve("out"))

test("@build H3: manifesto e ícones da marca", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json()
  expect(manifest).toMatchObject({
    name: "Térreo",
    short_name: "Térreo",
    display: "standalone",
    theme_color: "#1B4FD8",
    background_color: "#1B4FD8",
  })
  expect(
    manifest.icons.map((i: { sizes: string; purpose?: string }) => `${i.sizes}${i.purpose ?? ""}`),
  ).toEqual(["192x192", "512x512", "512x512maskable"])
  for (const icon of [
    ...manifest.icons.map((i: { src: string }) => i.src),
    "/apple-icon.png",
    "/favicon.ico",
  ]) {
    expect((await request.get(icon)).status(), icon).toBe(200)
  }
})

test("@build H3-4: sem internet, todas as telas abrem, com aviso e sem VLibras", async ({
  page,
  context,
}) => {
  await withPrefs(page, { profile: "resident" })
  await page.goto("/resident/")
  await waitForServiceWorker(page)

  await context.setOffline(true)
  await page.goto("/resident/lost-and-found/") // nunca visitada
  await expect(page.getByRole("heading", { level: 1, name: "Achados e perdidos" })).toBeVisible()
  await expect(
    page.getByText("Sem internet. Mostrando o que já está salvo no aparelho."),
  ).toBeVisible()
  await expect(page.locator("[vw]")).toBeHidden()

  await page.goto("/settings/")
  await expect(page.getByText("Tradução para Libras indisponível sem internet.")).toBeVisible()
  await page.getByRole("button", { name: "Trocar perfil" }).click()
  await page.getByRole("link", { name: /Portaria/ }).click()
  await page.getByRole("link", { name: "Mais" }).click()
  await page.getByRole("link", { name: "Receber encomenda" }).click()
  await expect(page.getByRole("heading", { level: 1, name: "Receber encomenda" })).toBeVisible()

  await page.goto("/settings/")
  await page.getByRole("button", { name: "Trocar perfil" }).click()
  await page.getByRole("link", { name: /Síndico/ }).click()
  await page.goto("/manager/schedule/")
  await expect(page.getByRole("heading", { level: 1, name: "Escala da equipe" })).toBeVisible()

  await context.setOffline(false)
  await expect(page.getByText("Sem internet.", { exact: false })).toBeHidden()
})

test("@build CS-005: com o app já guardado, a tela aparece em até 1 s", async ({ page }) => {
  await page.goto("/")
  await waitForServiceWorker(page)
  for (const url of ["/", "/settings/"]) {
    await page.goto(url)
    const fcp = await page.evaluate(
      () => performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? Infinity,
    )
    expect(fcp, url).toBeLessThan(1000)
  }
})

test("@build H3-5: versão nova é baixada e assume na abertura seguinte", async ({
  page,
  context,
}) => {
  await page.goto("/")
  await waitForServiceWorker(page)
  const antiga = await buildId(page)

  execFileSync("node", ["scripts/make-next-version.mjs"], { cwd: web, stdio: "pipe" })
  serve("out-next")

  // Primeira abertura depois da publicação: baixa em segundo plano, mas continua na versão atual.
  await page.reload()
  expect(await buildId(page)).toBe(antiga)
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration()
    await reg!.update()
    const worker = reg!.installing ?? reg!.waiting
    if (worker && worker.state !== "installed") {
      await new Promise<void>((resolve) =>
        worker.addEventListener("statechange", () => worker.state === "installed" && resolve()),
      )
    }
  })

  // Fecha o app e abre de novo: a versão nova passa a valer.
  await page.close()
  const reaberta = await context.newPage()
  await reaberta.goto("/")
  await expect.poll(() => buildId(reaberta)).toBe(`${antiga}-next`)
})
