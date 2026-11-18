import { describe, expect, it } from "vitest"
import { can, type Action, type ActorInfo, type Target } from "@/services/permissions"

// contracts/permissoes.md da spec 004 — uma asserção por célula (CS-005).
const A = "apto-804"
const B = "apto-805"
const responsavel: ActorInfo = {
  kind: "resident",
  personId: "resp",
  apartmentId: A,
  isResponsible: true,
  canRegisterDeliveries: true,
}
const comPermissao: ActorInfo = {
  kind: "resident",
  personId: "fam1",
  apartmentId: A,
  isResponsible: false,
  canRegisterDeliveries: true,
}
const semPermissao: ActorInfo = {
  kind: "resident",
  personId: "fam2",
  apartmentId: A,
  isResponsible: false,
  canRegisterDeliveries: false,
}
const portaria: ActorInfo = { kind: "front-desk", personId: "porteiro" }
const sindico: ActorInfo = { kind: "manager", personId: "sindico" }

const proprio: Target = { apartmentId: A }
const outro: Target = { apartmentId: B }
const doFam2: Target = { apartmentId: A, createdById: "fam2" }

type D = "ok" | "forbidden" | "not_found"
type Linha = [Action, Target, D, D, D, D, D]
//   ação                  alvo      responsável   c/ permissão   s/ permissão   portaria      síndico
const MATRIZ: Linha[] = [
  ["delivery.viewOwn", proprio, "ok", "ok", "ok", "forbidden", "forbidden"],
  ["delivery.viewOwn", outro, "not_found", "not_found", "not_found", "forbidden", "forbidden"],
  ["delivery.register", proprio, "ok", "ok", "forbidden", "forbidden", "forbidden"],
  ["delivery.register", outro, "not_found", "not_found", "not_found", "forbidden", "forbidden"],
  ["delivery.pickUp", proprio, "ok", "ok", "ok", "forbidden", "forbidden"],
  ["delivery.pickUp", outro, "not_found", "not_found", "not_found", "forbidden", "forbidden"],
  ["desk.operate", {}, "forbidden", "forbidden", "forbidden", "ok", "forbidden"],
  ["visitor.viewOwn", proprio, "ok", "ok", "ok", "forbidden", "forbidden"],
  ["visitor.register", proprio, "ok", "ok", "ok", "forbidden", "forbidden"],
  ["visitor.register", outro, "not_found", "not_found", "not_found", "forbidden", "forbidden"],
  ["visitor.cancel", doFam2, "ok", "forbidden", "ok", "forbidden", "forbidden"],
  [
    "visitor.cancel",
    { apartmentId: B, createdById: "x" },
    "not_found",
    "not_found",
    "not_found",
    "forbidden",
    "forbidden",
  ],
  ["travel.viewOwn", proprio, "ok", "ok", "ok", "forbidden", "forbidden"],
  ["travel.set", proprio, "ok", "ok", "forbidden", "forbidden", "forbidden"],
  ["travel.set", outro, "not_found", "not_found", "not_found", "forbidden", "forbidden"],
  ["lostfound.view", {}, "ok", "ok", "ok", "ok", "ok"],
  ["lostfound.claim", {}, "ok", "ok", "ok", "forbidden", "forbidden"],
  ["lostfound.reportLost", {}, "ok", "ok", "ok", "forbidden", "forbidden"],
  ["lostfound.manage", {}, "forbidden", "forbidden", "forbidden", "ok", "forbidden"],
  ["memo.send", {}, "forbidden", "forbidden", "forbidden", "ok", "forbidden"],
  ["memo.manage", {}, "forbidden", "forbidden", "forbidden", "forbidden", "ok"],
  ["staff.board", {}, "ok", "ok", "ok", "ok", "ok"],
]

describe("matriz de permissões da spec 004", () => {
  const atores = [responsavel, comPermissao, semPermissao, portaria, sindico]
  const nomes = ["responsável", "com permissão", "sem permissão", "portaria", "síndico"]
  for (const [acao, alvo, ...esperado] of MATRIZ) {
    atores.forEach((ator, i) => {
      it(`${acao} ${JSON.stringify(alvo)} — ${nomes[i]}: ${esperado[i]}`, () => {
        expect(can(ator, acao, alvo)).toBe(esperado[i])
      })
    })
    it(`${acao} sem ninguém conectado: forbidden`, () => {
      expect(can(null, acao, alvo)).toBe("forbidden")
    })
  }
})
