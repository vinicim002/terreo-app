import { beforeEach, describe, expect, it } from "vitest"
import { code, commSetup, outbox } from "./comm-helpers"

// História 6: achados e perdidos (RF-021 a RF-023).
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})
const PHOTO = "data:image/jpeg;base64,/9j/AAAA"

describe("achados e perdidos", () => {
  it('a portaria registra; todos veem; "é meu" avisa a portaria só no app; devolvido', async () => {
    const a = await env.services.lostFound.registerFound(env.frontDesk, {
      description: "Chaveiro com 3 chaves",
      place: "Hall do elevador",
      photo: PHOTO,
    })
    for (const ctx of [env.resident, env.family, env.manager, env.frontDesk])
      expect((await env.services.lostFound.list(ctx)).found.some((x) => x.id === a.id)).toBe(true)
    const reclamado = await env.services.lostFound.claim(env.family, a.id)
    expect(reclamado).toMatchObject({ status: "claimed", apartment: "804", mine: true })
    const [n] = (await env.services.notifications.list(env.frontDesk)).filter(
      (x) => x.target?.id === a.id,
    )
    expect(n).toMatchObject({ type: "lost-found" })
    expect(n.body).toContain("804")
    expect((await outbox(env.services, "private")).some((x) => x.body.includes("Chaveiro"))).toBe(
      false,
    )
    expect(await code(env.services.lostFound.claim(env.resident, a.id))).toBe("validation")
    const devolvido = await env.services.lostFound.markReturned(env.frontDesk, a.id, "804")
    expect(devolvido.status).toBe("returned")
    const lista = await env.services.lostFound.list(env.resident)
    expect(lista.found.some((x) => x.id === a.id)).toBe(false)
    expect(lista.returned.some((x) => x.id === a.id)).toBe(true)
  })

  it("morador avisa perdido; a portaria encontra e avisa o dono", async () => {
    const p = await env.services.lostFound.reportLost(env.resident, {
      description: "Óculos de grau",
      place: "Garagem",
    })
    expect(p).toMatchObject({ kind: "lost", status: "open", apartment: "804", mine: true })
    expect(
      (await env.services.notifications.list(env.frontDesk)).some((x) => x.target?.id === p.id),
    ).toBe(true)
    await env.services.lostFound.markFound(env.frontDesk, p.id)
    const [n] = (await env.services.notifications.list(env.family)).filter(
      (x) => x.target?.id === p.id,
    )
    expect(n.body).toContain("Busque na portaria")
  })

  it("permissões", async () => {
    const input = { description: "Guarda-chuva", place: null, photo: null }
    expect(await code(env.services.lostFound.registerFound(env.resident, input))).toBe("forbidden")
    expect(await code(env.services.lostFound.registerFound(env.manager, input))).toBe("forbidden")
    expect(
      await code(
        env.services.lostFound.reportLost(env.frontDesk, { description: "Bola", place: null }),
      ),
    ).toBe("forbidden")
    expect(
      await code(
        env.services.lostFound.registerFound(env.frontDesk, { ...input, description: "ab" }),
      ),
    ).toBe("validation")
  })

  it("achados com mais de 60 dias somem para os moradores", async () => {
    const a = await env.services.lostFound.registerFound(env.frontDesk, {
      description: "Boné azul",
      place: null,
      photo: null,
    })
    env.advance(61 * 86_400_000)
    expect((await env.services.lostFound.list(env.resident)).found.some((x) => x.id === a.id)).toBe(
      false,
    )
    expect(
      (await env.services.lostFound.list(env.frontDesk)).found.some((x) => x.id === a.id),
    ).toBe(true)
  })
})
