import { beforeEach, describe, expect, it } from "vitest"
import { code, commSetup, outbox, repoOf } from "./comm-helpers"
import type { CodeInput } from "@/services/contracts"

// Histórias 1 e 2: entregas (RF-001 a RF-010, esclarecimento 1, CS-004, CS-005).
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})
const ifood = (patch: Partial<CodeInput> = {}): CodeInput => ({
  store: "ifood",
  code: "4821",
  note: null,
  onArrival: "elevator",
  confirmDuplicate: true,
  ...patch,
})
const PHOTO = "data:image/jpeg;base64,/9j/AAAA"

describe("códigos de entrega — História 1", () => {
  it("quem pode cadastrar cadastra; todos do apto veem; outro apto não vê", async () => {
    const d = await env.services.deliveries.registerCode(env.family, ifood({ code: "7777" }))
    expect(d).toMatchObject({ apartment: "804", status: "awaiting", origin: "app", code: "7777" })
    expect(
      (await env.services.deliveries.mine(env.resident)).awaiting.some((x) => x.id === d.id),
    ).toBe(true)
    // A síndica mora no 1201: não vê as entregas do 804, nem como síndica.
    const repo = await repoOf(env)
    const sindicaMorador = {
      ...env.manager,
      actor: {
        ...env.manager.actor!,
        role: await (async () => {
          const [r] = await repo.byIndex("residencies", "byPerson", env.ids.manager)
          return {
            kind: "resident" as const,
            condominiumId: env.manager.condominiumId,
            residencyId: r.id,
            apartmentId: r.apartmentId,
          }
        })(),
      },
    }
    expect(
      (await env.services.deliveries.mine(sindicaMorador)).awaiting.some((x) => x.id === d.id),
    ).toBe(false)
    expect(await code(env.services.deliveries.mine(env.manager))).toBe("forbidden")
    expect(await code(env.services.deliveries.mine(env.frontDesk))).toBe("forbidden")
  })

  it("sem a permissão não cadastra (RF-001)", async () => {
    const repo = await repoOf(env)
    const [r] = await repo.byIndex("residencies", "byPerson", env.ids.family)
    await repo.put("residencies", { ...r, canRegisterDeliveries: false })
    expect(await code(env.services.deliveries.registerCode(env.family, ifood()))).toBe("forbidden")
    // Mas continua vendo.
    expect(await code(env.services.deliveries.mine(env.family))).toBe("ok")
  })

  it('valida código e loja "Outro"', async () => {
    const det = async (i: CodeInput) =>
      (await env.services.deliveries.registerCode(env.resident, i).catch((e) => e)).details
    expect(await det(ifood({ code: "" }))).toEqual({ code: "invalid" })
    expect(await det(ifood({ code: "48 21" }))).toEqual({ code: "invalid" })
    expect(await det(ifood({ code: "x".repeat(31) }))).toEqual({ code: "invalid" })
    expect(await det(ifood({ store: "other", storeName: "" }))).toEqual({ storeName: "required" })
    expect(
      (
        await env.services.deliveries.registerCode(
          env.resident,
          ifood({ store: "other", storeName: "Farmácia" }),
        )
      ).storeName,
    ).toBe("Farmácia")
  })

  it("avisa de código repetido no mesmo dia e aceita com confirmação", async () => {
    await env.services.deliveries.registerCode(
      env.resident,
      ifood({ store: "shopee", confirmDuplicate: false }),
    )
    const e = await env.services.deliveries
      .registerCode(env.resident, ifood({ store: "shopee", code: "9999", confirmDuplicate: false }))
      .catch((x) => x)
    expect(e.details).toEqual({ code: "duplicate" })
    expect(
      await code(
        env.services.deliveries.registerCode(
          env.resident,
          ifood({ store: "shopee", code: "9999" }),
        ),
      ),
    ).toBe("ok")
  })

  it("cancela o código e some da portaria", async () => {
    const d = await env.services.deliveries.registerCode(env.resident, ifood({ code: "1111" }))
    await env.services.deliveries.cancelCode(env.resident, d.id)
    expect(
      (await env.services.deliveries.byApartment(env.frontDesk, "804")).some((x) => x.id === d.id),
    ).toBe(false)
  })

  it("chegada: elevador e me ligar viram Entregue; portaria vira Na portaria", async () => {
    const elevador = await env.services.deliveries.registerCode(
      env.resident,
      ifood({ code: "2001" }),
    )
    const ligar = await env.services.deliveries.registerCode(
      env.resident,
      ifood({ code: "2002", onArrival: "call" }),
    )
    const portaria = await env.services.deliveries.registerCode(
      env.resident,
      ifood({ code: "2003", onArrival: "front-desk" }),
    )
    expect(await code(env.services.deliveries.markArrived(env.resident, elevador.id))).toBe(
      "forbidden",
    )
    expect((await env.services.deliveries.markArrived(env.frontDesk, elevador.id)).status).toBe(
      "delivered",
    )
    expect((await env.services.deliveries.markArrived(env.frontDesk, ligar.id)).status).toBe(
      "delivered",
    )
    const p = await env.services.deliveries.markArrived(env.frontDesk, portaria.id)
    expect(p.status).toBe("at-desk")
    expect(p.receivedBy).toBe("Jonas Siqueira")
  })

  it("avisa só quem cadastrou e o responsável, nunca no grupo (esclarecimento 1, CS-004)", async () => {
    const repo = await repoOf(env)
    const apt804 = (await repo.byIndex("residencies", "byPerson", env.ids.resident))[0].apartmentId
    const moradores = (await repo.byIndex("residencies", "byApartment", apt804)).map(
      (r) => r.personId,
    )
    expect(moradores.length).toBeGreaterThanOrEqual(3)
    const grupoAntes = (await outbox(env.services, "group")).length
    const d = await env.services.deliveries.registerCode(env.family, ifood({ code: "3003" }))
    await env.services.deliveries.markArrived(env.frontDesk, d.id)
    const avisados = (await repo.all("notifications"))
      .filter((n) => n.target?.id === d.id)
      .map((n) => n.personId)
      .sort()
    expect(avisados).toEqual([env.ids.family, env.ids.resident].sort())
    expect((await outbox(env.services, "group")).length).toBe(grupoAntes)
    const privados = (await outbox(env.services, "private")).filter((m) => m.body.includes("3003"))
    expect(privados).toHaveLength(2)
  })
})

