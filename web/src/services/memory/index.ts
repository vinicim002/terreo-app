// Serviços em memória: usados quando o navegador não deixa usar o IndexedDB (modo anônimo,
// armazenamento bloqueado). Começam com os mesmos dados de exemplo e não sobrevivem ao fechar.
import { createServices, type Repository, type StoreMap, type StoreName } from "../core"
import { buildSeed } from "../local/seed"
import type { Services } from "../contracts"

export function createMemoryRepository(): Repository {
  let data = load()
  function load(): { [S in StoreName]: StoreMap[S][] } {
    const seed = buildSeed()
    return {
      condominiums: [seed.condominium],
      apartments: seed.apartments,
      residents: seed.residents,
      staff: seed.staff,
      shifts: seed.shifts,
    }
  }
  return {
    async byCondominium(store, condominiumId) {
      const rows = data[store] as { id: string; condominiumId?: string }[]
      return rows.filter(
        (r) => (store === "condominiums" ? r.id : r.condominiumId) === condominiumId,
      ) as never
    },
    async get(store, id) {
      return (data[store] as { id: string }[]).find((r) => r.id === id) as never
    },
    async resetSeed() {
      data = load()
    },
  }
}

export function createMemoryServices(): Services {
  return createServices(createMemoryRepository())
}
