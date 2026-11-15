// Serviços locais sobre IndexedDB. Se o IndexedDB não puder ser aberto, caem para a
// implementação em memória (caso-limite da spec) e avisam por onStorageFallback.
import type { IDBPDatabase } from "idb"
import { createServices, type Repository } from "../core"
import type { Services } from "../contracts"
import { createMemoryRepository } from "../memory"
import { ensureSeeded, openTerreoDB, type TerreoDB } from "./db"

export function createLocalRepository(onFallback?: () => void): Repository {
  let memory: Repository | null = null
  const dbPromise: Promise<IDBPDatabase<TerreoDB> | null> = (async () => {
    try {
      return await openTerreoDB()
    } catch {
      memory = createMemoryRepository()
      onFallback?.()
      return null
    }
  })()

  return {
    async byCondominium(store, condominiumId) {
      const db = await dbPromise
      if (!db) return memory!.byCondominium(store, condominiumId)
      return (await db.getAllFromIndex(store, "byCondominium", condominiumId as never)) as never
    },
    async get(store, id) {
      const db = await dbPromise
      if (!db) return memory!.get(store, id)
      return (await db.get(store, id)) as never
    },
    async resetSeed() {
      const db = await dbPromise
      if (!db) return memory!.resetSeed()
      await ensureSeeded(db, true)
    },
  }
}

export function createLocalServices(onFallback?: () => void): Services {
  return createServices(createLocalRepository(onFallback))
}
