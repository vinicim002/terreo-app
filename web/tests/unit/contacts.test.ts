import { beforeEach, describe, expect, it } from "vitest"
import { code, commSetup } from "./comm-helpers"

// Spec 005, História 3: contatos importantes (RF-014 a RF-017; esclarecimento 2).
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})

describe("lista", () => {
  it("dois grupos: portaria, síndico e porteiro-chefe do cadastro; emergência e serviços", async () => {
    const { building, emergency } = await env.services.contacts.list(env.resident)
    expect(building.map((c) => c.role ?? c.name)).toEqual(["Portaria", "manager", "head-doorman"])
    expect(building[0]).toMatchObject({
      frontDesk: true,
      description: "24h",
      display: "(00) 3333-1000",
    })
    expect(building[2].name).toBe("Jonas Siqueira")
    expect(emergency.map((c) => c.name)).toEqual([
      "SAMU",
      "Bombeiros",
      "Polícia Militar",
      "Defesa Civil",
      "Light (energia)",
      "Naturgy (gás)",
      "Águas do Rio",
    ])
    expect(emergency[0]).toMatchObject({ phone: "192", isMobile: false })
  })

  it("celular do síndico e do porteiro-chefe só com autorização", async () => {
    let { building } = await env.services.contacts.list(env.resident)
    expect(building[1]).toMatchObject({ phone: null, display: null, isMobile: false })
    expect(await env.services.contacts.showMyPhone(env.manager)).toBe(false)
    await env.services.contacts.setShowMyPhone(env.manager, true)
    await env.services.contacts.setShowMyPhone(env.frontDesk, true) // Jonas é o porteiro-chefe
    ;({ building } = await env.services.contacts.list(env.resident))
    expect(building[1].phone).toMatch(/^\+5500/)
    expect(building[1].isMobile).toBe(true)
    expect(building[2].phone).toMatch(/^\+5500/)
    expect(await env.services.contacts.showMyPhone(env.manager)).toBe(true)
  })

  it("só síndico e porteiro-chefe autorizam mostrar o celular", async () => {
    expect(await code(env.services.contacts.setShowMyPhone(env.resident, true))).toBe("forbidden")
    const { signIn } = await import("./auth-helpers")
    const outroPorteiro = await signIn(env.services, "+5500900009002", "aparelho-caio")
    expect(await code(env.services.contacts.setShowMyPhone(outroPorteiro.ctx, true))).toBe(
      "forbidden",
    )
  })

  it("busca sem acento por nome e descrição", async () => {
    const r = await env.services.contacts.list(env.resident, "luz")
    expect([...r.building, ...r.emergency].map((c) => c.name)).toEqual(["Light (energia)"])
    const energia = await env.services.contacts.list(env.resident, "energia")
    expect(energia.emergency.map((c) => c.name)).toEqual(["Light (energia)"])
    const agua = await env.services.contacts.list(env.resident, "AGUA")
    expect(agua.emergency.map((c) => c.name)).toEqual(["Águas do Rio"])
    const gas = await env.services.contacts.list(env.resident, "gás")
    expect(gas.emergency.map((c) => c.name)).toEqual(["Naturgy (gás)"])
    expect((await env.services.contacts.list(env.resident, "192")).emergency[0].name).toBe("SAMU")
  })
})

describe("manter (só síndico)", () => {
  it("acrescenta, edita, reordena e remove", async () => {
    const novo = await env.services.contacts.save(env.manager, {
      group: "emergency",
      name: "Chaveiro 24h",
      description: "Seu Zé",
      phone: "(21) 98765-4321",
    })
    expect(novo).toMatchObject({
      phone: "+5521987654321",
      isMobile: true,
      display: "(21) 98765-4321",
    })
    let { emergency } = await env.services.contacts.list(env.family)
    expect(emergency.at(-1)?.name).toBe("Chaveiro 24h")

    await env.services.contacts.save(env.manager, {
      ...novo,
      id: novo.id!,
      phone: "2133334444",
      description: null,
    })
    ;({ emergency } = await env.services.contacts.list(env.family))
    expect(emergency.at(-1)).toMatchObject({ phone: "+552133334444", isMobile: false })

    const ids = emergency.map((c) => c.id!)
    await env.services.contacts.reorder(env.manager, "emergency", [
      ids.at(-1)!,
      ...ids.slice(0, -1),
    ])
    ;({ emergency } = await env.services.contacts.list(env.family))
    expect(emergency[0].name).toBe("Chaveiro 24h")
    expect(await code(env.services.contacts.reorder(env.manager, "emergency", ids.slice(1)))).toBe(
      "validation",
    )

    await env.services.contacts.remove(env.manager, novo.id!)
    ;({ emergency } = await env.services.contacts.list(env.family))
    expect(emergency.some((c) => c.name === "Chaveiro 24h")).toBe(false)
  })

  it("valida nome 2–60, descrição até 60 e número discável", async () => {
    const base = { group: "emergency" as const, name: "Chaveiro", description: null, phone: "192" }
    expect(await code(env.services.contacts.save(env.manager, { ...base, name: "X" }))).toBe(
      "validation",
    )
    expect(
      await code(env.services.contacts.save(env.manager, { ...base, name: "x".repeat(61) })),
    ).toBe("validation")
    expect(
      await code(env.services.contacts.save(env.manager, { ...base, description: "x".repeat(61) })),
    ).toBe("validation")
    expect(await code(env.services.contacts.save(env.manager, { ...base, phone: "12345" }))).toBe(
      "validation",
    )
  })

  it("no máximo um número da portaria", async () => {
    await env.services.contacts.save(env.manager, {
      group: "building",
      name: "Portaria nova",
      description: null,
      phone: "(21) 3333-2000",
      frontDesk: true,
    })
    const manual = await env.services.contacts.manual(env.manager)
    expect(manual.filter((c) => c.frontDesk).map((c) => c.name)).toEqual(["Portaria nova"])
  })

  it("moradores e portaria só veem", async () => {
    const input = { group: "emergency" as const, name: "Chaveiro", description: null, phone: "192" }
    expect(await code(env.services.contacts.save(env.resident, input))).toBe("forbidden")
    expect(await code(env.services.contacts.save(env.frontDesk, input))).toBe("forbidden")
    const [c] = await env.services.contacts.manual(env.manager)
    expect(await code(env.services.contacts.remove(env.frontDesk, c.id!))).toBe("forbidden")
    expect(await code(env.services.contacts.manual(env.resident))).toBe("forbidden")
  })
})

describe("editar sem mudar o número", () => {
  it("mantém o número fictício dos dados de exemplo", async () => {
    const [portaria] = (await env.services.contacts.manual(env.manager)).filter((c) => c.frontDesk)
    const v = await env.services.contacts.save(env.manager, {
      id: portaria.id!,
      group: "building",
      name: "Portaria",
      description: "24 horas",
      phone: portaria.display!,
      frontDesk: true,
    })
    expect(v).toMatchObject({ phone: portaria.phone, description: "24 horas", frontDesk: true })
  })
})
