import { describe, expect, it } from "vitest"
import { can, type Action, type ActorInfo, type Target } from "@/services/permissions"

// contracts/permissoes.md da spec 005 — uma asserção por célula (CS-006).
const A = "apto-804"
const B = "apto-805"
const responsavel: ActorInfo = {
  kind: "resident",
  personId: "resp",
  apartmentId: A,
  isResponsible: true,
}
const outroMorador: ActorInfo = {
  kind: "resident",
  personId: "fam1",
  apartmentId: A,
  isResponsible: false,
}
const portaria: ActorInfo = { kind: "front-desk", personId: "porteiro", isHeadDoorman: false }
const chefe: ActorInfo = { kind: "front-desk", personId: "chefe", isHeadDoorman: true }
const sindico: ActorInfo = { kind: "manager", personId: "sindico" }

const proprio: Target = { apartmentId: A }
const outro: Target = { apartmentId: B }
const doFam1: Target = { apartmentId: A, createdById: "fam1" }
const doResp: Target = { apartmentId: A, createdById: "resp" }
const doPorteiro: Target = { createdById: "porteiro" }

type D = "ok" | "forbidden" | "not_found"
type Linha = [Action, Target, D, D, D, D, D]
//   ação                   alvo        responsável  outro morador  portaria  porteiro-chefe  síndico
const MATRIZ: Linha[] = [
  ["emergency.raise", proprio, "ok", "ok", "forbidden", "forbidden", "forbidden"],
  ["emergency.raise", outro, "not_found", "not_found", "forbidden", "forbidden", "forbidden"],
  ["emergency.viewOwn", proprio, "ok", "ok", "forbidden", "forbidden", "forbidden"],
  ["emergency.viewOwn", outro, "not_found", "not_found", "forbidden", "forbidden", "forbidden"],
  ["emergency.cancel", doFam1, "ok", "ok", "forbidden", "forbidden", "forbidden"],
  ["emergency.cancel", doResp, "ok", "forbidden", "forbidden", "forbidden", "forbidden"],
  [
    "emergency.cancel",
    { apartmentId: B, createdById: "x" },
    "not_found",
    "not_found",
    "forbidden",
    "forbidden",
    "forbidden",
  ],
  ["emergency.viewAll", {}, "forbidden", "forbidden", "ok", "ok", "ok"],
  ["emergency.respond", {}, "forbidden", "forbidden", "ok", "ok", "forbidden"],
  ["generalAlert.view", {}, "ok", "ok", "ok", "ok", "ok"],
  ["generalAlert.send", {}, "forbidden", "forbidden", "ok", "ok", "ok"],
  ["generalAlert.close", doPorteiro, "forbidden", "forbidden", "ok", "forbidden", "ok"],
  ["contacts.view", {}, "ok", "ok", "ok", "ok", "ok"],
  ["contacts.manage", {}, "forbidden", "forbidden", "forbidden", "forbidden", "ok"],
  ["contacts.showOwnPhone", {}, "forbidden", "forbidden", "forbidden", "ok", "ok"],
]

describe("matriz de permissões da spec 005", () => {
  const atores = [responsavel, outroMorador, portaria, chefe, sindico]
  const nomes = ["responsável", "outro morador", "portaria", "porteiro-chefe", "síndico"]
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
