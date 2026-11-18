import path from "node:path"
import { ACCOUNTS, expect, signInAs, switchTo, test } from "./helpers"

const CAIXA = path.join(__dirname, "fixtures", "caixa.jpg")

// Spec 004, Histórias 1 e 2: entregas e códigos.
test.describe("entregas", () => {
  test("H1: o morador cadastra, a portaria encontra e registra a chegada", async ({ page }) => {
    await signInAs(page, "responsible")
    await page.goto("/resident/deliveries/")
    const inicio = Date.now()
    await page.getByRole("link", { name: "Cadastrar código de entrega" }).click()
    await page.getByText("Correios", { exact: true }).click()
    await page.getByLabel("Código de entrega").fill("QB1234")
    await page.getByRole("button", { name: "Salvar código" }).click()
    await expect(page).toHaveURL(/\/resident\/deliveries\/$/)
    await expect(page.getByText("QB1234")).toBeVisible()
    expect(Date.now() - inicio).toBeLessThan(30_000) // CS-001

    await switchTo(page, "front-desk", "/front-desk/")
    await page.getByLabel("Buscar apartamento").fill("804")
    await page.getByRole("link", { name: "804", exact: true }).click() // CS-002: 2 toques
    const linha = page.getByRole("listitem").filter({ hasText: "QB1234" })
    await expect(linha).toBeVisible()
    await expect(page.getByText("4821")).toBeVisible()
    await linha.getByRole("button", { name: "Chegou" }).click()
    await expect(page.getByText("QB1234")).toBeHidden()

    await switchTo(page, "responsible", "/resident/deliveries/")
    await expect(page.getByRole("article").filter({ hasText: "Correios" })).toContainText(
      "Entregue",
    )
  })

  test("H1-3: código pelo WhatsApp (simulado no /dev) e aviso de código repetido", async ({
    page,
  }) => {
    await signInAs(page, "responsible")
    await page.goto("/dev/")
    const simulador = page.getByTestId("inbox-simulator")
    await simulador.getByLabel("Celular de quem manda").selectOption(ACCOUNTS.family.phone)
    await simulador.getByLabel("Mensagem").fill("Mercado Livre MLB-99")
    await simulador.getByRole("button", { name: "Receber mensagem" }).click()
    await expect(simulador.getByRole("status")).toContainText("registered")
    await page.goto("/resident/deliveries/")
    await expect(page.getByText("MLB-99")).toBeVisible()

    await page.getByRole("link", { name: "Cadastrar código de entrega" }).click()
    await page.getByLabel("Código de entrega").fill("9999")
    await page.getByRole("button", { name: "Salvar código" }).click()
    await expect(page.getByText("Você já cadastrou um código desta loja hoje.")).toBeVisible()
    await page.getByRole("button", { name: "É outro pedido, salvar" }).click()
    await expect(page.getByText("9999")).toBeVisible()
  })

  test("H2: encomenda com foto, retirada pelo morador e correspondência", async ({ page }) => {
    await signInAs(page, "front-desk")
    await page.goto("/front-desk/receive-delivery/")
    const inicio = Date.now()
    await page.getByTestId("photo-input").setInputFiles(CAIXA)
    await expect(page.getByRole("img", { name: "Foto da encomenda (comprovante)" })).toBeVisible()
    await page.getByLabel("Apartamento").fill("804")
    await page.getByRole("button", { name: "Registrar" }).click()
    await expect(page).toHaveURL(/\/front-desk\/apartment\/\?n=804/)
    expect(Date.now() - inicio).toBeLessThan(45_000) // CS-003

    await switchTo(page, "responsible", "/resident/deliveries/")
    const retirar = page.getByRole("button", { name: "Retirei" })
    await expect(retirar).toHaveCount(2)
    await retirar.first().click()
    await expect(page.getByRole("button", { name: "Retirei" })).toHaveCount(1)
    await expect(page.getByText(/Retirada por/).first()).toBeVisible()

    await switchTo(page, "front-desk", "/front-desk/mail/")
    await page.getByLabel("Apartamento").fill("502")
    await page.getByRole("button", { name: "Avisar correspondência" }).click()
    await expect(page.getByRole("status")).toContainText("502")
  })
})

test("H2-4: a portaria registra a retirada escolhendo a pessoa em botões grandes", async ({
  page,
}) => {
  await signInAs(page, "front-desk")
  await page.goto("/front-desk/apartment/?n=804")
  await page.getByRole("button", { name: "Retirada" }).first().click()
  const quem = page.getByRole("group", { name: "Quem retirou?" })
  await expect(quem.getByRole("radio")).toHaveCount(4)
  await quem.getByText(ACCOUNTS.family.name!).click()
  await expect(quem.getByRole("radio", { name: ACCOUNTS.family.name! })).toBeChecked()
  await page.getByRole("button", { name: "Confirmar retirada" }).click()
  await expect(page.getByRole("button", { name: "Confirmar retirada" })).toBeHidden()
})

test("a portaria tem perfil na barra de baixo", async ({ page }) => {
  await signInAs(page, "front-desk")
  await page.goto("/front-desk/")
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Perfil" })
    .click()
  await expect(page.getByText(ACCOUNTS["front-desk"].name!)).toBeVisible()
  await expect(page.getByText("Portaria", { exact: true }).first()).toBeVisible()
  await page.getByRole("link", { name: "Editar" }).click()
  await expect(page.getByRole("heading", { level: 1, name: "Editar perfil" })).toBeVisible()
})
