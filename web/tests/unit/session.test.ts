import { describe, expect, it } from "vitest"
import { PHONE, setup, signIn } from "./auth-helpers"

// Spec 002: RF-004 a RF-007, CS-002, CS-008, CS-009 (research R4).
const DAY = 86_400_000

describe("sessão no aparelho", () => {
  it("continua conectado e atualiza o último uso", async () => {
    const { services, advance } = setup()
    await signIn(services, PHONE.responsible, "aparelho-a1")
    advance(30 * DAY)
    expect((await services.auth.current("aparelho-a1"))?.person.phone).toBe(PHONE.responsible)
    advance(170 * DAY) // 170 dias depois do último uso: ainda vale
    expect(await services.auth.current("aparelho-a1")).not.toBeNull()
  })

  it("181 dias sem abrir: precisa de novo código", async () => {
    const { services, advance } = setup()
    await signIn(services, PHONE.responsible, "aparelho-a1")
    advance(181 * DAY)
    expect(await services.auth.current("aparelho-a1")).toBeNull()
  })

  it("outro aparelho não herda a sessão", async () => {
    const { services } = setup()
    await signIn(services, PHONE.responsible, "aparelho-a1")
    expect(await services.auth.current("aparelho-a2")).toBeNull()
  })

  it("sair encerra a sessão", async () => {
    const { services } = setup()
    await signIn(services, PHONE.responsible, "aparelho-a1")
    await services.auth.signOut("aparelho-a1")
    expect(await services.auth.current("aparelho-a1")).toBeNull()
  })

  it("remover a pessoa encerra as sessões dela em todos os aparelhos (CS-008)", async () => {
    const { services, advance } = setup()
    await signIn(services, PHONE.family, "aparelho-f1")
    advance(61_000)
    await signIn(services, PHONE.family, "aparelho-f2")
    const { ctx } = await signIn(services, PHONE.responsible, "aparelho-r1")
    const apt = (ctx.actor!.role as { apartmentId: string }).apartmentId
    const fam = (await services.residents.listByApartment(ctx, apt)).find(
      (r) => r.phone === PHONE.family,
    )!
    await services.residents.remove(ctx, fam.residencyId)
    expect(await services.auth.current("aparelho-f1")).toBeNull()
    expect(await services.auth.current("aparelho-f2")).toBeNull()
  })

  it("trocar o celular encerra as sessões do número antigo", async () => {
    const { services } = setup()
    await signIn(services, PHONE.family, "aparelho-f1")
    const { ctx } = await signIn(services, PHONE.responsible, "aparelho-r1")
    const apt = (ctx.actor!.role as { apartmentId: string }).apartmentId
    const fam = (await services.residents.listByApartment(ctx, apt)).find(
      (r) => r.phone === PHONE.family,
    )!
    await services.residents.update(ctx, fam.residencyId, { phone: "+5500900007777" })
    expect(await services.auth.current("aparelho-f1")).toBeNull()
  })

  it("quem tem um papel entra direto; a síndica escolhe e troca sem novo código (CS-009)", async () => {
    const { services } = setup()
    const resp = await signIn(services, PHONE.responsible, "aparelho-r1")
    expect(resp.session.activeRole?.kind).toBe("resident")
    const sent = await services.auth.requestCode(PHONE.manager)
    expect(sent.status).toBe("sent")
    const code = (await services.outbox!.latestTo(PHONE.manager))!.body.match(/\d{6}/)![0]
    const r = await services.auth.verifyCode(PHONE.manager, code, "aparelho-m1")
    if (r.status !== "ok") throw new Error()
    expect(r.session.roles.map((x) => x.kind).sort()).toEqual(["manager", "resident"])
    expect(r.session.activeRole).toBeNull()
    const morador = r.session.roles.find((x) => x.kind === "resident")!
    expect(r.session.apartmentNumbers[(morador as { apartmentId: string }).apartmentId]).toBe(
      "1201",
    )
    const comoSindica = await services.auth.chooseRole(
      "aparelho-m1",
      r.session.roles.find((x) => x.kind === "manager")!,
    )
    expect(comoSindica.activeRole?.kind).toBe("manager")
    expect((await services.auth.current("aparelho-m1"))?.activeRole?.kind).toBe("manager")
    const comoMoradora = await services.auth.chooseRole("aparelho-m1", morador)
    expect(comoMoradora.activeRole?.kind).toBe("resident")
  })

  it("papel de outra pessoa é recusado", async () => {
    const { services } = setup()
    const resp = await signIn(services, PHONE.responsible, "aparelho-r1")
    await signIn(services, PHONE.manager, "aparelho-m1", "manager")
    await expect(
      services.auth.chooseRole("aparelho-m1", resp.session.activeRole!),
    ).rejects.toMatchObject({ code: "forbidden" })
  })
})
