import { describe, expect, it } from "vitest"
import { PHONE, setup, signIn } from "./auth-helpers"

// Spec 002, RF-029a e CS-007a: a portaria só vê nome, foto, tipo e carros.
describe("consulta da portaria", () => {
  it("devolve só as chaves permitidas", async () => {
    const { services } = setup()
    const { ctx } = await signIn(services, PHONE["front-desk"], "aparelho-f1")
    const entry = await services.directory.apartment(ctx, "804")
    expect(Object.keys(entry).sort()).toEqual(["number", "people", "vehicles"])
    expect(entry.people.length).toBe(4)
    for (const p of entry.people) expect(Object.keys(p).sort()).toEqual(["kind", "name", "photo"])
    for (const v of entry.vehicles)
      expect(Object.keys(v).sort()).toEqual(["color", "model", "plate"])
    expect(JSON.stringify(entry)).not.toMatch(/\+55|Thor|phone|canVote|status/)
  })

  it("não mostra pendentes nem removidos", async () => {
    const { services } = setup()
    const { ctx } = await signIn(services, PHONE["front-desk"], "aparelho-f1")
    expect((await services.directory.apartment(ctx, "902")).people).toEqual([])
  })

  it("morador e síndico não usam a consulta da portaria", async () => {
    const { services } = setup()
    const morador = await signIn(services, PHONE.responsible, "aparelho-r1")
    const sindica = await signIn(services, PHONE.manager, "aparelho-m1", "manager")
    await expect(services.directory.apartment(morador.ctx, "804")).rejects.toMatchObject({
      code: "forbidden",
    })
    await expect(services.directory.apartment(sindica.ctx, "804")).rejects.toMatchObject({
      code: "forbidden",
    })
  })
})
