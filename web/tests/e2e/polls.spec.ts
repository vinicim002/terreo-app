import { ACCOUNTS, expect, signInAs, switchTo, test } from "./helpers"

// Spec 003, História 3: enquetes oficiais com sugestão (esclarecimento 1) e encerramento.
test("H3: sugestão do familiar, voto do responsável, mudar voto e vencedora", async ({ page }) => {
  const pergunta = "Qual planta para o jardim da entrada?"
  await signInAs(page, "manager")
  await page.goto("/manager/poll/new/")
  await page.getByLabel("Pergunta").fill(pergunta)
  await page.getByLabel("Opção 1").fill("Palmeira")
  await page.getByLabel("Opção 2").fill("Ipê")
  await page.getByRole("switch", { name: /Um voto por apartamento/ }).click()
  await page.getByRole("button", { name: "Criar enquete" }).click()
  await expect(page).toHaveURL(/\/manager\/polls\/$/)
  await expect(page.getByRole("article").filter({ hasText: pergunta })).toBeVisible()

  await switchTo(page, "family", "/resident/polls/")
  let card = page.getByRole("article").filter({ hasText: pergunta })
  await expect(card.getByText("Toque numa opção para sugerir")).toBeVisible()
  await card.getByRole("button", { name: "Ipê" }).click()
  await expect(card.getByText("Sua sugestão: Ipê")).toBeVisible()

  await switchTo(page, "responsible", "/resident/polls/")
  card = page.getByRole("article").filter({ hasText: pergunta })
  await expect(card.getByText(`${ACCOUNTS.family.name} sugeriu: Ipê`)).toBeVisible()
  await card.getByRole("button", { name: "Palmeira" }).click() // CS-003: um toque
  await expect(card.getByText("Você votou em Palmeira")).toBeVisible()
  await expect(card.getByText("100%")).toBeVisible()
  await card.getByRole("button", { name: "Mudar voto" }).click()
  await card.getByRole("button", { name: "Ipê" }).click()
  await expect(card.getByText("Você votou em Ipê")).toBeVisible()

  await switchTo(page, "manager", "/manager/polls/")
  card = page.getByRole("article").filter({ hasText: pergunta })
  await card.getByRole("button", { name: "Encerrar agora" }).click()
  await card.getByRole("button", { name: "Sim, encerrar" }).click()
  await page.getByRole("button", { name: /Encerradas/ }).click()
  await expect(
    page.getByRole("article").filter({ hasText: pergunta }).getByText("Vencedora: Ipê"),
  ).toBeVisible()
})

test("a portaria não tem enquetes no Mais", async ({ page }) => {
  await signInAs(page, "front-desk")
  await page.goto("/front-desk/more/")
  await expect(page.getByRole("link", { name: "Avisos" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Agenda do prédio" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Enquetes" })).toBeHidden()
})
