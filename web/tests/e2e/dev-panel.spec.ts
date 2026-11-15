import { expect, test } from "./helpers"

// História 5 — cenários H5-1 a H5-5, contra o next dev.
test.describe("painel de desenvolvimento", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "painel é usado no computador")

  test("H5-1: seções e visão geral com API e dados locais", async ({ page }) => {
    await page.goto("/dev/")
    const menu = page.getByRole("navigation", { name: "Painel de desenvolvimento" })
    for (const secao of [
      "Visão geral",
      "Andamento",
      "Backlog",
      "Histórico",
      "Commits",
      "Documentos",
    ]) {
      await expect(menu.getByRole("link", { name: secao })).toBeVisible()
    }
    await expect(page.getByRole("heading", { level: 1, name: "Térreo" })).toBeVisible() // README
    await expect(page.getByTestId("api-status")).toContainText("No ar")
    await expect(page.getByTestId("seed-tools")).toContainText("Apartamentos: 48")
    await expect(page.getByTestId("seed-tools")).toContainText("Funcionários: 5")

    await page.getByRole("button", { name: "Restaurar dados de exemplo" }).click()
    await page.getByRole("button", { name: "Confirmar" }).click()
    await expect(page.getByText("Dados de exemplo restaurados.")).toBeVisible()
    await expect(page.getByTestId("seed-tools")).toContainText("Apartamentos: 48")
  })

  test("H5-2: andamento por etapa do backlog", async ({ page }) => {
    await page.goto("/dev/progress/")
    const etapa = page.getByRole("progressbar", { name: /Etapa 0/ })
    await expect(etapa).toBeVisible()
    await expect(page.getByText(/\d+\/\d+ · \d+%/).first()).toBeVisible()
  })

  test("H5-3: documentos de docs/ e specs/ renderizados", async ({ page }) => {
    await page.goto("/dev/docs/")
    await expect(page.getByRole("heading", { name: "specs/001-base-do-app" })).toBeVisible()
    await page.getByRole("link", { name: "spec.md" }).first().click()
    await expect(
      page.getByRole("heading", { level: 1, name: /Especificação: Base do app/ }),
    ).toBeVisible()
    await expect(page.locator(".markdown table").first()).toBeVisible()
  })

  test("H5-5: commits com código, data, autor e mensagem", async ({ page }) => {
    await page.goto("/dev/commits/")
    const linhas = page.locator("tbody tr")
    await expect(linhas.first()).toBeVisible()
    expect(await linhas.count()).toBeGreaterThan(3)
    await expect(linhas.first().locator("td").first()).toHaveText(/^[0-9a-f]{7,}$/)
  })

  test("rotas internas recusam caminhos fora de docs/ e specs/", async ({ request }) => {
    expect((await request.get("/dev/api/file/?path=../.env")).status()).toBe(400)
    expect((await request.get("/dev/api/file/?path=web/package.json")).status()).toBe(400)
    expect((await request.get("/dev/api/file/?path=docs/nao-existe.md")).status()).toBe(404)
    const ok = await request.get("/dev/api/file/?path=docs/backlog.md")
    expect(ok.status()).toBe(200)
    expect((await ok.json()).content).toContain("# Backlog")
    const files = await (await request.get("/dev/api/files/")).json()
    expect(
      files.files.some((f: { path: string }) => f.path === "specs/001-base-do-app/tasks.md"),
    ).toBe(true)
    const commits = await (await request.get("/dev/api/commits/")).json()
    expect(commits.commits.length).toBeGreaterThan(0)
    const progress = await (await request.get("/dev/api/progress/")).json()
    expect(progress.stages[0].title).toMatch(/Etapa 0/)
  })
})
