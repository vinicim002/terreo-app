// Banco IndexedDB do aparelho (research R5 da 001; versão 2 do banco na spec 002).
// Os dados de exemplo são criados uma única vez por SEED_VERSION, numa só transação, para que duas abas não
// dupliquem nada. Sessões, códigos e mensagens simuladas também são apagados ao recriar.
import { openDB, type IDBPDatabase } from "idb"
import { INDEXES, STORES, type StoreMap, type StoreName } from "../base"
import { SEED_VERSION, buildSeed } from "./seed"

export const DB_NAME = "terreo"
const DB_VERSION = 2

// O esquema do idb é tipado de forma solta aqui: as lojas e índices vêm de INDEXES (base.ts).
export type TerreoDB = IDBPDatabase<unknown>

export async function openTerreoDB(): Promise<TerreoDB> {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Dados só de exemplo: na mudança de versão, recria todas as lojas.
      for (const name of Array.from(database.objectStoreNames)) database.deleteObjectStore(name)
      for (const store of STORES) {
        const os = database.createObjectStore(store, { keyPath: "id" })
        for (const [index, field] of Object.entries(INDEXES[store])) os.createIndex(index, field!)
      }
      database.createObjectStore("meta")
    },
  })
  await ensureSeeded(db)
  return db
}

export function seedRows(): { [S in StoreName]: StoreMap[S][] } {
  const seed = buildSeed()
  return {
    condominiums: [seed.condominium],
    apartments: seed.apartments,
    people: seed.people,
    residencies: seed.residencies,
    staff: seed.staff,
    managers: seed.managers,
    shifts: seed.shifts,
    vehicles: seed.vehicles,
    pets: seed.pets,
    emergencyContacts: seed.emergencyContacts,
    rules: seed.rules,
    otpRequests: [],
    sessions: [],
    outbox: [],
  }
}

export async function ensureSeeded(db: TerreoDB, force = false) {
  const tx = db.transaction([...STORES, "meta"], "readwrite")
  const meta = (await tx.objectStore("meta").get("seed")) as { version?: number } | undefined
  if (!force && meta?.version === SEED_VERSION) {
    await tx.done
    return
  }
  const rows = seedRows()
  for (const store of STORES) {
    const os = tx.objectStore(store)
    await os.clear()
    for (const row of rows[store]) await os.put(row)
  }
  await tx
    .objectStore("meta")
    .put({ version: SEED_VERSION, seededAt: new Date().toISOString() }, "seed")
  await tx.done
}
