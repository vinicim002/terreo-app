import { expect, test } from "./helpers"

// Spec 002, T064 — rodar com E2E_BUILD=real sobre o build da versão real (out-real/).
test("@build-real sem atalho de testes, contas de exemplo ou painel", async ({ page, request }) => {
  await page.goto("/login/")
  await expect(page.getByRole("heading", { name: "Entrada em breve" })).toBeVisible()
  await expect(page.getByText("Contas de exemplo")).toHaveCount(0)
  expect(
    await page.evaluate(() => typeof (window as unknown as { __terreoDev?: unknown }).__terreoDev),
  ).toBe("undefined")
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Entrada em breve" })).toBeVisible()
  await page.goto("/resident/")
  await expect(page.getByRole("heading", { name: "Entrada em breve" })).toBeVisible()
  expect((await request.get("/dev/")).status()).toBe(404)
  await expect(page.getByRole("note")).toHaveCount(0) // sem faixa "Demonstração"
})
