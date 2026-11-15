// Banco IndexedDB do aparelho (research R5). Os dados de exemplo são criados uma única vez
// por versão (SEED_VERSION), numa só transação, para que duas abas não dupliquem nada.
import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import { STORES, type StoreMap, type StoreName } from "../core"
import type { SeedMeta } from "../schemas"
import { SEED_VERSION, buildSeed } from "./seed"

export const DB_NAME = "terreo"
const DB_VERSION = 1

type StoreSchema<S extends StoreName> = {
  key: string
  value: StoreMap[S]
  indexes: { byCondominium: string }
}

export interface TerreoDB extends DBSchema {
  condominiums: StoreSchema<"condominiums">
  apartments: StoreSchema<"apartments">
  residents: StoreSchema<"residents">
  staff: StoreSchema<"staff">
  shifts: StoreSchema<"shifts">
  meta: { key: string; value: SeedMeta }
}

export async function openTerreoDB(): Promise<IDBPDatabase<TerreoDB>> {
  const db = await openDB<TerreoDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      for (const store of STORES) {
        const os = database.createObjectStore(store, { keyPath: "id" })
        // No condomínio, o índice é o próprio id; nos demais, condominiumId.
        os.createIndex("byCondominium", store === "condominiums" ? "id" : "condominiumId")
      }
      database.createObjectStore("meta")
    },
  })
  await ensureSeeded(db)
  return db
}

export async function ensureSeeded(db: IDBPDatabase<TerreoDB>, force = false) {
  const tx = db.transaction([...STORES, "meta"], "readwrite")
  const meta = await tx.objectStore("meta").get("seed")
  if (!force && meta?.version === SEED_VERSION) {
    await tx.done
    return
  }
  const seed = buildSeed()
  const rows: { [S in StoreName]: StoreMap[S][] } = {
    condominiums: [seed.condominium],
    apartments: seed.apartments,
    residents: seed.residents,
    staff: seed.staff,
    shifts: seed.shifts,
  }
  for (const store of STORES) {
    const os = tx.objectStore(store)
    await os.clear()
    for (const row of rows[store]) await os.put(row as never)
  }
  await tx
    .objectStore("meta")
    .put({ version: SEED_VERSION, seededAt: new Date().toISOString() }, "seed")
  await tx.done
}
