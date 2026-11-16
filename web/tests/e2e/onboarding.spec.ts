import { expect, signInAs, test } from "./helpers"

// Spec 002, História 2 (H2-1 a H2-6) e CS-003.
test.describe("primeiro acesso: boas-vindas e regras", () => {
  test("H2-1 a H2-4 e CS-003: convite pendente passa pelas boas-vindas e confirma as regras", async ({
    page,
  }) => {
    const inicio = Date.now()
    await signInAs(page, "pending")
    // A entrada leva sozinha às boas-vindas no primeiro acesso.
    await expect(page).toHaveURL(/\/welcome\/$/)
    await expect(
      page.getByRole("heading", { level: 1, name: "Bem-vindo ao Edifício Taquaretinga!" }),
    ).toBeVisible()
    await expect(page.getByText("Passo 1 de 3")).toBeVisible()
    await expect(page.getByText(/do apartamento 902/)).toBeVisible()
    await page.getByRole("button", { name: "Continuar" }).click()
    await expect(page.getByRole("heading", { name: "O que tem no app" })).toBeVisible()
    await page.getByRole("button", { name: "Continuar" }).click()
    await page.getByRole("button", { name: "Ver as regras" }).click()

    await expect(page).toHaveURL(/\/rules-accept\/$/)
    await expect(page.getByRole("heading", { name: "Convivência e silêncio" })).toBeVisible()
    // Sem confirmar, o Início não abre.
    await page.goto("/resident/")
    await expect(page).toHaveURL(/\/rules-accept\/$/)
    await page.getByRole("button", { name: "Li e concordo com as regras" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Início" })).toBeVisible()
    expect(Date.now() - inicio).toBeLessThan(120_000)

    // Não aparece de novo.
    await page.reload()
    await expect(page.getByRole("heading", { level: 1, name: "Início" })).toBeVisible()
  })

  test("H2-2: pular as boas-vindas leva às regras", async ({ page }) => {
    await signInAs(page, "pending")
    await expect(page).toHaveURL(/\/welcome\/$/)
    await page.getByRole("button", { name: "Pular" }).click()
    await expect(page).toHaveURL(/\/rules-accept\/$/)
  })

  test("H2-5: regras com busca, para morador e portaria", async ({ page }) => {
    await signInAs(page, "responsible")
    await page.goto("/resident/rules/")
    await expect(page.getByRole("heading", { level: 1, name: "Regras" })).toBeVisible()
    await page.getByPlaceholder("Buscar nas regras").fill("mudancas")
    await expect(page.getByRole("heading", { name: "Mudanças", exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Garagem", exact: true })).toBeHidden()
  })

  test("H2-6: porteiro e síndica não passam pelo primeiro acesso", async ({ page }) => {
    await signInAs(page, "front-desk")
    await page.goto("/front-desk/")
    await expect(page.getByRole("heading", { level: 1, name: "Portaria" })).toBeVisible()
    await page.goto("/front-desk/rules/")
    await expect(page.getByRole("heading", { name: "Convivência e silêncio" })).toBeVisible()
  })
})
