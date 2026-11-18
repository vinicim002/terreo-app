import path from "node:path"
import { expect, signInAs, switchTo, test } from "./helpers"

const CAIXA = path.join(__dirname, "fixtures", "caixa.jpg")

// Spec 004, História 6: achados e perdidos.
test('H6: achado com foto, "é meu", devolvido; perdido e encontrei', async ({ page }) => {
  await signInAs(page, "front-desk")
  await page.goto("/front-desk/lost-and-found/")
  await page.getByRole("button", { name: "Registrar achado" }).click()
  await page.getByTestId("photo-input").setInputFiles(CAIXA)
  await page.getByLabel("O que é").fill("Carteira marrom")
  await page.getByLabel("Onde foi achado (opcional)").fill("Garagem")
  await page.getByRole("button", { name: "Salvar" }).click()
  await expect(page.getByRole("article").filter({ hasText: "Carteira marrom" })).toBeVisible()

  await switchTo(page, "responsible", "/resident/lost-and-found/")
  const carteira = page.getByRole("article").filter({ hasText: "Carteira marrom" })
  await carteira.getByRole("button", { name: "É meu" }).click()
  await expect(carteira).toContainText("Você disse que é seu")
  await page.getByRole("button", { name: "Avisar objeto perdido" }).click()
  await page.getByLabel("O que é").fill("Bola de futebol")
  await page.getByRole("button", { name: "Salvar" }).click()
  await page.getByRole("button", { name: /Perdidos/ }).click()
  await expect(page.getByRole("article").filter({ hasText: "Bola de futebol" })).toBeVisible()

  await switchTo(page, "front-desk", "/front-desk/lost-and-found/")
  const naPortaria = page.getByRole("article").filter({ hasText: "Carteira marrom" })
  await expect(naPortaria).toContainText("O 804 disse que é dele")
  await naPortaria.getByRole("button", { name: "Devolvido" }).click()
  await expect(naPortaria.getByLabel("Devolvido a qual apartamento?")).toHaveValue("804")
  await naPortaria.getByRole("button", { name: "Confirmar" }).click()
  await page.getByRole("button", { name: "Devolvidos" }).click()
  await expect(page.getByRole("article").filter({ hasText: "Carteira marrom" })).toContainText(
    "Devolvido ao 804",
  )
  await page.getByRole("button", { name: /Perdidos/ }).click()
  await page
    .getByRole("article")
    .filter({ hasText: "Bola de futebol" })
    .getByRole("button", { name: "Encontrei" })
    .click()

  await switchTo(page, "responsible", "/resident/notifications/")
  await expect(page.getByRole("button", { name: /Bola de futebol/ })).toBeVisible()
})
