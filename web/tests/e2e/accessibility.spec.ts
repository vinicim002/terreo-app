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

// Spec 003: telas de comunicação (T045). Ids fixos dos dados de exemplo (seed-communication.ts).
const AVISO_AGUA = "00000000-0000-4000-800c-000000000003"
const REUNIAO_PASSADA = "00000000-0000-4000-8011-000000000002"
const TELAS_003: { conta: AccountKey; papel?: "manager"; url: string }[] = [
  { conta: "responsible", url: "/resident/notices/" },
  { conta: "responsible", url: `/resident/notice/?id=${AVISO_AGUA}` },
  { conta: "responsible", url: "/resident/polls/" },
  { conta: "responsible", url: "/resident/calendar/" },
  { conta: "responsible", url: "/resident/meetings/" },
  { conta: "responsible", url: `/resident/meeting/?id=${REUNIAO_PASSADA}` },
  { conta: "responsible", url: "/resident/notifications/" },
  { conta: "family", url: "/resident/polls/" },
  { conta: "manager", papel: "manager", url: `/manager/notice/?id=${AVISO_AGUA}` },
  { conta: "manager", papel: "manager", url: "/manager/notice/edit/" },
  { conta: "manager", papel: "manager", url: "/manager/poll/new/" },
  { conta: "manager", papel: "manager", url: "/manager/meeting/edit/" },
  { conta: "manager", papel: "manager", url: "/manager/event/new/" },
  { conta: "front-desk", url: "/front-desk/notices/" },
  { conta: "front-desk", url: "/front-desk/calendar/" },
]

