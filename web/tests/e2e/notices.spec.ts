import { expect, pickDate, signInAs, switchTo, test } from "./helpers"

// Spec 003, Histórias 1 e 2: avisos.
test.describe("avisos", () => {
  test("H1: a síndica publica, o morador lê e a portaria só vê", async ({ page }) => {
    await signInAs(page, "manager")
    await page.goto("/manager/notices/")
    const inicio = Date.now()
    await page.getByRole("link", { name: "Novo aviso" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Novo aviso" })).toBeVisible()
    await page.getByText("Falta d'água", { exact: true }).click()
    await page.getByLabel("Título", { exact: true }).fill("Água cortada no sábado")
    await page.getByLabel("Mensagem", { exact: true }).fill("Reparo na caixa d'água do prédio.")
    await page.getByRole("button", { name: "Publicar", exact: true }).click()
    await expect(
      page.getByRole("heading", { level: 2, name: "Água cortada no sábado" }),
    ).toBeVisible()
    expect(Date.now() - inicio).toBeLessThan(60_000) // CS-001

    await switchTo(page, "responsible", "/resident/notices/")
    await page.getByRole("button", { name: /Não lidos/ }).click()
    const item = page.getByRole("link", { name: /Água cortada no sábado/ })
    await expect(item).toContainText("Não lido")
    await item.click()
    await expect(
      page.getByRole("heading", { level: 2, name: "Água cortada no sábado" }),
    ).toBeVisible()
    await expect(page.getByText("Enviado também ao grupo do WhatsApp do condomínio")).toBeVisible()
    await page.goto("/resident/notices/")
    await page.getByRole("button", { name: /Não lidos/ }).click()
    await expect(page.getByRole("link", { name: /Água cortada no sábado/ })).toBeHidden()

    await switchTo(page, "front-desk", "/front-desk/notices/")
    await expect(page.getByRole("link", { name: "Novo aviso" })).toBeHidden()
    await page.getByRole("link", { name: /Água cortada no sábado/ }).click()
    await expect(
      page.getByRole("heading", { level: 2, name: "Água cortada no sábado" }),
    ).toBeVisible()
  })

  test("H2: importante com confirmação, leituras, edição e resolvido", async ({ page }) => {
    await signInAs(page, "manager")
    await page.goto("/manager/notice/edit/")
    await page.getByText("Energia", { exact: true }).click()
    await page.getByLabel("Título", { exact: true }).fill("Troca do quadro de luz")
    await page.getByLabel("Mensagem", { exact: true }).fill("Desligamento das 9h às 11h.")
    await page.getByRole("switch", { name: /Importante/ }).click()
    await page.getByRole("switch", { name: /Pedir confirmação de leitura/ }).click()
    await page.getByRole("button", { name: "Publicar", exact: true }).click()
    await expect(page.getByText("Importante").first()).toBeVisible()

    await switchTo(page, "responsible", "/resident/notices/")
    await page.getByRole("link", { name: /Troca do quadro de luz/ }).click()
    await page.getByRole("button", { name: "Confirmar leitura" }).click()
    await expect(page.getByRole("button", { name: "Lido ✓" })).toBeDisabled()

    await switchTo(page, "manager", "/manager/notices/")
    await page.getByRole("link", { name: /Troca do quadro de luz/ }).click()
    await expect(
      page.getByRole("heading", { name: /Lido por \d+ de 44 apartamentos/ }),
    ).toBeVisible()
    await expect(page.getByRole("heading", { name: "Confirmaram (1)" })).toBeVisible()
    await expect(page.getByText(/804 ·/)).toBeVisible()

    await page.getByRole("link", { name: "Editar" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Editar aviso" })).toBeVisible()
    await page.getByLabel("Mensagem", { exact: true }).fill("Desligamento das 9h às 12h.")
    await page.getByRole("button", { name: "Salvar alterações" }).click()
    await expect(page.getByText(/Editado às/)).toBeVisible()
    await expect(page.getByRole("heading", { name: "Confirmaram (0)" })).toBeVisible()

    await switchTo(page, "responsible", "/resident/notices/")
    await page.getByRole("button", { name: /Não lidos/ }).click()
    await expect(page.getByRole("link", { name: /Troca do quadro de luz/ })).toBeVisible()

    await switchTo(page, "manager", "/manager/notices/")
    await page.getByRole("link", { name: /Troca do quadro de luz/ }).click()
    await page.getByRole("button", { name: "Marcar como resolvido" }).click()
    await page.getByLabel("Nota (opcional)").fill("A luz voltou às 11h30.")
    await page.getByRole("button", { name: "Marcar como resolvido" }).click()
    await expect(page.getByText("A luz voltou às 11h30.")).toBeVisible()

    await switchTo(page, "responsible", "/resident/notices/")
    await expect(page.getByRole("link", { name: /Troca do quadro de luz/ })).toContainText(
      "Resolvido",
    )
  })

  test("H2-3: aviso agendado fica só com a síndica", async ({ page }) => {
    await signInAs(page, "manager")
    await page.goto("/manager/notices/")
    await page.getByRole("button", { name: "Agendados" }).click()
    // Dados de exemplo: dedetização agendada para daqui a 2 dias.
    await expect(page.getByRole("link", { name: /Dedetização das áreas comuns/ })).toContainText(
      "Agendado para",
    )
    await switchTo(page, "responsible", "/resident/notices/")
    await expect(page.getByRole("link", { name: /Coleta seletiva/ })).toBeVisible()
    await expect(page.getByRole("link", { name: /Dedetização/ })).toBeHidden()
    await expect(page.getByRole("button", { name: "Agendados" })).toBeHidden()
  })
})

test("aviso de outro tipo, com data do assunto pelo calendário do app", async ({ page }) => {
  await signInAs(page, "manager")
  await page.goto("/manager/notice/edit/")
  await page.getByText("Outro", { exact: true }).click()
  await page.getByLabel("Qual tipo?").fill("Obras")
  await page.getByLabel("Título", { exact: true }).fill("Obra na fachada")
  await page.getByLabel("Mensagem", { exact: true }).fill("Andaimes na frente do prédio.")
  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(Date.now() + 3 * 86_400_000),
  )
  await pickDate(page, "Data do assunto", dia)
  await expect(page.getByRole("button", { name: /^Data do assunto/ })).not.toContainText(
    "Escolher data",
  )
  await page.getByRole("button", { name: "Publicar", exact: true }).click()
  await expect(page.getByText("Obras").first()).toBeVisible()
})
