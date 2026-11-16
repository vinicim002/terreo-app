import { expect, signInAs, test } from "./helpers"

// Erro de hidratação faz o React refazer a página no navegador e perder tema, contraste e letra.
for (const url of ["/login/", "/resident/invite/", "/manager/residents/", "/settings/"]) {
  test(`sem erro de hidratação ${url}`, async ({ page }) => {
    const erros: string[] = []
    page.on("console", (m) => m.type() === "error" && erros.push(m.text().slice(0, 200)))
    page.on("pageerror", (e) => erros.push(e.message.slice(0, 200)))
    if (url !== "/login/")
      await signInAs(
        page,
        url.startsWith("/manager") ? "manager" : "responsible",
        url.startsWith("/manager") ? "manager" : undefined,
      )
    await page.goto(url)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await page.waitForLoadState("networkidle")
    expect(erros.filter((e) => /hydrat|did not match|didn't match/i.test(e))).toEqual([])
  })
}
