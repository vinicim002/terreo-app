import { expect, signInAs, switchTo, test } from "./helpers"

// Spec 005, História 2: alerta geral da portaria para o prédio inteiro.
test("H2: portaria envia, morador vê em tela cheia e na faixa, portaria encerra", async ({
  page,
}) => {
  await signInAs(page, "front-desk")
  await page.goto("/front-desk/general-alert/")
  await page.getByRole("button", { name: "Incêndio", exact: true }).click()
  await page.getByRole("button", { name: /^Princípio de incêndio\. Desçam pela escada/ }).click()
  await expect(page.getByLabel("Mensagem")).toHaveValue(/Princípio de incêndio/)
  await page.getByRole("button", { name: "Enviar alerta geral" }).click()
  await expect(page.getByText("Enviar para todos os moradores?")).toBeVisible()
  await page.getByRole("button", { name: "Sim, enviar" }).click()
  await expect(page.getByRole("heading", { name: "Em aberto: Incêndio" })).toBeVisible()
  // Quem enviou não recebe a tela cheia.
  await expect(page.getByRole("alertdialog")).toBeHidden()

  await switchTo(page, "responsible", "/resident/")
  const tela = page.getByRole("alertdialog", { name: "Incêndio" })
  await expect(tela).toBeVisible()
  await expect(tela).toContainText("Princípio de incêndio")
  await tela.getByRole("button", { name: "Entendi" }).click()
  await expect(tela).toBeHidden()
  await expect(page.getByRole("heading", { name: "Alerta geral: Incêndio" })).toBeVisible()
  // O morador não tem como enviar alerta geral.
  await page.goto("/resident/services/")
  await expect(page.getByRole("link", { name: "Alerta geral" })).toBeHidden()

  await switchTo(page, "front-desk", "/front-desk/general-alert/")
  await page.getByLabel("Mensagem de encerramento (opcional)").fill("Fogo apagado pelos bombeiros")
  await page.getByRole("button", { name: "Encerrar alerta" }).click()
  await expect(page.getByRole("button", { name: "Enviar alerta geral" })).toBeVisible()

  await switchTo(page, "responsible", "/resident/notifications/")
  await expect(page.getByText("Fogo apagado pelos bombeiros")).toBeVisible()
  await page.goto("/resident/")
  await expect(page.getByRole("heading", { name: "Alerta geral: Incêndio" })).toBeHidden()
})
