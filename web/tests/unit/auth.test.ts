import { describe, expect, it } from "vitest"
import { PHONE, setup } from "./auth-helpers"

// Spec 002, História 1 e RF-002/RF-003/RF-009 (research R3).
const MIN = 60_000
const DEVICE = "aparelho-teste-1"

describe("pedido de código", () => {
  it("número desconhecido: unknown e nenhum código criado", async () => {
    const { services } = setup()
    expect(await services.auth.requestCode("+5521987654321")).toEqual({ status: "unknown" })
    expect(await services.outbox!.latestTo("+5521987654321")).toBeNull()
  })

  it("envia código de 6 dígitos pelo WhatsApp simulado, guardando só o hash", async () => {
    const { services } = setup()
    const r = await services.auth.requestCode(PHONE.responsible)
    expect(r).toMatchObject({ status: "sent", phone: PHONE.responsible })
    const msg = await services.outbox!.latestTo(PHONE.responsible)
    expect(msg!.kind).toBe("otp")
    expect(msg!.body).toContain("123456")
    expect(msg!.body).toMatch(/\b\d{6}\b/)
  })

  it("expira em 10 minutos", async () => {
    const { services, advance } = setup()
    await services.auth.requestCode(PHONE.responsible)
    advance(10 * MIN + 1)
    expect(await services.auth.verifyCode(PHONE.responsible, "123456", DEVICE)).toEqual({
      status: "expired",
    })
  })

  it("5 erros invalidam o código", async () => {
    const { services } = setup()
    await services.auth.requestCode(PHONE.responsible)
    for (let i = 4; i >= 0; i--) {
      expect(await services.auth.verifyCode(PHONE.responsible, "000000", DEVICE)).toEqual({
        status: "wrong",
        attemptsLeft: i,
      })
    }
    expect(await services.auth.verifyCode(PHONE.responsible, "123456", DEVICE)).toEqual({
      status: "expired",
    })
  })

  it("reenvio só depois de 60 s, e o novo código invalida o anterior", async () => {
    const { services, advance, setCode } = setup()
    await services.auth.requestCode(PHONE.responsible)
    await expect(services.auth.requestCode(PHONE.responsible)).rejects.toMatchObject({
      code: "rate_limited",
    })
    advance(MIN)
    setCode("654321")
    await services.auth.requestCode(PHONE.responsible)
    expect(await services.auth.verifyCode(PHONE.responsible, "123456", DEVICE)).toMatchObject({
      status: "wrong",
    })
    expect(await services.auth.verifyCode(PHONE.responsible, "654321", DEVICE)).toMatchObject({
      status: "ok",
    })
  })

  it("no máximo 5 pedidos por hora", async () => {
    const { services, advance } = setup()
    for (let i = 0; i < 5; i++) {
      await services.auth.requestCode(PHONE.responsible)
      advance(MIN)
    }
    await expect(services.auth.requestCode(PHONE.responsible)).rejects.toMatchObject({
      code: "rate_limited",
      details: { retry: "hour" },
    })
  })

  it("pessoa removida recebe a mesma resposta de número desconhecido (RF-009)", async () => {
    const { services } = setup()
    const { signIn } = await import("./auth-helpers")
    const { ctx } = await signIn(services, PHONE.responsible)
    const familia = (
      await services.residents.listByApartment(
        ctx,
        (ctx.actor!.role as { apartmentId: string }).apartmentId,
      )
    ).find((r) => r.phone === PHONE.family)!
    await services.residents.remove(ctx, familia.residencyId)
    expect(await services.auth.requestCode(PHONE.family)).toEqual({ status: "unknown" })
  })

  it("convite pendente entra e passa a ativo", async () => {
    const { services } = setup()
    await services.auth.requestCode(PHONE.pending)
    const r = await services.auth.verifyCode(PHONE.pending, "123456", DEVICE)
    expect(r.status).toBe("ok")
    if (r.status === "ok") {
      expect(r.session.needsWelcome).toBe(true)
      expect(r.session.needsRulesAcceptance).toBe(true)
    }
  })

  it("número inválido é recusado antes de qualquer coisa", async () => {
    const { services } = setup("real")
    await expect(services.auth.requestCode(PHONE.responsible)).rejects.toMatchObject({
      code: "validation",
    })
  })
})

describe("atalho de testes: esquecer códigos (spec 003)", () => {
  it("permite pedir de novo sem esperar, só fora do modo real", async () => {
    const { services } = setup()
    await services.auth.requestCode(PHONE.responsible)
    await expect(services.auth.requestCode(PHONE.responsible)).rejects.toMatchObject({
      code: "rate_limited",
    })
    await services.dev.forgetCodes(PHONE.responsible)
    expect((await services.auth.requestCode(PHONE.responsible)).status).toBe("sent")
    const real = setup("real").services
    await expect(real.dev.forgetCodes(PHONE.responsible)).rejects.toMatchObject({
      code: "forbidden",
    })
  })
})