describe("encomendas sem código e correspondência — História 2", () => {
  it("a portaria recebe com foto e avisa todos do apartamento", async () => {
    const d = await env.services.deliveries.receive(env.frontDesk, {
      apartmentNumber: "804",
      size: "medium",
      store: "amazon",
      photo: PHOTO,
      notifyResident: true,
    })
    expect(d).toMatchObject({
      status: "at-desk",
      origin: "front-desk",
      photo: PHOTO,
      daysAtDesk: 0,
    })
    const repo = await repoOf(env)
    const apt804 = (await repo.byIndex("residencies", "byPerson", env.ids.resident))[0].apartmentId
    const ativos = (await repo.byIndex("residencies", "byApartment", apt804)).length
    const avisados = (await repo.all("notifications")).filter((n) => n.target?.id === d.id)
    expect(avisados).toHaveLength(ativos)
    expect(avisados[0].body).toContain("foto")
  })

  it("sem avisar não manda nada; apto inexistente; foto inválida; só a portaria", async () => {
    const d = await env.services.deliveries.receive(env.frontDesk, {
      apartmentNumber: "804",
      size: "small",
      store: "shopee",
      photo: null,
      notifyResident: false,
    })
    const repo = await repoOf(env)
    expect((await repo.all("notifications")).filter((n) => n.target?.id === d.id)).toHaveLength(0)
    const base = {
      size: "small" as const,
      store: "shopee" as const,
      photo: null,
      notifyResident: true,
    }
    expect(
      await code(
        env.services.deliveries.receive(env.frontDesk, { ...base, apartmentNumber: "999" }),
      ),
    ).toBe("not_found")
    expect(
      await code(
        env.services.deliveries.receive(env.frontDesk, {
          ...base,
          apartmentNumber: "804",
          photo: "data:image/png;base64,AA",
        }),
      ),
    ).toBe("validation")
    expect(
      await code(
        env.services.deliveries.receive(env.resident, { ...base, apartmentNumber: "804" }),
      ),
    ).toBe("forbidden")
  })

  it("retirada pelo app ou pela portaria, com quem e quando", async () => {
    const base = {
      apartmentNumber: "804",
      size: "large" as const,
      store: "correios" as const,
      photo: null,
      notifyResident: true,
    }
    const a = await env.services.deliveries.receive(env.frontDesk, base)
    env.advance(60_000)
    const retirada = await env.services.deliveries.pickUp(env.family, a.id)
    expect(retirada).toMatchObject({ status: "picked-up", pickedUpAt: env.clock.now.toISOString() })
    expect(retirada.pickedUpBy).toBeTruthy()
    const b = await env.services.deliveries.receive(env.frontDesk, base)
    expect(
      await code(env.services.deliveries.registerPickup(env.frontDesk, b.id, env.ids.manager)),
    ).toBe("validation")
    const pelaPortaria = await env.services.deliveries.registerPickup(
      env.frontDesk,
      b.id,
      env.ids.resident,
    )
    expect(pelaPortaria.status).toBe("picked-up")
    const c = await env.services.deliveries.receive(env.frontDesk, {
      ...base,
      apartmentNumber: "803",
    })
    expect(await code(env.services.deliveries.pickUp(env.resident, c.id))).toBe("not_found")
    const { done } = await env.services.deliveries.mine(env.resident)
    expect(done.filter((x) => x.status === "picked-up").length).toBeGreaterThanOrEqual(2)
  })

  it("correspondência avisa todos sem dizer o que é", async () => {
    const d = await env.services.deliveries.mail(env.frontDesk, "804")
    const [n] = (await env.services.notifications.list(env.family)).filter(
      (x) => x.target?.id === d.id,
    )
    expect(n.type).toBe("mail")
    expect(n.body).toBe("Chegou correspondência para você na portaria.")
  })
})
