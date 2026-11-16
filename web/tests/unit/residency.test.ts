import { describe, expect, it } from "vitest"
import { PHONE, setup, signIn } from "./auth-helpers"

// Spec 002, História 3 (RF-014 a RF-019) e contracts/permissoes.md.
const NOVO = "+5500900006001"

async function responsavel() {
  const env = setup()
  const { ctx } = await signIn(env.services, PHONE.responsible, "aparelho-r1")
  const apartmentId = (ctx.actor!.role as { apartmentId: string }).apartmentId
  return { ...env, ctx, apartmentId }
}

describe("pessoas do apartamento", () => {
  it("convite cria pessoa pendente com as permissões escolhidas e mensagem de convite", async () => {
    const { services, ctx } = await responsavel()
    const r = await services.residents.invite(ctx, {
      name: "Antônio Teste",
      phone: NOVO,
      kind: "family",
      canRegisterDeliveries: true,
      canVotePolls: false,
    })
    expect(r).toMatchObject({
      status: "pending",
      isResponsible: false,
      canRegisterDeliveries: true,
      canVotePolls: false,
    })
    const msg = await services.outbox!.latestTo(NOVO)
    expect(msg).toMatchObject({ kind: "invite" })
    expect(msg!.body).toContain("804")
  })

  it("celular já usado no condomínio é recusado (RF-017)", async () => {
    const { services, ctx } = await responsavel()
    await expect(
      services.residents.invite(ctx, {
        name: "Outra",
        phone: PHONE.manager,
        kind: "family",
        canRegisterDeliveries: true,
        canVotePolls: false,
      }),
    ).rejects.toMatchObject({ code: "validation", details: { phone: "in_use" } })
  })

  it("o responsável não remove a si mesmo nem perde as permissões (RF-015a, RF-018)", async () => {
    const { services, ctx, apartmentId } = await responsavel()
    const eu = (await services.residents.listByApartment(ctx, apartmentId)).find(
      (r) => r.isResponsible,
    )!
    await expect(services.residents.remove(ctx, eu.residencyId)).rejects.toMatchObject({
      code: "forbidden",
    })
    await expect(
      services.residents.update(ctx, eu.residencyId, { canVotePolls: false }),
    ).rejects.toMatchObject({ code: "forbidden" })
  })

  it("edita nome, tipo e permissões de outra pessoa", async () => {
    const { services, ctx, apartmentId } = await responsavel()
    const fam = (await services.residents.listByApartment(ctx, apartmentId)).find(
      (r) => r.phone === PHONE.family,
    )!
    const r = await services.residents.update(ctx, fam.residencyId, {
      name: "Novo Nome",
      kind: "tenant",
      canVotePolls: true,
    })
    expect(r).toMatchObject({ name: "Novo Nome", kind: "tenant", canVotePolls: true })
  })

  it("remove pessoa e encerra o acesso dela", async () => {
    const { services, ctx, apartmentId } = await responsavel()
    await signIn(services, PHONE.family, "aparelho-f1")
    const fam = (await services.residents.listByApartment(ctx, apartmentId)).find(
      (r) => r.phone === PHONE.family,
    )!
    await services.residents.remove(ctx, fam.residencyId)
    expect(
      (await services.residents.listByApartment(ctx, apartmentId)).some(
        (r) => r.phone === PHONE.family,
      ),
    ).toBe(false)
    expect(await services.auth.current("aparelho-f1")).toBeNull()
  })

  it("reenvio só para convite pendente", async () => {
    const { services, ctx, apartmentId, advance } = await responsavel()
    const novo = await services.residents.invite(ctx, {
      name: "Pendente Teste",
      phone: NOVO,
      kind: "family",
      canRegisterDeliveries: true,
      canVotePolls: false,
    })
    advance(5 * 60_000)
    const reenviado = await services.residents.resendInvite(ctx, novo.residencyId)
    expect(reenviado.lastInviteAt > novo.lastInviteAt).toBe(true)
    const fam = (await services.residents.listByApartment(ctx, apartmentId)).find(
      (r) => r.phone === PHONE.family,
    )!
    await expect(services.residents.resendInvite(ctx, fam.residencyId)).rejects.toMatchObject({
      code: "validation",
    })
  })

  it("familiar só vê: convidar, editar e remover são recusados (RF-014)", async () => {
    const { services } = setup()
    const { ctx } = await signIn(services, PHONE.family, "aparelho-f1")
    const apartmentId = (ctx.actor!.role as { apartmentId: string }).apartmentId
    const pessoas = await services.residents.listByApartment(ctx, apartmentId)
    expect(pessoas.length).toBeGreaterThan(1)
    const outro = pessoas.find((r) => r.phone !== PHONE.family)!
    await expect(
      services.residents.invite(ctx, {
        name: "X Y",
        phone: NOVO,
        kind: "family",
        canRegisterDeliveries: true,
        canVotePolls: false,
      }),
    ).rejects.toMatchObject({ code: "forbidden" })
    await expect(
      services.residents.update(ctx, outro.residencyId, { name: "Z Z" }),
    ).rejects.toMatchObject({ code: "forbidden" })
    await expect(services.residents.remove(ctx, outro.residencyId)).rejects.toMatchObject({
      code: "forbidden",
    })
  })

  it("não vê nem mexe em outro apartamento (not_found)", async () => {
    const { services, ctx } = await responsavel()
    const { ctx: sindica } = await signIn(services, PHONE.manager, "aparelho-m1", "manager")
    const outroApto = (await services.apartments.getByNumber(sindica, "502")).id
    await expect(services.residents.listByApartment(ctx, outroApto)).rejects.toMatchObject({
      code: "not_found",
    })
    const vizinho = (await services.residents.listByApartment(sindica, outroApto))[0]
    await expect(services.residents.remove(ctx, vizinho.residencyId)).rejects.toMatchObject({
      code: "not_found",
    })
  })
})
