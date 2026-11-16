import { expect, signInAs, test } from "./helpers"

// Spec 002, História 5 (H5-1 a H5-8) e CS-005.
test.describe("o síndico cadastra apartamentos e acompanha os convites", () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, "manager")
    await page.goto("/manager/residents/")
    await expect(page.getByRole("heading", { level: 1, name: "Moradores" })).toBeVisible()
    // Lista carregada = página já hidratada (digitar antes disso se perderia).
    await expect(page.getByRole("button", { name: "Todos (48)" })).toBeVisible()
  })

  test("H5-1/H5-2: totais, situação e filtros com contagem", async ({ page }) => {
    await expect(page.getByText("48 unidades · 12 andares")).toBeVisible()
    await expect(page.getByRole("button", { name: "Todos (48)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    await page.getByRole("button", { name: "Sem cadastro (3)" }).click()
    const itens = page.getByRole("main").getByRole("link")
    await expect(itens).toHaveCount(3)
    await expect(itens.first()).toContainText("303")
    await expect(itens.first()).toContainText("Cadastrar")
  })

  test("H5-3/H5-4 e CS-005: busca e cadastra o responsável do 303", async ({ page }) => {
    const inicio = Date.now()
    await page.getByPlaceholder("Buscar apto ou morador").fill("303")
    await expect(page.getByRole("main").getByRole("link")).toHaveCount(1)
    expect(Date.now() - inicio).toBeLessThan(10_000)
    await page.getByRole("main").getByRole("link").click()
    await expect(page.getByRole("heading", { level: 1, name: "Responsável do 303" })).toBeVisible()
    await expect(page.getByText(/Não pedimos CPF nem data de nascimento/)).toBeVisible()
    await page.getByLabel("Nome").fill("Fernanda Alves")
    await page.getByLabel("Celular (WhatsApp)").fill("(00) 90000-7001")
    await page.getByText("Inquilino", { exact: true }).click()
    await page.getByRole("button", { name: "Salvar e enviar convite" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Apartamento 303" })).toBeVisible()
    await expect(page.getByText("Fernanda Alves")).toBeVisible()
    expect(Date.now() - inicio).toBeLessThan(60_000)
    await page.goto("/manager/residents/")
    await expect(page.getByRole("button", { name: "Todos (48)" })).toBeVisible()
    await page.getByPlaceholder("Buscar apto ou morador").fill("303")
    await expect(page.getByRole("main").getByRole("link")).toHaveCount(1)
    await expect(page.getByRole("main").getByRole("link")).toContainText("Pendente")
  })

  test("H5-5: reenvia o convite pendente do 902", async ({ page }) => {
    await page.getByPlaceholder("Buscar apto ou morador").fill("902")
    await expect(page.getByRole("main").getByRole("link")).toHaveCount(1)
    await page.getByRole("main").getByRole("link").click()
    await page.getByRole("button", { name: "Reenviar convite" }).click()
    await expect(page.getByText("Convite reenviado.")).toBeVisible()
  })

  test("H5-6 (RF-028a): abre uma pessoa de outro apartamento e edita", async ({ page }) => {
    await page.getByPlaceholder("Buscar apto ou morador").fill("502")
    await expect(page.getByRole("main").getByRole("link")).toHaveCount(1)
    await page.getByRole("main").getByRole("link").click()
    await expect(page.getByRole("link", { name: "Convidar" })).toBeHidden()
    await page.getByRole("region", { name: "Moram no 502" }).getByRole("link").first().click()
    await page.getByLabel("Nome").fill("Editado Pela Síndica")
    await page.getByRole("button", { name: "Salvar alterações" }).click()
    await expect(page.getByText("Alterações salvas.")).toBeVisible()
  })

  test("H5-8: celular já usado no condomínio", async ({ page }) => {
    await page.getByRole("button", { name: "Sem cadastro (3)" }).click()
    await page.getByRole("main").getByRole("link").first().click()
    await page.getByLabel("Nome").fill("Repetido Teste")
    await page.getByLabel("Celular (WhatsApp)").fill("(00) 90000-0001")
    await page.getByRole("button", { name: "Salvar e enviar convite" }).click()
    await expect(page.getByText("Este número já está cadastrado no condomínio.")).toBeVisible()
  })
})