for (const aparencia of APARENCIAS) {
  test.describe(`acessibilidade (spec 003) — ${aparencia.nome}`, () => {
    test.skip(({ browserName }) => browserName !== "chromium", "auditoria só no Chromium")
    for (const tela of TELAS_003) {
      test(`${tela.conta} ${tela.url}`, async ({ page }) => {
        await withPrefs(page, aparencia.prefs)
        await signInAs(page, tela.conta, tela.papel)
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

// Spec 004: telas da portaria (T061).
const TELAS_004: { conta: AccountKey; papel?: "manager"; url: string }[] = [
  { conta: "responsible", url: "/resident/deliveries/" },
  { conta: "responsible", url: "/resident/delivery/new/" },
  { conta: "responsible", url: "/resident/visitors/" },
  { conta: "responsible", url: "/resident/visitor/new/" },
  { conta: "responsible", url: "/resident/travel-mode/" },
  { conta: "responsible", url: "/resident/on-duty/" },
  { conta: "responsible", url: "/resident/lost-and-found/" },
  { conta: "front-desk", url: "/front-desk/" },
  { conta: "front-desk", url: "/front-desk/deliveries/" },
  { conta: "front-desk", url: "/front-desk/apartment/?n=804" },
  { conta: "front-desk", url: "/front-desk/receive-delivery/" },
  { conta: "front-desk", url: "/front-desk/visitors/" },
  { conta: "front-desk", url: "/front-desk/dictate/" },
  { conta: "front-desk", url: "/front-desk/lost-and-found/" },
  { conta: "manager", papel: "manager", url: "/manager/memos/" },
]

for (const aparencia of APARENCIAS) {
  test.describe(`acessibilidade (spec 004) — ${aparencia.nome}`, () => {
    test.skip(({ browserName }) => browserName !== "chromium", "auditoria só no Chromium")
    for (const tela of TELAS_004) {
      test(`${tela.conta} ${tela.url}`, async ({ page }) => {
        await withPrefs(page, aparencia.prefs)
        await signInAs(page, tela.conta, tela.papel)
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

test("botões da portaria têm pelo menos 56 px (RF-025)", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium")
  await signInAs(page, "front-desk")
  await page.goto("/front-desk/apartment/?n=804")
  await expect(page.getByRole("button", { name: "Chegou" }).first()).toBeVisible()
  for (const name of ["Chegou", "Receber encomenda", "Correspondência"]) {
    const el = page.getByRole(name === "Receber encomenda" ? "link" : "button", { name }).first()
    const box = await el.boundingBox()
    expect(box!.height, name).toBeGreaterThanOrEqual(56)
  }
})

// Spec 005: segurança (T046) — telas e as duas telas cheias, nas quatro aparências.
const TELAS_005: { conta: AccountKey; papel?: "manager"; url: string }[] = [
  { conta: "responsible", url: "/resident/" },
  { conta: "responsible", url: "/resident/emergency/" },
  { conta: "responsible", url: "/resident/contacts/" },
  { conta: "front-desk", url: "/front-desk/general-alert/" },
  { conta: "front-desk", url: "/front-desk/emergency-alert/" },
  { conta: "front-desk", url: "/front-desk/contacts/" },
  { conta: "front-desk", url: "/front-desk/profile/" },
  { conta: "manager", papel: "manager", url: "/manager/contacts/" },
  { conta: "manager", papel: "manager", url: "/manager/contacts/edit/" },
  { conta: "manager", papel: "manager", url: "/manager/emergency-alert/" },
]

async function auditar(page: import("@playwright/test").Page, highContrast: boolean) {
  const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]
  if (highContrast) tags.push("wcag2aaa")
  const result = await new AxeBuilder({ page }).withTags(tags).exclude("[vw]").analyze()
  return result.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)
}

for (const aparencia of APARENCIAS) {
  test.describe(`acessibilidade (spec 005) — ${aparencia.nome}`, () => {
    test.skip(({ browserName }) => browserName !== "chromium", "auditoria só no Chromium")
    for (const tela of TELAS_005) {
      test(`${tela.conta} ${tela.url}`, async ({ page }) => {
        await withPrefs(page, aparencia.prefs)
        await signInAs(page, tela.conta, tela.papel)
        await page.goto(tela.url)
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
        await page.waitForLoadState("networkidle")
        expect(await auditar(page, aparencia.prefs.highContrast)).toEqual([])
      })
    }

    test("telas cheias de emergência e de alerta geral", async ({ page }) => {
      // Segunda às 10:00 em Brasília: Jonas, a conta da portaria, está de plantão.
      await page.clock.setFixedTime(new Date("2026-11-16T13:00:00Z"))
      await withPrefs(page, aparencia.prefs)
      await signInAs(page, "responsible")
      await page.goto("/resident/emergency/")
      const botao = page.getByRole("button", { name: /^segure/i })
      await botao.hover()
      await page.mouse.down()
      await page.waitForTimeout(3_400)
      await page.mouse.up()
      await expect(page.getByRole("heading", { name: "Alerta enviado!" })).toBeVisible()
      expect(await auditar(page, aparencia.prefs.highContrast)).toEqual([])

      await signInAs(page, "front-desk")
      await page.goto("/front-desk/")
      const alerta = page.getByRole("alertdialog")
      await expect(alerta).toBeVisible()
      expect(await auditar(page, aparencia.prefs.highContrast)).toEqual([])
      // Botões da tela cheia com pelo menos 56 px (RF-021).
      for (const name of ["Estou indo", "SAMU"]) {
        const box = await alerta
          .getByRole(name === "SAMU" ? "link" : "button", { name })
          .boundingBox()
        expect(box!.height, name).toBeGreaterThanOrEqual(56)
      }
      await alerta.getByRole("button", { name: "Estou indo" }).click()
      await alerta.getByRole("button", { name: "Resolvido" }).click()
      await expect(alerta).toBeHidden()

      await page.goto("/front-desk/general-alert/")
      await page.getByLabel("Mensagem").fill("Teste de alerta geral")
      await page.getByRole("button", { name: "Enviar alerta geral" }).click()
      await page.getByRole("button", { name: "Sim, enviar" }).click()
      await expect(page.getByRole("button", { name: "Encerrar alerta" })).toBeVisible()
      expect(await auditar(page, aparencia.prefs.highContrast)).toEqual([])

      await signInAs(page, "responsible")
      await page.goto("/resident/")
      const geral = page.getByRole("alertdialog")
      await expect(geral).toBeVisible()
      expect(await auditar(page, aparencia.prefs.highContrast)).toEqual([])
      const entendi = await geral.getByRole("button", { name: "Entendi" }).boundingBox()
      expect(entendi!.height).toBeGreaterThanOrEqual(56)
    })
  })
}
