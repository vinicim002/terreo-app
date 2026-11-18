// Reconhece o código de entrega numa mensagem ao WhatsApp do condomínio (spec 004, research R3, CS-006).
// Função pura: hoje é chamada pela simulação do painel /dev; na Etapa 3, pelo webhook do WhatsApp no servidor.
import type { Store } from "./schemas"

/** Palavras (já sem acento e em minúsculas) de cada loja. */
const STORE_WORDS: Record<string, Store> = {
  ifood: "ifood",
  mercadolivre: "mercado-livre",
  ml: "mercado-livre",
  shopee: "shopee",
  amazon: "amazon",
  correios: "correios",
}

const IGNORED = new Set(["codigo", "cod", "entrega", "pedido", "do", "da", "de", "o", "e", "eh"])

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

export interface ParsedDelivery {
  store: Store
  storeName: string | null
  code: string
}

export function parseDeliveryMessage(text: string): ParsedDelivery | null {
  const tokens = text
    .split(/[\s:,;]+/)
    .map((t) => t.replace(/^[-.]+|[-.]+$/g, ""))
    .filter(Boolean)
  let store: Store = "other"
  const rest: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    const word = fold(tokens[i])
    // "mercado livre" em duas palavras.
    if (word === "mercado" && fold(tokens[i + 1] ?? "") === "livre") {
      store = "mercado-livre"
      i++
      continue
    }
    if (STORE_WORDS[word] && store === "other") {
      store = STORE_WORDS[word]
      continue
    }
    if (!IGNORED.has(word)) rest.push(tokens[i])
  }
  const code = rest.find((t) => /^[A-Za-z0-9-]+$/.test(t))
  if (!code || code.length > 30) return null
  // Sem loja e sem nenhum número: provavelmente não é um código ("oi tudo bem").
  if (store === "other" && !/\d/.test(code)) return null
  return { store, storeName: store === "other" ? "WhatsApp" : null, code }
}
