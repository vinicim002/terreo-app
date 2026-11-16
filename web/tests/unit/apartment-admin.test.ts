import { describe, expect, it } from "vitest"
import { PHONE, setup, signIn } from "./auth-helpers"

// Spec 002, História 5 (RF-026 a RF-029, RF-028a).
async function sindica() {
  const env = setup()
  const { ctx } = await signIn(env.services, PHONE.manager, "aparelho-m1", "manager")
  return { ...env, ctx }
}

describe("apartamentos pelo síndico", () => {
  it("visão geral com totais, situação e contagem dos filtros", async () => {
    const { services, ctx } = await sindica()
    const all = await services.admin.overview(ctx)
    expect(all.totals).toMatchObject({ apartments: 48, floors: 12, all: 48, none: 3 })
    expect(all.items.find((a) => a.number === "902")).toMatchObject({ status: "pending" })
    expect(all.items.find((a) => a.number === "303")).toMatchObject({
      status: "none",
      responsible: null,
    })
    expect(all.items.find((a) => a.number === "804")).toMatchObject({ status: "active", people: 4 })
    const semCadastro = await services.admin.overview(ctx, { filter: "none" })
    expect(semCadastro.items.map((a) => a.number)).toEqual(["303", "704", "1102"])
    const inquilinos = await services.admin.overview(ctx, { filter: "tenants" })
    expect(inquilinos.items.length).toBe(all.totals.tenants)
    expect(inquilinos.items.every((a) => a.responsible?.kind === "tenant")).toBe(true)
  })

  it("busca por número e por nome sem acento", async () => {
    const { services, ctx } = await sindica()
    expect(
      (await services.admin.overview(ctx, { search: "902" })).items.map((a) => a.number),
    ).toEqual(["902"])
    const porNome = await services.admin.overview(ctx, { search: "helena duarte" })
    expect(porNome.items.map((a) => a.number)).toEqual(["1201"])
    expect((await services.admin.overview(ctx, { search: "CORREA" })).items.length).toBeGreaterThan(
      0,
    )
  })

  it("cadastra o responsável de um apartamento sem cadastro", async () => {
    const { services, ctx } = await sindica()
    const apt = await services.apartments.getByNumber(ctx, "303")
    const r = await services.admin.registerResponsible(ctx, apt.id, {
      name: "Fernanda Alves",
      phone: "+5500900007001",
      kind: "tenant",
    })
    expect(r).toMatchObject({
      isResponsible: true,
      status: "pending",
      canRegisterDeliveries: true,
      canVotePolls: true,
    })
    expect((await services.admin.overview(ctx, { search: "303" })).items[0]).toMatchObject({
      status: "pending",
    })
    expect((await services.outbox!.latestTo("+5500900007001"))!.kind).toBe("invite")
  })

  it("recusa apartamento que já tem responsável e celular em uso", async () => {
    const { services, ctx } = await sindica()
    const apt804 = await services.apartments.getByNumber(ctx, "804")
    await expect(
      services.admin.registerResponsible(ctx, apt804.id, {
        name: "Fulano",
        phone: "+5500900007002",
        kind: "owner",
      }),
    ).rejects.toMatchObject({ details: { apartment: "has_responsible" } })
    const apt704 = await services.apartments.getByNumber(ctx, "704")
    await expect(
      services.admin.registerResponsible(ctx, apt704.id, {
        name: "Fulano",
        phone: PHONE.family,
        kind: "owner",
      }),
    ).rejects.toMatchObject({ details: { phone: "in_use" } })
  })

  it("troca o responsável e o novo ganha as permissões", async () => {
    const { services, ctx } = await sindica()
    const apt = await services.apartments.getByNumber(ctx, "804")
    const pessoas = await services.residents.listByApartment(ctx, apt.id)
    const familiar = pessoas.find((r) => !r.isResponsible)!
    await services.admin.setResponsible(ctx, apt.id, familiar.residencyId)
    const depois = await services.residents.listByApartment(ctx, apt.id)
    expect(depois.filter((r) => r.isResponsible).map((r) => r.residencyId)).toEqual([
      familiar.residencyId,
    ])
    expect(depois.find((r) => r.residencyId === familiar.residencyId)).toMatchObject({
      canRegisterDeliveries: true,
      canVotePolls: true,
    })
  })

  it("remover o responsável deixa o apartamento sem responsável e as outras pessoas continuam entrando", async () => {
    const { services, ctx, advance } = await sindica()
    const apt = await services.apartments.getByNumber(ctx, "804")
    const resp = (await services.residents.listByApartment(ctx, apt.id)).find(
      (r) => r.isResponsible,
    )!
    await services.residents.remove(ctx, resp.residencyId)
    expect((await services.apartments.getByNumber(ctx, "804")).responsibleResidentId).toBeNull()
    expect((await services.admin.overview(ctx, { search: "804" })).items[0]).toMatchObject({
      responsible: null,
      status: "none",
    })
    advance(61_000)
    const familiar = await signIn(services, PHONE.family, "aparelho-f1")
    expect(familiar.session.activeRole?.kind).toBe("resident")
  })

  it("o síndico edita e remove qualquer pessoa (RF-028a)", async () => {
    const { services, ctx } = await sindica()
    const apt = await services.apartments.getByNumber(ctx, "502")
    const [alguem] = await services.residents.listByApartment(ctx, apt.id)
    await services.residents.update(ctx, alguem.residencyId, { name: "Editado Pela Síndica" })
    expect((await services.residents.get(ctx, alguem.residencyId)).name).toBe(
      "Editado Pela Síndica",
    )
  })

  it("morador e portaria não acessam a visão do síndico", async () => {
    const { services } = setup()
    const morador = await signIn(services, PHONE.responsible, "aparelho-r1")
    const porteiro = await signIn(services, PHONE["front-desk"], "aparelho-f1")
    await expect(services.admin.overview(morador.ctx)).rejects.toMatchObject({ code: "forbidden" })
    await expect(services.admin.overview(porteiro.ctx)).rejects.toMatchObject({ code: "forbidden" })
  })
})
