import { expect, signInAs, switchTo, test } from "./helpers"

// Spec 004, História 4: ditar com um reconhecimento de fala falso (research R5).
test("H4: a portaria dita o recado e a síndica transforma em aviso", async ({ page }) => {
  await page.addInitScript(() => {
    class FakeRecognition {
      lang = ""
      interimResults = false
      continuous = false
      onresult: ((e: unknown) => void) | null = null
      onerror: ((e: unknown) => void) | null = null
      onend: (() => void) | null = null
      start() {
        setTimeout(() => {
          this.onresult?.({
            results: {
              length: 1,
              0: { 0: { transcript: "O elevador social está parado" }, isFinal: true },
            },
          })
          this.onend?.()
        }, 50)
      }
      stop() {
        this.onend?.()
      }
    }
    Object.assign(window, {
      SpeechRecognition: FakeRecognition,
      webkitSpeechRecognition: FakeRecognition,
    })
  })
  await signInAs(page, "front-desk")
  await page.goto("/front-desk/dictate/")
  await page.getByRole("button", { name: "Ditar" }).click()
  const recado = page.getByLabel("Recado")
  await expect(recado).toHaveValue("O elevador social está parado")
  await recado.fill("O elevador social está parado desde as 14h")
  await page.getByRole("button", { name: "Enviar ao síndico" }).click()
  await expect(page.getByText("Recado enviado ao síndico.")).toBeVisible()

  await switchTo(page, "manager", "/manager/memos/")
  const card = page.getByRole("article").filter({ hasText: "desde as 14h" })
  await card.getByRole("link", { name: "Transformar em aviso" }).click()
  await expect(page.getByLabel("Mensagem", { exact: true })).toHaveValue(
    "O elevador social está parado desde as 14h",
  )
  await page.getByLabel("Título", { exact: true }).fill("Elevador social parado")
  await page.getByRole("button", { name: "Publicar", exact: true }).click()
  await expect(
    page.getByRole("heading", { level: 2, name: "Elevador social parado" }),
  ).toBeVisible()
  await page.goto("/manager/memos/")
  await expect(page.getByRole("article").filter({ hasText: "desde as 14h" })).toContainText(
    "Virou aviso",
  )
})

test("H4-3: sem reconhecimento de fala, avisa e deixa digitar", async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { SpeechRecognition: undefined, webkitSpeechRecognition: undefined })
  })
  await signInAs(page, "front-desk")
  await page.goto("/front-desk/dictate/")
  await page.getByRole("button", { name: "Ditar" }).click()
  await expect(
    page.getByText("Ditar não está disponível neste aparelho. Digite o texto."),
  ).toBeVisible()
  await page.getByLabel("Recado").fill("Portão da garagem fazendo barulho")
  await expect(page.getByRole("button", { name: "Enviar ao síndico" })).toBeEnabled()
})
