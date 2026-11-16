import { EXAMPLE_ACCOUNTS } from "../../src/services/local/seed"
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

// ---------- Entrada (spec 002) ----------

export type AccountKey = (typeof EXAMPLE_ACCOUNTS)[number]["key"]
export const ACCOUNTS = Object.fromEntries(EXAMPLE_ACCOUNTS.map((a) => [a.key, a])) as Record<
  AccountKey,
  (typeof EXAMPLE_ACCOUNTS)[number]
>

/** Perfil da spec 001 → conta de exemplo que entra nele. */
export const ACCOUNT_FOR_PROFILE = {
  resident: "responsible",
  "front-desk": "front-desk",
  manager: "manager",
} as const

/**
 * Entra direto com uma conta de exemplo pelo atalho de testes (`__terreoDev`, só em dev/demo),
 * sem repetir o fluxo do código em cada teste (research R8 da spec 002).
 */
export async function signInAs(
  page: Page,
  account: AccountKey,
  roleKind?: "resident" | "front-desk" | "manager",
) {
  if (page.url() === "about:blank") await page.goto("/login/")
  await page.waitForFunction(() => !!(window as unknown as { __terreoDev?: unknown }).__terreoDev)
  const role = roleKind ?? (account === "manager" ? "manager" : undefined)
  await page.evaluate(
    ([phone, r]) =>
      (
        window as unknown as {
          __terreoDev: { signInAs: (p: string, r?: string) => Promise<unknown> }
        }
      ).__terreoDev.signInAs(phone, r ?? undefined),
    [ACCOUNTS[account].phone, role ?? null] as const,
  )
  // A tela de entrada redireciona sozinha para o início do papel; espera terminar.
  if (new URL(page.url()).pathname.startsWith("/login")) {
    await page.waitForURL((url) => !url.pathname.startsWith("/login"))
    // E espera a guarda de acesso terminar de redirecionar (ex.: primeiro acesso → boas-vindas).
    await page.waitForLoadState("networkidle")
  }
}

/** Entra no perfil da spec 001 com a conta correspondente. */
export async function signInProfile(page: Page, profile: keyof typeof ACCOUNT_FOR_PROFILE) {
  await signInAs(page, ACCOUNT_FOR_PROFILE[profile], profile)
}
