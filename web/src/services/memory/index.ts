// Repositório em memória: usado quando o navegador não deixa usar o IndexedDB (modo anônimo,
// armazenamento bloqueado). Começa com os mesmos dados de exemplo e não sobrevive ao fechar.
import { INDEXES, type Repository, type StoreMap, type StoreName } from "../base"
import { seedRows } from "../local/db"
import { createServices, type ServiceOptions } from "../core"
import type { Services } from "../contracts"

export function createMemoryRepository(): Repository {
  let data = seedRows()
  const rows = <S extends StoreName>(store: S) => data[store] as StoreMap[S][]
  const clone = <T>(value: T): T => structuredClone(value)
  return {
    async byIndex(store, index, value) {
      const field = INDEXES[store][index]
      if (!field) throw new Error(`Índice ${index} não existe em ${store}`)
      return rows(store)
        .filter((r) => (r as Record<string, unknown>)[field] === value)
        .map(clone)
    },
    async get(store, id) {
      const found = rows(store).find((r) => (r as { id: string }).id === id)
      return found ? clone(found) : undefined
    },
    async all(store) {
      return rows(store).map(clone)
    },
    async put(store, value) {
      const list = rows(store)
      const i = list.findIndex((r) => (r as { id: string }).id === (value as { id: string }).id)
      if (i >= 0) list[i] = clone(value)
      else list.push(clone(value))
    },
    async remove(store, id) {
      const list = rows(store)
      const i = list.findIndex((r) => (r as { id: string }).id === id)
      if (i >= 0) list.splice(i, 1)
    },
    async resetSeed() {
      data = seedRows()
    },
  }
}

export function createMemoryServices(options: ServiceOptions = {}): Services {
  return createServices(createMemoryRepository(), options)
}
