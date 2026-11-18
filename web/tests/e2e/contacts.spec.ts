import { expect, signInAs, switchTo, test } from "./helpers"

// Spec 005, História 3: contatos importantes.
test("H3: do início ao SAMU em 2 toques; busca; síndico acrescenta e mostra o celular", async ({
  page,
}) => {
  await signInAs(page, "responsible")
  await page.goto("/resident/")
  // CS-005: toque 1 → Contatos; toque 2 → ligar.
  await page.getByRole("link", { name: "Contatos", exact: true }).click()
  await expect(page.getByRole("link", { name: "Ligar para SAMU" })).toHaveAttribute(
    "href",
    "tel:192",
  )
  await page.getByLabel("Buscar contato").fill("luz")
  await expect(page.getByRole("link", { name: "Ligar para Light (energia)" })).toHaveAttribute(
    "href",
    "tel:08000210196",
  )
  await expect(page.getByRole("link", { name: "Ligar para SAMU" })).toBeHidden()
  await page.getByLabel("Buscar contato").fill("")
  // Sem autorização, o síndico aparece sem número.
  await expect(page.getByText(/Síndico · fale pela portaria/)).toBeVisible()
  await expect(page.getByRole("link", { name: /Editar contatos/ })).toBeHidden()

  await switchTo(page, "manager", "/manager/contacts/")
  await page.getByRole("link", { name: "Editar contatos" }).click()
  await page.getByRole("switch", { name: /Mostrar meu celular nos contatos/ }).click()
  await expect(
    page.getByRole("switch", { name: /Mostrar meu celular nos contatos/ }),
  ).toHaveAttribute("aria-checked", "true")
  await page.getByRole("button", { name: "Acrescentar contato" }).click()
  await page.getByLabel("Nome").fill("Chaveiro 24h")
  await page.getByLabel("Número").fill("(21) 98765-4321")
  await page.getByRole("button", { name: "Salvar" }).click()
  await expect(page.getByText("Chaveiro 24h", { exact: true })).toBeVisible()

  await switchTo(page, "responsible", "/resident/contacts/")
  await expect(page.getByRole("link", { name: "Ligar para Chaveiro 24h" })).toHaveAttribute(
    "href",
    "tel:+5521987654321",
  )
  await expect(page.getByRole("link", { name: "WhatsApp de Chaveiro 24h" })).toHaveAttribute(
    "href",
    "https://wa.me/5521987654321",
  )
  await expect(page.getByText(/Síndico · \(00\)/)).toBeVisible()
})
