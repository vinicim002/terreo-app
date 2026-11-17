import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import pt from "../../messages/pt.json"
import { PROFILES_DEF, hubGroups, titleKey } from "@/navigation/screens"
import { PROFILES } from "@/preferences/types"

const NAV_ESPERADA = {
  resident: ["", "deliveries", "suggestions", "profile"],
  "front-desk": ["", "deliveries", "visitors", "more"],
  manager: ["", "notices", "residents", "more"],
}

function texto(path: string): unknown {
  return path.split(".").reduce<unknown>((n, k) => (n as Record<string, unknown>)?.[k], pt)
}

describe.each(PROFILES)("catálogo de telas — %s", (profile) => {
  const def = PROFILES_DEF[profile]

  it("tem slugs únicos", () => {
    const slugs = def.screens.map((s) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it("tem a barra de baixo de contracts/rotas.md, na ordem", () => {
    expect(def.nav).toEqual(NAV_ESPERADA[profile])
    for (const slug of def.nav) expect(def.screens.some((s) => s.slug === slug)).toBe(true)
  })

  it("tem título em português para toda tela", () => {
    for (const s of def.screens) {
      const key = s.slug === "" ? titleKey(profile, "") : `screens.${s.slug}`
      expect(typeof texto(key), key).toBe("string")
    }
    for (const g of def.groups) expect(typeof texto(`groups.${g}`), g).toBe("string")
  })

  it("alcança toda tela em no máximo 2 toques a partir do início (CS-001)", () => {
    const naBarra = new Set(def.nav)
    const noHub = new Set(hubGroups(profile).flatMap((g) => g.screens.map((s) => s.slug)))
    const doCabecalho = new Set(["notifications", "accessibility"]) // sino e atalho em toda tela
    for (const s of def.screens) {
      const alcancavel =
        naBarra.has(s.slug) || noHub.has(s.slug) || doCabecalho.has(s.slug) || s.slug === def.hub
      expect(alcancavel, s.slug).toBe(true)
    }
    // O hub fica a 1 toque: na barra (portaria e síndico) ou no início (morador).
    expect(naBarra.has(def.hub) || profile === "resident").toBe(true)
  })
})

describe("cobertura das funcionalidades (RF-007)", () => {
  // Cada funcionalidade do capítulo "Funcionalidades" e o slug que a representa no catálogo.
  const FUNCIONALIDADES: Record<string, string[]> = {
    "Login sem senha": ["welcome"],
    "Cadastro de apartamentos": ["residents"],
    "Convite de moradores": ["invite"],
    Perfil: ["profile"],
    "Boas-vindas e regras": ["welcome", "rules"],
    "Avisos do prédio": ["notices"],
    Calendário: ["calendar"],
    "Reuniões do conselho": ["meetings"],
    Enquetes: ["polls"],
    Notificações: ["notifications"],
    "Entregas e códigos": ["deliveries", "receive-delivery"],
    Correspondência: ["mail"],
    "Visitantes e prestadores": ["visitors"],
    "Modo viagem": ["travel-mode", "travel-watch"],
    "Funcionários de plantão": ["on-duty", "schedule"],
    "Falar em vez de escrever": ["dictate"],
    "Achados e perdidos": ["lost-and-found"],
    Sugestões: ["suggestions"],
    Melhorias: ["improvements"],
    "Avisar problema": ["report-issue", "issues"],
    "Aviso de barulho": ["noise-report", "noise-reports"],
    "Prestadores indicados": ["providers"],
    "Comércio do bairro": ["local-shops"],
    "Pesquisa de satisfação": ["satisfaction-survey", "satisfaction"],
    "Botão de emergência": ["emergency", "emergency-alert"],
    "Alerta geral": ["general-alert"],
    "Contatos importantes": ["contacts"],
    "Mudanças e obras": ["moves"],
    "Pedido de controle ou chave": ["key-request", "key-requests"],
    Advertências: ["warnings"],
    "Prestação de contas": ["finances"],
    "Resumo do mês": ["monthly-report"],
    "Lembretes da rotina": ["reminders"],
    "Perguntas frequentes": ["faq"],
    "Apartamento disponível": ["listings"],
    Acessibilidade: ["accessibility"],
  }
  const todos = new Set(PROFILES.flatMap((p) => PROFILES_DEF[p].screens.map((s) => s.slug)))

  it.each(Object.entries(FUNCIONALIDADES))("%s tem tela", (_nome, slugs) => {
    for (const slug of slugs) expect(todos.has(slug), slug).toBe(true)
  })

  it("lista todas as funcionalidades do capítulo da documentação", () => {
    const capitulo = readFileSync(
      join(__dirname, "../../../docs/documentacao/02-funcionalidades.md"),
      "utf8",
    )
    const nomes = [
      ...capitulo.matchAll(/^\| ([^|]+?) \| [^|]+ \| (?:Planejada|Em construção|Pronta) \|$/gm),
    ].map((m) => m[1])
    expect(nomes.length).toBeGreaterThan(30)
    for (const nome of nomes) expect(Object.keys(FUNCIONALIDADES), nome).toContain(nome)
  })
})

describe("comunicação na portaria (spec 003, contracts/rotas.md)", () => {
  it("tem avisos e agenda no grupo de comunicação do Mais", () => {
    const grupo = hubGroups("front-desk").find((g) => g.group === "communication")!
    expect(grupo.screens.map((s) => s.slug)).toEqual(["notices", "calendar"])
  })
})
