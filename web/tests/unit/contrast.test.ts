import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

// RF-018: AA (≥ 4,5) nos temas claro e escuro; AAA (≥ 7) com alto contraste.
const css = readFileSync(join(__dirname, "../../src/theme/tokens.css"), "utf8")

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`Seletor não encontrado: ${selector}`)
  const body = css.slice(start, css.indexOf("}", start))
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]),
  )
}

const light = block(':root[data-theme="light"]')
const appearances = {
  claro: light,
  escuro: { ...light, ...block(':root[data-theme="dark"]') },
  "claro com alto contraste": { ...light, ...block(':root[data-contrast="high"]') },
  "escuro com alto contraste": {
    ...light,
    ...block(':root[data-theme="dark"]'),
    ...block(':root[data-contrast="high"]'),
    ...block(':root[data-theme="dark"][data-contrast="high"]'),
  },
}

const PAIRS: [string, string][] = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["link", "background"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "muted"],
  ["muted-foreground", "background"],
  ["accent-foreground", "accent"],
  ["destructive-foreground", "destructive"],
  ["destructive", "background"],
  ["warning", "warning-background"],
  ["nav-foreground", "nav-background"],
  ["nav-active", "nav-pill"],
]

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

describe("cores da marca (terreo-kit)", () => {
  it("usa o laranja #E8590C nos elementos grandes e #C2410C, da mesma família, nos botões e textos", () => {
    for (const nome of ["claro", "escuro"] as const) {
      expect(appearances[nome].brand).toBe("#e8590c")
      expect(appearances[nome]["brand-foreground"]).toBe("#ffffff")
      expect(appearances[nome].primary).toBe("#c2410c")
      expect(appearances[nome]["primary-foreground"]).toBe("#ffffff")
    }
    expect(appearances.claro.background).toBe("#ffffff")
    expect(appearances.claro.secondary).toBe("#f4eee2") // creme
    expect(appearances.claro["secondary-foreground"]).toBe("#7a4e35") // marrom
  })

  // Ícones sobre o laranja não são texto: mínimo 3,0 (WCAG 1.4.11).
  it.each(Object.entries(appearances))("ícones sobre o laranja — %s ≥ 3", (_nome, tokens) => {
    expect(contrast(tokens["brand-foreground"], tokens.brand)).toBeGreaterThanOrEqual(3)
  })
})

describe.each(Object.entries(appearances))("contraste — %s", (nome, tokens) => {
  const minimo = nome.includes("alto contraste") ? 7 : 4.5
  it.each(PAIRS)(`%s sobre %s ≥ ${minimo}`, (texto, fundo) => {
    expect(tokens[texto], texto).toBeDefined()
    expect(tokens[fundo], fundo).toBeDefined()
    expect(contrast(tokens[texto], tokens[fundo])).toBeGreaterThanOrEqual(minimo)
  })
})
