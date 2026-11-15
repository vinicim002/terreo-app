import { defineConfig, devices } from "@playwright/test"

// Testes de navegação e preferências rodam contra o `next dev` (porta 3100).
// Testes do build (PWA, demonstração) usam o servidor estático (porta 3200),
// marcados com @build no título.
// E2E_BUILD=1: testes @build contra o build estático, servido pelo próprio Playwright a partir
// de out-current (um link para out/ ou para a "próxima versão" gerada no teste de atualização).
const isBuild = process.env.E2E_BUILD === "1"
const baseURL = isBuild
  ? "http://localhost:3200"
  : (process.env.E2E_BASE_URL ?? "http://localhost:3100")

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // O next dev compila cada página na primeira visita; poucos workers evitam tempo esgotado.
  workers: isBuild ? 1 : 3,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "retain-on-failure", timezoneId: "America/Sao_Paulo", locale: "pt-BR" },
  webServer: isBuild
    ? {
        command: "npx serve out-current -l 3200 --no-clipboard --symlinks",
        url: baseURL,
        reuseExistingServer: true,
      }
    : undefined,
  projects: [
    { name: "pixel-7", use: { ...devices["Pixel 7"] } },
    { name: "iphone-14", use: { ...devices["iPhone 14"] } },
  ],
})
