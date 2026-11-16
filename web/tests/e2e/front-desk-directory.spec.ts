import { expect, signInAs, test } from "./helpers"

// Spec 002, RF-029a: a portaria vê nome, foto, tipo e carros; nada de celular, animal ou contato.
test("portaria consulta o 804", async ({ page }) => {
  await signInAs(page, "front-desk")
  await page.goto("/front-desk/more/")
  await page.getByRole("link", { name: "Moradores" }).click()
  await expect(page.getByRole("heading", { level: 1, name: "Moradores" })).toBeVisible()
  await expect(page.getByRole("button", { name: "804", exact: true })).toBeVisible()
  await page.getByLabel("Número do apartamento").fill("80")
  await page.getByRole("button", { name: "804", exact: true }).click()
  const ficha = page.getByRole("region", { name: "804" })
  await expect(ficha.getByText("Responsável").or(ficha.getByText("Proprietário"))).toBeVisible()
  await expect(ficha.getByText("KXY2B34")).toBeVisible()
  await expect(ficha).not.toContainText("(00)")
  await expect(ficha).not.toContainText("Thor")
  await expect(ficha).not.toContainText("emergência")
})
