import { describe, expect, it } from "vitest"
import { createMemoryServices } from "@/services/memory"
import { TAQUARETINGA_ID } from "@/services/local/seed"
import { createLocalServices } from "@/services/local"

const ctx = { condominiumId: TAQUARETINGA_ID }

describe("serviços em memória (armazenamento indisponível)", () => {
  it("têm os mesmos dados de exemplo", async () => {
    const services = createMemoryServices()
    expect(await services.dev.counts(ctx)).toMatchObject({ apartments: 48, staff: 5, shifts: 33 })
    expect((await services.apartments.getByNumber(ctx, "101")).floor).toBe(1)
  })

  it("são usados quando o IndexedDB falha", async () => {
    const original = globalThis.indexedDB
    // Simula modo anônimo / armazenamento bloqueado.
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      get() {
        throw new Error("SecurityError")
      },
    })
    try {
      const services = createLocalServices()
      expect(await services.dev.counts(ctx)).toMatchObject({ apartments: 48 })
    } finally {
      Object.defineProperty(globalThis, "indexedDB", {
        configurable: true,
        value: original,
        writable: true,
      })
    }
  })
})
