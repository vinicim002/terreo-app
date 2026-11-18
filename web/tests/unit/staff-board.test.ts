import { describe, expect, it } from "vitest"
import { commSetup } from "./comm-helpers"
import { brasiliaToIso } from "@/i18n/datetime"

// História 5: equipe de plantão pela escala (RF-020, CS-007). Escala de exemplo (spec 001):
// 06–14: dom Pedro, seg–sex Jonas, sáb Caio · 14–22: dom Jonas, seg–qui Caio, sex Pedro, sáb Jonas ·
// 22–06: dom Caio, seg–qui Pedro, sex Caio, sáb Pedro · limpeza seg–sáb a partir das 8h.
describe("equipe de plantão", () => {
  it("segunda 09:00: Jonas na portaria e as duas faxineiras", async () => {
    const env = await commSetup()
    const { now, next } = await env.services.staff.board(
      env.resident,
      new Date(brasiliaToIso("2026-11-16", "09:00")),
    )
    expect(now.filter((s) => s.role === "doorman").map((s) => s.name)).toEqual(["Jonas Siqueira"])
    expect(
      now
        .filter((s) => s.role === "cleaner")
        .map((s) => s.name)
        .sort(),
    ).toEqual(["Lia Barreto", "Marta Souto"])
    expect(now[0].role).toBe("doorman")
    // Próximos: Caio às 14h, Pedro às 22h, e os de amanhã, em ordem.
    expect(next[0]).toMatchObject({
      name: "Caio Antunes",
      startsAt: brasiliaToIso("2026-11-16", "14:00"),
    })
    expect(next[1]).toMatchObject({
      name: "Pedro Rangel",
      startsAt: brasiliaToIso("2026-11-16", "22:00"),
    })
    const datas = next.map((s) => s.startsAt)
    expect([...datas].sort()).toEqual(datas)
    expect(datas.every((d) => d < brasiliaToIso("2026-11-18", "00:00"))).toBe(true)
  })

  it("vira a meia-noite: o turno de sábado 22–06 continua no domingo de madrugada (CS-007)", async () => {
    const env = await commSetup()
    const sabado = await env.services.staff.board(
      env.resident,
      new Date(brasiliaToIso("2026-11-21", "23:30")),
    )
    const domingo = await env.services.staff.board(
      env.resident,
      new Date(brasiliaToIso("2026-11-22", "03:00")),
    )
    for (const b of [sabado, domingo]) {
      expect(b.now.map((s) => s.name)).toEqual(["Pedro Rangel"])
      expect(b.now[0].startsAt).toBe(brasiliaToIso("2026-11-21", "22:00"))
      expect(b.now[0].endsAt).toBe(brasiliaToIso("2026-11-22", "06:00"))
    }
  })

  it("todos os perfis veem", async () => {
    const env = await commSetup()
    for (const ctx of [env.resident, env.frontDesk, env.manager])
      expect((await env.services.staff.board(ctx, new Date())).now.length).toBeGreaterThan(0)
  })
})
