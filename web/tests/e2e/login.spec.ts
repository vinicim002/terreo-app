import type { Page } from "@playwright/test"
import { ACCOUNTS, expect, test } from "./helpers"

// Spec 002, História 1 (H1-1 a H1-9), CS-001, CS-009 e o caso-limite de sem internet.
async function pedirCodigo(page: Page, telefone: string) {
  await page.goto("/login/")
  await expect(page.getByLabel("Seu celular")).toBeEditable()
  await page.getByLabel("Seu celular").fill(telefone)
  await page.getByRole("button", { name: "Receber código no WhatsApp" }).click()
}

async function codigoSimulado(page: Page) {
  const texto = await page.getByTestId("simulated-message").textContent()
  return texto!.match(/\d{6}/)![0]
}

test.describe("entrada com celular e código", () => {
  test("H1-1/H1-2/H1-7 e CS-001: entra com o código e continua conectado", async ({ page }) => {
    const inicio = Date.now()
    await pedirCodigo(
      page,
      "(00) 9" +
        ACCOUNTS.responsible.phone.slice(6, 10) +
        "-" +
        ACCOUNTS.responsible.phone.slice(10),
    )
    await expect(page).toHaveURL(/\/login\/code\/$/)
    await expect(page.getByText(/enviamos no WhatsApp para \(00\)/)).toBeVisible()
    await page.getByLabel("Código de 6 dígitos").fill(await codigoSimulado(page))
    await page.getByRole("button", { name: "Entrar", exact: true }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Início" })).toBeVisible()
    expect(Date.now() - inicio).toBeLessThan(60_000)

    await page.reload()
    await expect(page.getByRole("heading", { level: 1, name: "Início" })).toBeVisible()
    await page.goto("/")
    await expect(page).toHaveURL(/\/resident\/$/)
  })

  test("H1-3: número não cadastrado", async ({ page }) => {
    await pedirCodigo(page, "(21) 98765-4321")
    await expect(page.getByText("Número não cadastrado. Fale com o síndico.")).toBeVisible()
    await expect(page).toHaveURL(/\/login\/$/)
  })

  test("número sem DDD", async ({ page }) => {
    await pedirCodigo(page, "98765-4321")
    await expect(page.getByText("Digite o número com o DDD.")).toBeVisible()
  })

  test("H1-4/H1-6: código errado e reenvio bloqueado por 1 minuto", async ({ page }) => {
    await page.goto("/login/")
    await entrarComo(page, /Familiar do 804/)
    await expect(page).toHaveURL(/\/login\/code\/$/)
    await page.getByLabel("Código de 6 dígitos").fill("000000")
    await page.getByRole("button", { name: "Entrar", exact: true }).click()
    await expect(page.getByText("Código não confere. Restam 4 tentativas.")).toBeVisible()
    await expect(page.getByRole("button", { name: /Reenviar em 0:\d\d/ })).toBeDisabled()
  })

  test("H1-9: sair pede confirmação e volta para a entrada", async ({ page }) => {
    await page.goto("/login/")
    await entrarComo(page, /Responsável do 804/)
    await page.getByLabel("Código de 6 dígitos").fill(await codigoSimulado(page))
    await page.getByRole("button", { name: "Entrar", exact: true }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Início" })).toBeVisible()
    await page.goto("/settings/")
    await page.getByRole("button", { name: "Sair" }).click()
    await page.getByRole("button", { name: "Sim, sair" }).click()
    await expect(page).toHaveURL(/\/login\/$/)
    await page.goto("/resident/")
    await expect(page).toHaveURL(/\/login\/$/)
  })

  test("CS-009: a síndica escolhe o papel e troca em até 3 toques", async ({ page }) => {
    await page.goto("/login/")
    await entrarComo(page, /Síndica/)
    await page.getByLabel("Código de 6 dígitos").fill(await codigoSimulado(page))
    await page.getByRole("button", { name: "Entrar", exact: true }).click()
    await expect(
      page.getByRole("heading", { level: 1, name: "Como você quer entrar?" }),
    ).toBeVisible()
    await page.getByRole("button", { name: "Síndico" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Painel do síndico" })).toBeVisible()
    // 1: acessibilidade/ajustes · 2: trocar papel
    await page.getByRole("link", { name: "Acessibilidade e ajustes" }).click()
    await page.getByRole("button", { name: /Trocar papel: Morador do 1201/ }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Início" })).toBeVisible()
  })

  test("sem internet, a entrada avisa e não envia", async ({ page, context }) => {
    await page.goto("/login/")
    await expect(page.getByRole("heading", { level: 1, name: "Entrar no Térreo" })).toBeVisible()
    await context.setOffline(true)
    await expect(page.getByText("É preciso internet para entrar.")).toBeVisible()
    await expect(page.getByRole("button", { name: "Receber código no WhatsApp" })).toBeDisabled()
    await context.setOffline(false)
  })
})

test("o país do celular é escolhido no painel do app, com busca", async ({ page }) => {
  await page.goto("/login/")
  const pais = page.getByRole("button", { name: /^País:/ })
  await expect(pais).toContainText("+55")
  await pais.click()
  await page.getByPlaceholder("Buscar país").fill("portu")
  await page.getByRole("button", { name: /Portugal/ }).click()
  await expect(page.getByRole("button", { name: /^País:/ })).toContainText("+351")
  await expect(page.getByPlaceholder("Buscar país")).toBeHidden()
  await expect(page.locator("select")).toHaveCount(0)
})

/** Contas de exemplo: abre o seletor, escolhe a conta e entra (a tela mostra uma conta por vez). */
async function entrarComo(page: Page, conta: RegExp) {
  await page.getByRole("button", { name: /Trocar conta de exemplo/ }).click()
  await page.locator("#example-list").getByRole("button", { name: conta }).click()
  await page.getByRole("button", { name: "Entrar com esta conta" }).click()
}
