import { expect, signInAs, test } from "./helpers"

// Spec 002, História 4 (H4-1 a H4-6).
test.describe("perfil, carros, animais e contato de emergência", () => {
  test("H4-1/H4-2: edita nome e foto; o celular não muda por aqui", async ({ page }) => {
    await signInAs(page, "family")
    await page.goto("/resident/profile/edit/")
    await page.getByLabel("Nome").fill("Nome Trocado")
    // Imagem PNG mínima (1 × 1) — o app reduz e guarda como JPEG.
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    )
    await page
      .getByTestId("photo-input")
      .setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: png })
    await expect(page.getByRole("button", { name: "Tirar foto" })).toBeVisible()
    await expect(page.getByText(/O celular é o que dá acesso ao app/)).toBeVisible()
    await page.getByRole("button", { name: "Salvar" }).click()
    await expect(page.getByText("Perfil salvo.")).toBeVisible()
    await page.goto("/resident/profile/")
    await expect(page.getByText("Nome Trocado").first()).toBeVisible()
  })

  test("H4-3/H4-4/H4-5: responsável cadastra carro, animal e contato", async ({ page }) => {
    await signInAs(page, "responsible")
    await page.goto("/resident/profile/")
    await page.getByRole("link", { name: "Adicionar carro" }).click()
    await page.getByLabel("Placa").fill("abc1d23")
    await page.getByLabel("Modelo").fill("Kwid")
    await page.getByLabel("Cor").fill("Preto")
    await page.getByRole("button", { name: "Salvar" }).click()
    await expect(page.getByText("ABC1D23")).toBeVisible()

    await page.getByRole("link", { name: "Adicionar animal" }).click()
    await page.getByLabel("Nome").fill("Luna")
    await page.getByText("Gato", { exact: true }).click()
    await page.getByRole("button", { name: "Salvar" }).click()
    await expect(page.getByText("Luna")).toBeVisible()

    // O 804 já tem contato de emergência nos dados de exemplo (spec 005); aqui ele é trocado.
    await expect(page.getByText(/Rita Moreira \(Irmã\)/)).toBeVisible()
    await page.getByRole("link", { name: /Contato de emergência/ }).click()
    await page.getByLabel("Nome").fill("Rita Prado")
    await page.getByLabel("Parentesco").fill("Mãe")
    await page.getByLabel("Celular").fill("(00) 90000-8001")
    await page.getByRole("button", { name: "Salvar" }).click()
    await expect(page.getByText(/Rita Prado \(Mãe\)/)).toBeVisible()
  })

  test("placa inválida", async ({ page }) => {
    await signInAs(page, "responsible")
    await page.goto("/resident/vehicle/")
    await page.getByLabel("Placa").fill("AB12")
    await page.getByLabel("Modelo").fill("X")
    await page.getByLabel("Cor").fill("Y")
    await page.getByRole("button", { name: "Salvar" }).click()
    await expect(page.getByText("Placa inválida. Use ABC-1234 ou ABC1D23.")).toBeVisible()
  })

  test("H4-6 e CS-006: nenhum campo de CPF, nascimento ou documento", async ({ page }) => {
    await signInAs(page, "responsible")
    for (const url of [
      "/resident/profile/",
      "/resident/profile/edit/",
      "/resident/invite/",
      "/resident/vehicle/",
      "/resident/pet/",
      "/resident/emergency-contact/",
    ]) {
      await page.goto(url)
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      // Só rótulos de campos: nenhum pede CPF, nascimento, documento ou RG.
      await expect(
        page.locator("label, legend").filter({ hasText: /\bCPF\b|nascimento|documento|\bRG\b/i }),
      ).toHaveCount(0)
    }
  })
})
