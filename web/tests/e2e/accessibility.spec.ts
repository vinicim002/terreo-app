import AxeBuilder from "@axe-core/playwright"
import { PROFILES_DEF, screenHref } from "../../src/navigation/screens"
import { expect, test, withPrefs, signInProfile, signInAs, type AccountKey } from "./helpers"

// CS-006: nenhuma violação grave nas telas de primeiro nível, nas quatro aparências.
const APARENCIAS = [
  { nome: "claro", prefs: { theme: "light", highContrast: false } },
  { nome: "escuro", prefs: { theme: "dark", highContrast: false } },
  { nome: "claro-alto-contraste", prefs: { theme: "light", highContrast: true } },
  { nome: "escuro-alto-contraste", prefs: { theme: "dark", highContrast: true } },
]

const TELAS = Object.values(PROFILES_DEF).flatMap((def) =>
  [...new Set([...def.nav, def.hub])].map((slug) => ({
    profile: def.profile,
    url: screenHref(
      def,
      def.screens.find((s) => s.slug === slug)!,
    ),
  })),
)

for (const aparencia of APARENCIAS) {
  test.describe(`acessibilidade — ${aparencia.nome}`, () => {
    // Uma vez por aparência basta; o layout é o mesmo nos dois celulares.
    test.skip(({ browserName }) => browserName !== "chromium", "auditoria só no Chromium")

    for (const tela of [...TELAS, { profile: "resident" as const, url: "/settings/" }]) {
      test(`${tela.url}`, async ({ page }) => {
        await withPrefs(page, aparencia.prefs)
        await signInProfile(page, tela.profile)
        await page.goto(tela.url)
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
        const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]
        if (aparencia.prefs.highContrast) tags.push("wcag2aaa")
        const result = await new AxeBuilder({ page }).withTags(tags).exclude("[vw]").analyze()
        const graves = result.violations.filter(
          (v) => v.impact === "serious" || v.impact === "critical",
        )
        expect(
          graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
        ).toEqual([])
      })
    }
  })
}

test("escolha de perfil sem violações graves", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium")
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude("[vw]")
    .analyze()
  expect(
    result.violations.filter((v) => v.impact === "serious" || v.impact === "critical"),
  ).toEqual([])
})

// Spec 002: telas de entrada, primeiro acesso, perfil, convite, síndico e portaria (T061).
const TELAS_002: { conta: AccountKey | null; papel?: "manager"; url: string }[] = [
  { conta: null, url: "/login/" },
  { conta: "pending", url: "/welcome/" },
  { conta: "pending", url: "/rules-accept/" },
  { conta: "responsible", url: "/resident/profile/" },
  { conta: "responsible", url: "/resident/invite/" },
  { conta: "responsible", url: "/resident/profile/edit/" },
  { conta: "responsible", url: "/resident/vehicle/" },
  { conta: "responsible", url: "/resident/emergency-contact/" },
  { conta: "manager", papel: "manager", url: "/manager/residents/" },
  { conta: "front-desk", url: "/front-desk/residents/" },
]

for (const aparencia of APARENCIAS) {
  test.describe(`acessibilidade (spec 002) — ${aparencia.nome}`, () => {
    test.skip(({ browserName }) => browserName !== "chromium", "auditoria só no Chromium")
    for (const tela of TELAS_002) {
      test(tela.url, async ({ page }) => {
        await withPrefs(page, aparencia.prefs)
        if (tela.conta) await signInAs(page, tela.conta, tela.papel)
        await page.goto(tela.url)
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
        await page.waitForLoadState("networkidle")
        const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]
        if (aparencia.prefs.highContrast) tags.push("wcag2aaa")
        const result = await new AxeBuilder({ page }).withTags(tags).exclude("[vw]").analyze()
        const graves = result.violations.filter(
          (v) => v.impact === "serious" || v.impact === "critical",
        )
        expect(
          graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
        ).toEqual([])
      })
    }
  })
}
