import { expect, signInAs, signInProfile, test } from "./helpers"

// CS-008 e RF-004a — rodar com E2E_BUILD=1 sobre o build de demonstração.
test("@build painel de desenvolvimento não existe na demonstração", async ({ page, request }) => {
  for (const path of ["/dev/", "/dev/commits/", "/dev/api/files/"]) {
    expect((await request.get(path)).status(), path).toBe(404)
  }
  await page.goto("/dev/")
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible()
})

test("@build faixa de demonstração em todas as telas", async ({ page, browser }) => {
  // A escolha de perfil, numa aba sem perfil escolhido.
  const limpa = await browser.newPage()
  await limpa.goto("/")
  await expect(limpa.getByRole("heading", { level: 1 })).toBeVisible()
  await expect(limpa.getByRole("note")).toContainText("Demonstração")
  await limpa.close()

  await signInProfile(page, "manager")
  for (const url of ["/manager/", "/manager/more/", "/manager/schedule/", "/settings/"]) {
    await page.goto(url)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.getByRole("note")).toContainText("Demonstração")
  }
})

// Na versão compilada a sessão fica pronta depois de as telas montarem; as consultas não podem ficar sem resposta
// (defeito achado na publicação: as listas apareciam vazias).
test("@build telas com dados carregam na demonstração (morador e portaria)", async ({ page }) => {
  await signInAs(page, "responsible")
  for (const [url, texto] of [
    ["/resident/notices/", "Coleta seletiva"],
    ["/resident/deliveries/", "4821"],
    ["/resident/polls/", "fachada"],
    ["/resident/notifications/", "Falta d'água"],
  ] as const) {
    await page.goto(url)
    await expect(page.getByText(new RegExp(texto)).first(), url).toBeVisible()
  }
  await signInAs(page, "front-desk")
  await page.goto("/front-desk/")
  await expect(page.getByTestId("count-awaiting")).not.toHaveText("–")
  await page.goto("/front-desk/apartment/?n=804")
  await expect(page.getByText("MLB-73")).toBeVisible()
})
