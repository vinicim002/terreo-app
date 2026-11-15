import { test as base, type Page } from "@playwright/test"

export const PREFS_KEY = "terreo:prefs"

/** Testes sem dependência externa: o script do VLibras (gov.br) é bloqueado. */
export const test = base.extend<{ blockExternal: void }>({
  blockExternal: [
    async ({ page }, use) => {
      await page.route(/vlibras\.gov\.br/, (route) => route.abort())
      await use()
    },
    { auto: true },
  ],
})
export { expect } from "@playwright/test"

/** Abre o app com preferências já gravadas no aparelho (só na primeira carga da aba). */
export async function withPrefs(page: Page, prefs: Record<string, unknown>) {
  await page.addInitScript(
    ([key, value]) => {
      if (!sessionStorage.getItem("e2e:prefs-set")) {
        localStorage.setItem(key, value)
        sessionStorage.setItem("e2e:prefs-set", "1")
      }
    },
    [PREFS_KEY, JSON.stringify({ locale: "pt", ...prefs })] as const,
  )
}

/** Marca a janela para provar depois que a página não foi recarregada. */
export async function markNoReload(page: Page) {
  await page.evaluate(() => ((window as unknown as { __noReload: boolean }).__noReload = true))
}

export async function wasNotReloaded(page: Page) {
  return page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload === true)
}
