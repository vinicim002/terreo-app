import { expect, signInAs, switchTo, test } from "./helpers"

// Spec 004, História 3: visitantes.
test("H3: avisar visita, portaria confirma, prestador com interfone e sem cadastro", async ({
  page,
}) => {
  await signInAs(page, "family")
  await page.goto("/resident/visitors/")
  await page.getByRole("link", { name: "Avisar visitante" }).click()
  await page.getByLabel("Nome", { exact: true }).fill("Carla Teste")
  await page.getByRole("button", { name: "Avisar a portaria" }).click()
  await expect(page).toHaveURL(/\/resident\/visitors\/$/)
  await expect(page.getByRole("article").filter({ hasText: "Carla Teste" })).toBeVisible()

  await switchTo(page, "front-desk", "/front-desk/visitors/")
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: "Técnico da Claro" })
      .getByText("Interfone antes de liberar"),
  ).toBeVisible()
  await page
    .getByRole("listitem")
    .filter({ hasText: "Carla Teste" })
    .getByRole("button", { name: "Chegou" })
    .click()
  await expect(page.getByRole("listitem").filter({ hasText: "Carla Teste" })).toContainText(
    "liberado por",
  )

  await page.getByRole("button", { name: "Visitante sem cadastro" }).click()
  await page.getByLabel("Nome do visitante").fill("Entregador de flores")
  await page.getByLabel("Apartamento").fill("804")
  await page.getByRole("button", { name: "Registrar entrada" }).click()
  await expect(
    page.getByRole("listitem").filter({ hasText: "Entregador de flores" }),
  ).toContainText("Sem cadastro")

  await switchTo(page, "responsible", "/resident/visitors/")
  await expect(page.getByRole("article").filter({ hasText: "Carla Teste" })).toContainText(
    "liberado por Jonas Siqueira",
  )
})
