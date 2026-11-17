import { expect, signInAs, switchTo, test } from "./helpers"

// Spec 003, História 5: sino, central e "Como receber".
test("H5: sino com contagem, central agrupada e Ler todas", async ({ page }) => {
  await signInAs(page, "responsible")
  await page.goto("/resident/")
  const sino = page.getByTestId("bell")
  await expect(sino).toHaveAccessibleName(/Notificações: \d+ não lidas?/)
  await sino.click()
  await expect(page).toHaveURL(/\/resident\/notifications\/$/)
  await expect(page.getByRole("heading", { name: "Antes" })).toBeVisible()
  await page.getByRole("button", { name: /Falta d'água amanhã/ }).click()
  await expect(page).toHaveURL(/\/resident\/notice\/\?id=/)
  await page.goto("/resident/notifications/")
  await page.getByRole("button", { name: "Ler todas" }).click()
  await expect(page.getByRole("button", { name: "Ler todas" })).toBeHidden()
  await page.goto("/resident/")
  await expect(page.getByTestId("bell")).toHaveAccessibleName("Notificações")
})

test("H5-5/H5-6: desligar enquetes no app; emergência sempre ativa", async ({ page }) => {
  await signInAs(page, "responsible")
  await page.goto("/resident/notifications/")
  await page.getByRole("button", { name: "Como receber" }).click()
  const enquetes = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Enquetes" }) })
  await expect(enquetes.getByText("Pelo grupo do condomínio")).toBeVisible()
  await enquetes.getByRole("switch", { name: "No app" }).click()
  await expect(enquetes.getByRole("switch", { name: "No app" })).toHaveAttribute(
    "aria-checked",
    "false",
  )
  await expect(page.getByRole("switch", { name: /Sempre ativa/ })).toBeDisabled()

  const pergunta = "Pintar a garagem de cinza?"
  await switchTo(page, "manager", "/manager/poll/new/")
  await page.getByLabel("Pergunta").fill(pergunta)
  await page.getByLabel("Opção 1").fill("Sim")
  await page.getByLabel("Opção 2").fill("Não")
  await page.getByRole("button", { name: "Criar enquete" }).click()
  await expect(page).toHaveURL(/\/manager\/polls\/$/)

  await switchTo(page, "responsible", "/resident/notifications/")
  await expect(page.getByRole("button", { name: /Falta d'água amanhã/ })).toBeVisible()
  await expect(page.getByText(pergunta)).toBeHidden()
  await switchTo(page, "family", "/resident/notifications/")
  await expect(page.getByText(pergunta)).toBeVisible()
})
