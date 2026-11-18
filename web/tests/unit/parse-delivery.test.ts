import { describe, expect, it } from "vitest"
import { parseDeliveryMessage } from "@/services/parse-delivery"

// research R3 e CS-006: mensagens no formato "loja código" reconhecidas em pelo menos 95% dos exemplos.
const EXEMPLOS: [string, { store: string; storeName?: string | null; code: string } | null][] = [
  ["iFood 4821", { store: "ifood", code: "4821" }],
  ["ifood: 4821", { store: "ifood", code: "4821" }],
  ["IFOOD 4821", { store: "ifood", code: "4821" }],
  ["código 4821 ifood", { store: "ifood", code: "4821" }],
  ["codigo do ifood é 4821", { store: "ifood", code: "4821" }],
  ["Mercado Livre MLB-73", { store: "mercado-livre", code: "MLB-73" }],
  ["mercado livre: mlb-73", { store: "mercado-livre", code: "mlb-73" }],
  ["mercadolivre MLB73", { store: "mercado-livre", code: "MLB73" }],
  ["ML 1234", { store: "mercado-livre", code: "1234" }],
  ["Shopee BR123", { store: "shopee", code: "BR123" }],
  ["shopee código BR2611ABC", { store: "shopee", code: "BR2611ABC" }],
  ["Amazon 998877", { store: "amazon", code: "998877" }],
  ["entrega amazon 55-12", { store: "amazon", code: "55-12" }],
  ["Correios QB123456789BR", { store: "correios", code: "QB123456789BR" }],
  ["correios: qb123456789br", { store: "correios", code: "qb123456789br" }],
  ["pedido da Shopee 7788", { store: "shopee", code: "7788" }],
  ["4821", { store: "other", storeName: "WhatsApp", code: "4821" }],
  ["cod 9090 iFood", { store: "ifood", code: "9090" }],
  ["  iFood   4821  ", { store: "ifood", code: "4821" }],
  ["Ifood - 4821", { store: "ifood", code: "4821" }],
  ["oi tudo bem", null],
  ["ifood", null],
  ["", null],
  ["amazon " + "A".repeat(31), null],
]

describe("reconhecimento de códigos por mensagem", () => {
  it("acerta pelo menos 95% dos exemplos (CS-006)", () => {
    let acertos = 0
    for (const [texto, esperado] of EXEMPLOS) {
      const r = parseDeliveryMessage(texto)
      const ok =
        esperado === null
          ? r === null
          : !!r && r.store === esperado.store && r.code === esperado.code
      if (ok) acertos++
      else console.log("errou:", texto, r)
    }
    expect(acertos / EXEMPLOS.length).toBeGreaterThanOrEqual(0.95)
  })

  it.each(EXEMPLOS)("%s", (texto, esperado) => {
    const r = parseDeliveryMessage(texto)
    if (esperado === null) expect(r).toBeNull()
    else expect(r).toMatchObject(esperado)
  })
})
