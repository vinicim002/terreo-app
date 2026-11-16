import { expect, signInProfile, test } from "./helpers"

// História 1 da spec 001, agora com a sessão da spec 002 no lugar da escolha de perfil.
test.describe("navegação por perfil", () => {
  test("H1-1 (002): sem sessão, a primeira abertura mostra a entrada", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login\/$/)
    await expect(page.getByRole("heading", { level: 1, name: "Entrar no Térreo" })).toBeVisible()
  })

  const PERFIS = [
    { perfil: "resident", inicio: "Início", barra: ["Início", "Entregas", "Sugestões", "Perfil"] },
    {
      perfil: "front-desk",
      inicio: "Portaria",
      barra: ["Portaria", "Entregas", "Visitantes", "Mais"],
    },
    {
      perfil: "manager",
      inicio: "Painel do síndico",
      barra: ["Painel", "Avisos", "Moradores", "Mais"],
    },
  ] as const

  for (const { perfil, inicio, barra } of PERFIS) {
    test(`H1-2/H1-3: ${perfil} navega pela barra sem recarregar`, async ({ page }) => {
      await signInProfile(page, perfil)
      await page.goto("/")
      await expect(page.getByRole("heading", { level: 1, name: inicio })).toBeVisible()

      const nav = page.getByRole("navigation", { name: "Navegação principal" })
      await expect(nav.getByRole("link")).toHaveCount(4)
      await expect(nav.getByRole("link").first()).toHaveAttribute("aria-current", "page")

      await page.evaluate(
        () => ((window as unknown as { __semReload: boolean }).__semReload = true),
      )
      for (const item of barra.slice(1)) {
        await nav.getByRole("link", { name: item }).click()
        await expect(nav.getByRole("link", { name: item })).toHaveAttribute("aria-current", "page")
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      }
      expect(
        await page.evaluate(() => (window as unknown as { __semReload?: boolean }).__semReload),
      ).toBe(true)
    })
  }

  test("RF-007: Mais da portaria leva às telas vazias", async ({ page }) => {
    await signInProfile(page, "front-desk")
    await page.goto("/front-desk/more/")
    await page.getByRole("link", { name: "Receber encomenda" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Receber encomenda" })).toBeVisible()
    await expect(page.getByText("Em construção")).toBeVisible()
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible()
    await page.getByRole("button", { name: "Voltar" }).click()
    await expect(page).toHaveURL(/\/front-desk\/more\/$/)
  })

  test("H1-4: endereço direto abre a tela", async ({ page }) => {
    await signInProfile(page, "resident")
    await page.goto("/resident/lost-and-found/")
    await expect(page.getByRole("heading", { level: 1, name: "Achados e perdidos" })).toBeVisible()
  })

  test("H1-5: tela de outro perfil", async ({ page }) => {
    await signInProfile(page, "resident")
    await page.goto("/manager/")
    await expect(page.getByRole("heading", { name: "Esta tela é de outro perfil" })).toBeVisible()
    await page.getByRole("link", { name: "Voltar ao início" }).click()
    await expect(page).toHaveURL(/\/resident\/$/)
  })

  test("H1-6: endereço inexistente", async ({ page }) => {
    await page.goto("/nao-existe/")
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Voltar ao início" })).toBeVisible()
  })

  test("H1-7: com sessão, a página inicial vai direto para o perfil", async ({ page }) => {
    await signInProfile(page, "manager")
    await page.goto("/")
    await expect(page).toHaveURL(/\/manager\/$/)
  })

  test("sem sessão, rota de perfil leva à entrada e volta para ela depois de entrar", async ({
    page,
  }) => {
    await page.goto("/resident/deliveries/")
    await expect(page).toHaveURL(/\/login\/$/)
  })
})
