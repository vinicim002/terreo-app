import { ACCOUNTS, expect, signInAs, test } from "./helpers"

// Spec 002, História 3 (H3-1 a H3-8) e CS-004.
test.describe("o responsável cuida das pessoas do apartamento", () => {
  test("H3-1/H3-2 e CS-004: lista com marcas e convite", async ({ page }) => {
    await signInAs(page, "responsible")
    await page.goto("/resident/profile/")
    const lista = page.getByRole("region", { name: "Moram no 804" })
    await expect(lista.getByText("Você")).toBeVisible()
    await expect(lista.getByText("Responsável")).toBeVisible()

    const inicio = Date.now()
    await page.getByRole("link", { name: "Convidar" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Convidar para o 804" })).toBeVisible()
    await page.getByLabel("Nome").fill("Antônio Convidado")
    await page.getByLabel("Celular (WhatsApp)").fill("(00) 90000-6001")
    await expect(page.getByRole("switch", { name: "Pode cadastrar entregas" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
    await expect(page.getByRole("switch", { name: /Pode votar em enquetes/ })).toHaveAttribute(
      "aria-checked",
      "false",
    )
    await page.getByRole("button", { name: "Enviar convite no WhatsApp" }).click()
    await expect(page).toHaveURL(/\/resident\/profile\/$/)
    expect(Date.now() - inicio).toBeLessThan(60_000)
    await expect(lista.getByText("Antônio Convidado")).toBeVisible()
    await expect(lista.getByText(/Convite pendente · enviado hoje/)).toBeVisible()
  })

  test("H3-6: celular já usado no condomínio", async ({ page }) => {
    await signInAs(page, "responsible")
    await page.goto("/resident/invite/")
    await page.getByLabel("Nome").fill("Repetido Teste")
    await page.getByLabel("Celular (WhatsApp)").fill(ACCOUNTS.manager.phone.replace("+55", ""))
    await page.getByRole("button", { name: "Enviar convite no WhatsApp" }).click()
    await expect(page.getByText("Este número já está cadastrado no condomínio.")).toBeVisible()
  })

  test("H3-4/H3-5: edita e remove outra pessoa com confirmação", async ({ page }) => {
    await signInAs(page, "responsible")
    await page.goto("/resident/profile/")
    await page.getByRole("link", { name: new RegExp(ACCOUNTS.family.name!) }).click()
    await page.getByLabel("Nome").fill("Familiar Editado")
    await page.getByRole("button", { name: "Salvar alterações" }).click()
    await expect(page.getByText("Alterações salvas.")).toBeVisible()
    await page.getByRole("button", { name: "Remover do apartamento" }).click()
    await page.getByRole("button", { name: "Sim, remover" }).click()
    await expect(page).toHaveURL(/\/resident\/profile\/$/)
    await expect(page.getByText("Familiar Editado")).toBeHidden()
  })

  test("H3-7: familiar só vê a lista", async ({ page }) => {
    await signInAs(page, "family")
    await page.goto("/resident/profile/")
    await expect(page.getByRole("region", { name: "Moram no 804" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Convidar" })).toBeHidden()
    await expect(page.getByRole("region", { name: "Moram no 804" }).getByRole("link")).toHaveCount(
      0,
    )
    await page.goto("/resident/invite/")
    await expect(
      page.getByText("Só o responsável do apartamento pode convidar, editar ou remover pessoas."),
    ).toBeVisible()
  })

  test("H3-3: convidado entra pela primeira vez e deixa de estar pendente", async ({ page }) => {
    await signInAs(page, "pending")
    await expect(page).toHaveURL(/\/welcome\/$/)
    await page.getByRole("button", { name: "Pular" }).click()
    await page.getByRole("button", { name: "Li e concordo com as regras" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Início" })).toBeVisible()
    await page.goto("/resident/profile/")
    await expect(
      page.getByRole("region", { name: "Moram no 902" }).getByText("Convite pendente"),
    ).toBeHidden()
  })
})
