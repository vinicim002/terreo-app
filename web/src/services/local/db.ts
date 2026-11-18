// Banco IndexedDB do aparelho (research R5 da 001; versão 2 na spec 002; 3 na spec 003; 4 na spec 004).
// Os dados de exemplo são criados uma única vez por SEED_VERSION, numa só transação, para que duas abas não
// dupliquem nada. Sessões, códigos e mensagens simuladas também são apagados ao recriar.
import { openDB, type IDBPDatabase } from "idb"
import { INDEXES, STORES, type StoreMap, type StoreName } from "../base"
import { SEED_VERSION, buildSeed } from "./seed"

export const DB_NAME = "terreo"
const DB_VERSION = 4

// O esquema do idb é tipado de forma solta aqui: as lojas e índices vêm de INDEXES (base.ts).
export type TerreoDB = IDBPDatabase<unknown>

export async function openTerreoDB(now: () => Date = () => new Date()): Promise<TerreoDB> {
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
  await ensureSeeded(db, false, now)
  return db
}

/** Linhas dos dados de exemplo; as datas da comunicação são relativas a `now` (spec 003, research R8). */
export function seedRows(now: Date = new Date()): { [S in StoreName]: StoreMap[S][] } {
  const seed = buildSeed(now)
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
    notices: seed.notices,
    noticeReads: seed.noticeReads,
    polls: seed.polls,
    pollVotes: seed.pollVotes,
    pollSuggestions: seed.pollSuggestions,
    meetings: seed.meetings,
    agendaEvents: seed.agendaEvents,
    notifications: [...seed.notifications, ...seed.frontDeskNotifications],
    notificationPrefs: [],
    deliveries: seed.deliveries,
    visitors: seed.visitors,
    travelModes: seed.travelModes,
    memos: seed.memos,
    lostItems: seed.lostItems,
    inboundMessages: seed.inboundMessages,
  }
}

export async function ensureSeeded(
  db: TerreoDB,
  force = false,
  now: () => Date = () => new Date(),
) {
  const tx = db.transaction([...STORES, "meta"], "readwrite")
  const meta = (await tx.objectStore("meta").get("seed")) as { version?: number } | undefined
  if (!force && meta?.version === SEED_VERSION) {
    await tx.done
    return
  }
  const rows = seedRows(now())
  for (const store of STORES) {
    const os = tx.objectStore(store)
    await os.clear()
    for (const row of rows[store]) await os.put(row)
  }
  await tx.objectStore("meta").put({ version: SEED_VERSION, seededAt: now().toISOString() }, "seed")
  await tx.done
}
