import { describe, expect, it } from "vitest"
import { PHONE, setup, signIn } from "./auth-helpers"

// Spec 002, História 2 (RF-010 a RF-013).
describe("primeiro acesso", () => {
  it("convite pendente precisa de boas-vindas e regras; depois, não mais", async () => {
    const { services } = setup()
    const { session, ctx } = await signIn(services, PHONE.pending, "aparelho-p1")
    expect(session.needsWelcome && session.needsRulesAcceptance).toBe(true)
    await services.onboarding.markWelcomeSeen(ctx)
    await services.onboarding.acceptRules(ctx)
    const depois = await services.auth.current("aparelho-p1")
    expect(depois).toMatchObject({ needsWelcome: false, needsRulesAcceptance: false })
  })

  it("a confirmação das regras vale em outro aparelho (RF-011)", async () => {
    const { services, advance } = setup()
    const { ctx } = await signIn(services, PHONE.pending, "aparelho-p1")
    await services.onboarding.markWelcomeSeen(ctx)
    await services.onboarding.acceptRules(ctx)
    advance(61_000)
    const outro = await signIn(services, PHONE.pending, "aparelho-p2")
    expect(outro.session.needsRulesAcceptance).toBe(false)
  })

  it("porteiro e síndico não passam pelo primeiro acesso do morador (RF-013)", async () => {
    const { services } = setup()
    const porteiro = await signIn(services, PHONE["front-desk"], "aparelho-f1")
    expect(porteiro.session).toMatchObject({ needsWelcome: false, needsRulesAcceptance: false })
    const sindica = await signIn(services, PHONE.manager, "aparelho-m1", "manager")
    expect(sindica.session).toMatchObject({ needsWelcome: false, needsRulesAcceptance: false })
  })
})

describe("regras", () => {
  it("agrupadas por tema, na ordem, para todos os papéis (RF-012)", async () => {
    const { services } = setup()
    const { ctx } = await signIn(services, PHONE["front-desk"], "aparelho-f1")
    const grupos = await services.rules.list(ctx)
    expect(grupos.map((g) => g.topic)).toEqual([
      "coexistence",
      "elevator-moves",
      "waste",
      "pets",
      "garage",
      "common-areas",
    ])
    expect(grupos.flatMap((g) => g.rules).length).toBeGreaterThanOrEqual(10)
  })

  it("busca sem acento e sem diferenciar maiúsculas", async () => {
    const { services } = setup()
    const { ctx } = await signIn(services, PHONE.responsible, "aparelho-r1")
    const comAcento = await services.rules.list(ctx, "MUDANÇAS")
    const semAcento = await services.rules.list(ctx, "mudancas")
    expect(comAcento).toEqual(semAcento)
    expect(semAcento.flatMap((g) => g.rules).some((r) => r.title === "Mudanças")).toBe(true)
    expect(await services.rules.list(ctx, "xyzinexistente")).toEqual([])
  })
})
