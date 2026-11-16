import { describe, expect, it } from "vitest"
import { sha256Fallback, sha256Hex, uuid } from "@/lib/crypto"

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")

describe("criptografia fora de contexto seguro", () => {
  it.each([
    ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
    ["a".repeat(1000), "41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3"],
  ])("SHA-256 de reserva confere com o padrão (%#)", async (texto, esperado) => {
    expect(hex(sha256Fallback(new TextEncoder().encode(texto)))).toBe(esperado)
    expect(await sha256Hex(texto)).toBe(esperado)
  })

  it("gera UUID v4 válido", () => {
    expect(uuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })
})
