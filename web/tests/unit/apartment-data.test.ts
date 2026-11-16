import { describe, expect, it } from "vitest"
import { PHONE, setup, signIn } from "./auth-helpers"

// Spec 002, História 4 (RF-020 a RF-025).
async function como(conta: keyof typeof PHONE) {
  const env = setup()
  const { ctx } = await signIn(env.services, PHONE[conta], `aparelho-${conta}`)
  return { ...env, ctx, apartmentId: (ctx.actor!.role as { apartmentId: string }).apartmentId }
}

describe("dados do apartamento", () => {
  it("cadastra carro com placa Mercosul ou antiga, guardando sem hífen", async () => {
    const { services, ctx, apartmentId } = await como("responsible")
    const v = await services.apartmentData.saveVehicle(ctx, {
      apartmentId,
      plate: "abc-1234",
      model: "Uno",
      color: "Azul",
    })
    expect(v.plate).toBe("ABC1234")
    const m = await services.apartmentData.saveVehicle(ctx, {
      apartmentId,
      plate: "ABC1D23",
      model: "Kwid",
      color: "Preto",
    })
    expect(m.plate).toBe("ABC1D23")
  })

  it("placa inválida ou repetida no prédio é recusada", async () => {
    const { services, ctx, apartmentId } = await como("responsible")
    await expect(
      services.apartmentData.saveVehicle(ctx, {
        apartmentId,
        plate: "AB123",
        model: "X",
        color: "Y",
      }),
    ).rejects.toMatchObject({ details: { plate: "invalid" } })
    // RIO4E56 é do 1201.
    await expect(
      services.apartmentData.saveVehicle(ctx, {
        apartmentId,
        plate: "RIO4E56",
        model: "X",
        color: "Y",
      }),
    ).rejects.toMatchObject({ details: { plate: "in_use" } })
  })

  it("um contato de emergência por apartamento", async () => {
    const { services, ctx, apartmentId } = await como("responsible")
    await services.apartmentData.saveEmergencyContact(ctx, {
      apartmentId,
      name: "Maria Silva",
      relationship: "Irmã",
      phone: "+5500900008001",
    })
    await services.apartmentData.saveEmergencyContact(ctx, {
      apartmentId,
      name: "João Silva",
      relationship: "Irmão",
      phone: "+5500900008002",
    })
    expect(await services.apartmentData.getEmergencyContact(ctx, apartmentId)).toMatchObject({
      name: "João Silva",
    })
    await services.apartmentData.removeEmergencyContact(ctx, apartmentId)
    expect(await services.apartmentData.getEmergencyContact(ctx, apartmentId)).toBeNull()
  })

  it("familiar vê, mas não cadastra carro, animal nem contato", async () => {
    const { services, ctx, apartmentId } = await como("family")
    expect((await services.apartmentData.listVehicles(ctx, apartmentId)).length).toBeGreaterThan(0)
    await expect(
      services.apartmentData.saveVehicle(ctx, {
        apartmentId,
        plate: "XYZ1234",
        model: "X",
        color: "Y",
      }),
    ).rejects.toMatchObject({ code: "forbidden" })
    await expect(
      services.apartmentData.savePet(ctx, { apartmentId, name: "Rex", kind: "dog" }),
    ).rejects.toMatchObject({ code: "forbidden" })
    await expect(
      services.apartmentData.saveEmergencyContact(ctx, {
        apartmentId,
        name: "Fulano",
        relationship: "Pai",
        phone: "+5500900008003",
      }),
    ).rejects.toMatchObject({ code: "forbidden" })
  })

  it("o próprio perfil muda nome e foto, mas não o celular", async () => {
    const { services, ctx } = await como("family")
    const p = await services.people.updateOwnProfile(ctx, {
      name: "Nome Novo",
      photo: "data:image/jpeg;base64,AAAA",
    })
    expect(p).toMatchObject({ name: "Nome Novo", photo: "data:image/jpeg;base64,AAAA" })
    await expect(
      services.people.updateOwnProfile(ctx, { phone: "+5500900008004" } as never),
    ).rejects.toMatchObject({ details: { phone: "readonly" } })
  })

  it("outro apartamento → not_found", async () => {
    const { services, ctx } = await como("responsible")
    const { ctx: sindica } = await signIn(services, PHONE.manager, "aparelho-m1", "manager")
    const apto1201 = (await services.apartments.getByNumber(sindica, "1201")).id
    await expect(services.apartmentData.listVehicles(ctx, apto1201)).rejects.toMatchObject({
      code: "not_found",
    })
    await expect(services.apartmentData.getEmergencyContact(ctx, apto1201)).rejects.toMatchObject({
      code: "not_found",
    })
  })
})
