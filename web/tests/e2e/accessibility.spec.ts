import AxeBuilder from "@axe-core/playwright"
import { PROFILES_DEF, screenHref } from "../../src/navigation/screens"
import { expect, test, withPrefs } from "./helpers"

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
        await withPrefs(page, { profile: tela.profile, ...aparencia.prefs })
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
