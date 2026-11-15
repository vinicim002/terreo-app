import { expect, markNoReload, test, wasNotReloaded, withPrefs } from "./helpers"

// História 2 — cenários H2-1 a H2-6 e CS-003.
test.describe("idioma inicial pelo celular (H2-1)", () => {
  test.use({ locale: "es-ES" })
  test("celular em espanhol abre em espanhol", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "¿Cómo quieres ver Térreo?" })).toBeVisible()
    await expect(page.locator("html")).toHaveAttribute("lang", "es")
  })
})

test.describe("idioma inicial pelo celular (H2-1, outro idioma)", () => {
  test.use({ locale: "fr-FR" })
  test("celular em francês abre em português", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Como você quer ver o Térreo?" })).toBeVisible()
  })
})

test.describe("ajustes", () => {
  test.beforeEach(async ({ page }) => {
    await withPrefs(page, { profile: "resident" })
  })

  test("H2-2 e CS-003: troca de idioma na hora, sem recarregar, em menos de 1 s", async ({
    page,
  }) => {
    await page.goto("/settings/")
    await expect(page.getByRole("heading", { level: 1, name: "Ajustes" })).toBeVisible()
    await markNoReload(page)

    const inicio = Date.now()
    await page.getByRole("radio", { name: "English" }).check({ force: true })
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible()
    expect(Date.now() - inicio).toBeLessThan(1000)

    await page.getByRole("radio", { name: "Español" }).check({ force: true })
    await expect(page.getByRole("heading", { level: 1, name: "Configuración" })).toBeVisible()
    await page.getByRole("button", { name: "Volver" }).click()
    await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible()
    await expect(page.getByRole("heading", { level: 1, name: "Inicio" })).toBeVisible()
    expect(await wasNotReloaded(page)).toBe(true)
  })

  test("H2-3: tema escuro e alto contraste valem em todas as telas (4 aparências)", async ({
    page,
  }) => {
    await page.goto("/settings/")
    const html = page.locator("html")
    const fundo = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

    await page.getByRole("radio", { name: "Claro" }).check({ force: true })
    await expect(html).toHaveAttribute("data-theme", "light")
    expect(await fundo()).toBe("rgb(255, 255, 255)")

    const inicio = Date.now()
    await page.getByRole("radio", { name: "Escuro" }).check({ force: true })
    await expect(html).toHaveAttribute("data-theme", "dark")
    expect(Date.now() - inicio).toBeLessThan(1000)
    expect(await fundo()).toBe("rgb(11, 21, 51)") // #0b1533, azul-escuro da marca

    const contraste = page.getByRole("switch", { name: /Alto contraste/ })
    await contraste.click()
    await expect(contraste).toHaveAttribute("aria-checked", "true")
    await expect(html).toHaveAttribute("data-contrast", "high")
    expect(await fundo()).toBe("rgb(0, 0, 0)")

    await page.goto("/resident/deliveries/")
    await expect(html).toHaveAttribute("data-theme", "dark")
    await expect(html).toHaveAttribute("data-contrast", "high")

    await page.goto("/settings/")
    await page.getByRole("radio", { name: "Claro" }).check({ force: true })
    expect(await fundo()).toBe("rgb(255, 255, 255)")
    await expect(html).toHaveAttribute("data-contrast", "high")
  })

  test("H2-4: seguir o celular acompanha a mudança do sistema", async ({ page, browserName }) => {
    // No WebKit do Playwright, emulateMedia depois do carregamento não dispara o evento "change"
    // do matchMedia (nem para listeners criados na própria página). O Safari real dispara;
    // o cenário 9 do quickstart confere isso em um iPhone.
    test.skip(browserName === "webkit", "limitação da emulação do WebKit no Playwright")
    await page.emulateMedia({ colorScheme: "light" })
    await page.goto("/settings/")
    await page.getByRole("radio", { name: "Seguir o celular" }).check({ force: true })
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
    await page.emulateMedia({ colorScheme: "dark" })
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
    await page.emulateMedia({ colorScheme: "light" })
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
  })
})

test.describe("letra no máximo em tela de 320 px (H2-5)", () => {
  test.use({ viewport: { width: 320, height: 640 } })

  test("sem rolagem para os lados e barra de baixo legível", async ({ page }) => {
    await withPrefs(page, { profile: "front-desk", fontScale: 3, locale: "es" })
    for (const url of [
      "/front-desk/",
      "/front-desk/more/",
      "/front-desk/receive-delivery/",
      "/settings/",
    ]) {
      await page.goto(url)
      await expect(page.locator("html")).toHaveAttribute("data-font", "3")
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      const sobra = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(sobra, url).toBeLessThanOrEqual(0)
    }
    await page.goto("/front-desk/")
    const itens = page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link")
    for (let i = 0; i < 4; i++) {
      const box = await itens.nth(i).boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.width).toBeGreaterThanOrEqual(44)
    }
  })
})

test("H2-6: escolhas mantidas ao reabrir, aplicadas antes da primeira pintura", async ({
  page,
}) => {
  await withPrefs(page, {
    profile: "manager",
    theme: "dark",
    highContrast: true,
    fontScale: 2,
    locale: "en",
  })
  // Logo que o HTML é lido, antes da hidratação, os atributos já estão aplicados.
  await page.goto("/manager/", { waitUntil: "commit" })
  await page.waitForFunction(() => document.documentElement.dataset.theme !== undefined)
  const early = await page.evaluate(() => ({
    ...document.documentElement.dataset,
    lang: document.documentElement.lang,
  }))
  expect(early).toMatchObject({ theme: "dark", contrast: "high", font: "2", lang: "en" })
  await expect(page.getByRole("heading", { level: 1, name: "Manager dashboard" })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("heading", { level: 1, name: "Manager dashboard" })).toBeVisible()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
})
