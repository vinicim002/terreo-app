import { expect, test, withPrefs } from "./helpers"

// História 1 — cenários H1-1 a H1-7 da spec.
test.describe("navegação por perfil", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("e2e:clean")) {
        localStorage.clear()
        sessionStorage.setItem("e2e:clean", "1")
      }
    })
  })

  test("H1-1: primeira abertura mostra a escolha de perfil", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Como você quer ver o Térreo?" })).toBeVisible()
    for (const perfil of ["Morador", "Portaria", "Síndico"]) {
      await expect(page.getByRole("link", { name: new RegExp(perfil) })).toBeVisible()
    }
  })

  const PERFIS = [
    { nome: "Morador", inicio: "Início", barra: ["Início", "Entregas", "Sugestões", "Perfil"] },
    { nome: "Portaria", inicio: "Portaria", barra: ["Portaria", "Entregas", "Visitantes", "Mais"] },
    {
      nome: "Síndico",
      inicio: "Painel do síndico",
      barra: ["Painel", "Avisos", "Moradores", "Mais"],
    },
  ]

  for (const perfil of PERFIS) {
    test(`H1-2/H1-3: ${perfil.nome} navega pela barra sem recarregar`, async ({ page }) => {
      await page.goto("/")
      await page.getByRole("link", { name: new RegExp(perfil.nome) }).click()
      await expect(page.getByRole("heading", { level: 1, name: perfil.inicio })).toBeVisible()

      const barra = page.getByRole("navigation", { name: "Navegação principal" })
      await expect(barra.getByRole("link")).toHaveCount(4)
      await expect(barra.getByRole("link").first()).toHaveAttribute("aria-current", "page")

      await page.evaluate(
        () => ((window as unknown as { __semReload: boolean }).__semReload = true),
      )
      for (const item of perfil.barra.slice(1)) {
        await barra.getByRole("link", { name: item }).click()
        await expect(barra.getByRole("link", { name: item })).toHaveAttribute(
          "aria-current",
          "page",
        )
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      }
      expect(
        await page.evaluate(() => (window as unknown as { __semReload?: boolean }).__semReload),
      ).toBe(true)
    })
  }

  test("RF-007: Mais da portaria e Todos os serviços do morador levam às telas vazias", async ({
    page,
  }) => {
    await withPrefs(page, { profile: "front-desk" })
    await page.goto("/front-desk/more/")
    await page.getByRole("link", { name: "Receber encomenda" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Receber encomenda" })).toBeVisible()
    await expect(page.getByText("Em construção")).toBeVisible()
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible()
    await page.getByRole("button", { name: "Voltar" }).click()
    await expect(page).toHaveURL(/\/front-desk\/more\/$/)
  })

  test("H1-4: endereço direto abre a tela", async ({ page }) => {
    await withPrefs(page, { profile: "resident" })
    await page.goto("/resident/lost-and-found/")
    await expect(page.getByRole("heading", { level: 1, name: "Achados e perdidos" })).toBeVisible()
  })

  test("H1-5: tela de outro perfil", async ({ page }) => {
    await withPrefs(page, { profile: "resident" })
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

  test("H1-7: lembra o perfil e permite trocar", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /Síndico/ }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Painel do síndico" })).toBeVisible()
    await page.goto("/")
    await expect(page).toHaveURL(/\/manager\/$/)
    await page.goto("/settings/")
    await page.getByRole("button", { name: "Trocar perfil" }).click()
    await expect(page.getByRole("heading", { name: "Como você quer ver o Térreo?" })).toBeVisible()
  })

  test("sem perfil escolhido, rota de perfil leva à escolha", async ({ page }) => {
    await page.goto("/resident/deliveries/")
    await expect(page.getByRole("heading", { name: "Como você quer ver o Térreo?" })).toBeVisible()
  })
})
