import { expect, signInAs, switchTo, test } from "./helpers"

// Spec 004, História 5: modo viagem e equipe de plantão.
test("H5: modo viagem aparece para a portaria; equipe de plantão", async ({ page }) => {
  await signInAs(page, "responsible")
  await page.goto("/resident/travel-mode/")
  await page.getByRole("button", { name: "Ativar modo viagem" }).click()
  await expect(page.getByRole("status")).toContainText("Modo viagem ativo")

  await switchTo(page, "front-desk", "/front-desk/deliveries/")
  await expect(page.getByRole("link", { name: /^804\b.*Em viagem até/ })).toBeVisible()
  await page.goto("/front-desk/travel-watch/")
  await expect(page.getByRole("link", { name: /804/ })).toBeVisible()
  await expect(page.getByRole("link", { name: /1003/ })).toBeVisible()

  await switchTo(page, "responsible", "/resident/on-duty/")
  await expect(page.getByTestId("on-duty-now").getByText("De plantão").first()).toBeVisible()
  await expect(page.getByRole("heading", { name: "Próximos turnos" })).toBeVisible()
})
