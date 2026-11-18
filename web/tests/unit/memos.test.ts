import { beforeEach, describe, expect, it } from "vitest"
import { code, commSetup, outbox } from "./comm-helpers"

// História 4: recado ditado ao síndico (RF-018).
let env: Awaited<ReturnType<typeof commSetup>>
beforeEach(async () => {
  env = await commSetup()
})

describe("recados da portaria", () => {
  it("a portaria manda; a síndica recebe só no app, vê, marca visto e liga a um aviso", async () => {
    const m = await env.services.memos.send(env.frontDesk, "O elevador social está parado.")
    expect(m).toMatchObject({ author: "Jonas Siqueira", seen: false })
    const [n] = (await env.services.notifications.list(env.manager)).filter(
      (x) => x.target?.id === m.id,
    )
    expect(n).toMatchObject({ type: "memo", body: "O elevador social está parado." })
    expect(
      (await outbox(env.services, "private")).some((x) => x.body.includes("elevador social")),
    ).toBe(false)
    expect((await env.services.memos.list(env.manager))[0].id).toBe(m.id)
    await env.services.memos.markSeen(env.manager, m.id)
    expect((await env.services.memos.get(env.manager, m.id)).seen).toBe(true)
    const aviso = await env.services.notices.create(env.manager, {
      kind: "elevator",
      title: "Elevador social parado",
      body: m.text,
      important: false,
      sendToGroup: true,
      requireConfirmation: false,
      referenceDate: null,
      remindDayBefore: false,
      publishAt: null,
    })
    await env.services.memos.linkNotice(env.manager, m.id, aviso.id)
    expect((await env.services.memos.get(env.manager, m.id)).noticeId).toBe(aviso.id)
  })

  it("valida o texto e as permissões", async () => {
    expect(await code(env.services.memos.send(env.frontDesk, "x"))).toBe("validation")
    expect(await code(env.services.memos.send(env.frontDesk, "x".repeat(1001)))).toBe("validation")
    expect(await code(env.services.memos.send(env.resident, "Oi síndico"))).toBe("forbidden")
    expect(await code(env.services.memos.list(env.frontDesk))).toBe("forbidden")
    expect(await code(env.services.memos.list(env.resident))).toBe("forbidden")
  })
})
