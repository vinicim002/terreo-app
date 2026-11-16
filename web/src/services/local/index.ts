// Repositório local sobre IndexedDB. Se o IndexedDB não puder ser aberto, cai para a implementação em
// memória (caso-limite da spec 001) e avisa por onFallback.
import type { Repository } from "../base"
import { createMemoryRepository } from "../memory"
import { ensureSeeded, openTerreoDB, type TerreoDB } from "./db"
import { createServices, type ServiceOptions } from "../core"
import type { Services } from "../contracts"

export function createLocalRepository(onFallback?: () => void): Repository {
  let memory: Repository | null = null
  const dbPromise: Promise<TerreoDB | null> = (async () => {
    try {
      return await openTerreoDB()
    } catch {
      memory = createMemoryRepository()
      onFallback?.()
      return null
    }
  })()

  return {
    async byIndex(store, index, value) {
      const db = await dbPromise
      if (!db) return memory!.byIndex(store, index, value)
      return (await db.getAllFromIndex(store, index, value)) as never
    },
    async get(store, id) {
      const db = await dbPromise
      if (!db) return memory!.get(store, id)
      return (await db.get(store, id)) as never
    },
    async all(store) {
      const db = await dbPromise
      if (!db) return memory!.all(store)
      return (await db.getAll(store)) as never
    },
    async put(store, value) {
      const db = await dbPromise
      if (!db) return memory!.put(store, value)
      await db.put(store, value)
    },
    async remove(store, id) {
      const db = await dbPromise
      if (!db) return memory!.remove(store, id)
      await db.delete(store, id)
    },
    async resetSeed() {
      const db = await dbPromise
      if (!db) return memory!.resetSeed()
      await ensureSeeded(db, true)
    },
  }
}

export function createLocalServices(
  options: ServiceOptions & { onFallback?: () => void } = {},
): Services {
  return createServices(createLocalRepository(options.onFallback), options)
}
