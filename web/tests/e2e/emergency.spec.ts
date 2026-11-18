import type { Page } from "@playwright/test"
import { ACCOUNTS, expect, signInAs, switchTo, test } from "./helpers"

// Spec 005, Histórias 1 e 4: botão de emergência, portaria em tela cheia, "Estou indo", cancelar e histórico.
// O relógio fica numa segunda às 10:00 de Brasília, quando Jonas (a conta da portaria) está de plantão.
const SEGUNDA_10H = new Date("2026-11-16T13:00:00Z")

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(SEGUNDA_10H)
})

async function segurar(page: Page, ms: number) {
  const botao = page.getByRole("button", { name: /^segure/i })
  await botao.hover()
  await page.mouse.down()
  await page.waitForTimeout(ms)
  await page.mouse.up()
}

test("H1: toque rápido não envia; segurar 3 s envia; a portaria vai e o morador vê", async ({
  page,
}) => {
  await signInAs(page, "responsible")
  await page.goto("/resident/emergency/")
  await expect(page.getByRole("heading", { name: "Precisa de ajuda?" })).toBeVisible()
  // Ligar direto (RF-007).
  await expect(page.getByRole("link", { name: "SAMU 192" })).toHaveAttribute("href", "tel:192")
  await expect(page.getByRole("link", { name: "Bombeiros 193" })).toHaveAttribute("href", "tel:193")
  await expect(page.getByRole("link", { name: "Polícia 190" })).toHaveAttribute("href", "tel:190")

  // CS-002: toque rápido e soltar antes dos 3 s não enviam.
  await page.getByRole("button", { name: /^segure/i }).click()
  await segurar(page, 1_500)
  await page.waitForTimeout(500)
  await expect(page.getByRole("heading", { name: "Alerta enviado!" })).toBeHidden()

  await page.getByRole("button", { name: "Saúde" }).click()
  await expect(page.getByRole("button", { name: "Saúde" })).toHaveAttribute("aria-pressed", "true")
  await segurar(page, 3_400)
  await expect(page.getByRole("heading", { name: "Alerta enviado!" })).toBeVisible()
  await expect(page.getByText("A portaria foi avisada às 10:00")).toBeVisible()
  await expect(page.getByRole("link", { name: "Ligar para a portaria" })).toBeVisible()

  // A portaria de plantão vê a tela cheia com apartamento, andar, tipo e contato de emergência.
  await switchTo(page, "front-desk", "/front-desk/")
  const alerta = page.getByRole("alertdialog", { name: "Emergência no apartamento 804" })
  await expect(alerta).toBeVisible()
  await expect(alerta.getByRole("heading", { name: "Apto 804" })).toBeVisible()
  await expect(alerta).toContainText("8º andar · Saúde")
  await expect(alerta).toContainText("Contato de emergência: Rita Moreira (Irmã)")
  await alerta.getByRole("button", { name: "Estou indo" }).click()
  await expect(alerta.getByRole("status")).toHaveText("Jonas Siqueira está indo")
  await alerta.getByRole("button", { name: "Voltar ao painel" }).click()
  await expect(alerta).toBeHidden()
  await expect(page.getByRole("link", { name: /Emergência · apto 804/ })).toBeVisible()

  // O morador vê quem está a caminho e cancela.
  await switchTo(page, "responsible", "/resident/emergency/")
  await expect(page.getByText("Jonas Siqueira viu o alerta")).toBeVisible()
  await page.getByRole("button", { name: "Cancelar alerta" }).click()
  await page.getByRole("button", { name: "Sim, cancelar" }).click()
  await expect(page.getByRole("heading", { name: "Precisa de ajuda?" })).toBeVisible()

  await switchTo(page, "front-desk", "/front-desk/emergency-alert/")
  await expect(page.getByText("Nenhum alerta em aberto.")).toBeVisible()
  await expect(page.getByText("Cancelado pelo morador").first()).toBeVisible()
})

test("CS-001: SOS pelo WhatsApp abre a tela cheia na portaria em segundos; resolver com nota", async ({
  page,
  context,
}) => {
  await signInAs(page, "front-desk")
  await page.goto("/front-desk/")
  await expect(page.getByTestId("count-awaiting")).not.toHaveText("–")

  // Outra aba do mesmo aparelho simula a mensagem recebida (painel /dev).
  const dev = await context.newPage()
  await dev.clock.setFixedTime(SEGUNDA_10H)
  await dev.goto("/dev/")
  const simulador = dev.getByTestId("inbox-simulator")
  await simulador.getByLabel("Celular de quem manda").selectOption(ACCOUNTS.family.phone)
  const inicio = Date.now()
  await simulador.getByRole("button", { name: 'Simular "SOS"' }).click()
  await expect(simulador.getByRole("status")).toContainText("sos:")

  const alerta = page.getByRole("alertdialog", { name: "Emergência no apartamento 804" })
  await expect(alerta).toBeVisible({ timeout: 5_000 })
  expect(Date.now() - inicio).toBeLessThan(5_000)
  await expect(alerta).toContainText("Não informado")
  await expect(alerta).toContainText("pelo WhatsApp")

  await alerta.getByRole("button", { name: "Estou indo" }).click()
  await alerta.getByLabel("Como terminou? (opcional)").fill("Queda leve, já está bem")
  await alerta.getByRole("button", { name: "Resolvido" }).click()
  await expect(alerta).toBeHidden()
  await page.goto("/front-desk/emergency-alert/")
  await expect(page.getByText("Queda leve, já está bem")).toBeVisible()
})

test("H4: histórico — síndico vê todos; morador vê o do apartamento e os gerais", async ({
  page,
}) => {
  await signInAs(page, "manager")
  await page.goto("/manager/emergency-alert/")
  const historico = page.locator("section", {
    has: page.getByRole("heading", { name: "Histórico de alertas" }),
  })
  await expect(historico.getByText(/Apto 501 · Saúde/)).toBeVisible()
  await expect(historico.getByText(/Jonas Siqueira atendeu em 1 min/)).toBeVisible()
  await expect(historico.getByText(/Geral · Vazamento de gás/)).toBeVisible()
  await expect(historico.getByText("Encerrado em 25 min")).toBeVisible()

  await switchTo(page, "family", "/resident/emergency/")
  const meu = page.locator("section", {
    has: page.getByRole("heading", { name: "Histórico de alertas" }),
  })
  await expect(meu.getByText(/Geral · Vazamento de gás/)).toBeVisible()
  await expect(meu.getByText(/Apto 501/)).toBeHidden()
})
