import { describe, expect, it } from "vitest"
import { can, type Action, type ActorInfo, type Target } from "@/services/permissions"

// contracts/permissoes.md da spec 003 — uma asserção por célula (CS-004).
const A = "apto-804"
const responsavel: ActorInfo = {
  kind: "resident",
  personId: "resp",
  apartmentId: A,
  isResponsible: true,
  canVotePolls: true,
}
const comPermissao: ActorInfo = {
  kind: "resident",
  personId: "fam1",
  apartmentId: A,
  isResponsible: false,
  canVotePolls: true,
}
const semPermissao: ActorInfo = {
  kind: "resident",
  personId: "fam2",
  apartmentId: A,
  isResponsible: false,
  canVotePolls: false,
}
const portaria: ActorInfo = { kind: "front-desk", personId: "porteiro" }
const sindico: ActorInfo = { kind: "manager", personId: "sindico" }

const comum: Target = { official: false }
const oficial: Target = { official: true }

type D = "ok" | "forbidden"
type Linha = [Action, Target, D, D, D, D, D]
//   ação                 alvo     responsável  outro c/ perm.  outro s/ perm.  portaria     síndico
const MATRIZ: Linha[] = [
  ["notice.read", {}, "ok", "ok", "ok", "ok", "ok"],
  ["notice.confirm", {}, "ok", "ok", "ok", "forbidden", "ok"],
  ["notice.manage", {}, "forbidden", "forbidden", "forbidden", "forbidden", "ok"],
  ["poll.view", {}, "ok", "ok", "ok", "forbidden", "ok"],
  ["poll.vote", comum, "ok", "ok", "forbidden", "forbidden", "forbidden"],
  ["poll.vote", oficial, "ok", "forbidden", "forbidden", "forbidden", "forbidden"],
  ["poll.suggest", oficial, "forbidden", "ok", "forbidden", "forbidden", "forbidden"],
  ["poll.suggest", comum, "forbidden", "forbidden", "forbidden", "forbidden", "forbidden"],
  ["poll.manage", {}, "forbidden", "forbidden", "forbidden", "forbidden", "ok"],
  ["agenda.read", {}, "ok", "ok", "ok", "ok", "ok"],
  ["agenda.manage", {}, "forbidden", "forbidden", "forbidden", "forbidden", "ok"],
  ["notification.own", {}, "ok", "ok", "ok", "ok", "ok"],
]

describe("matriz de permissões da spec 003", () => {
  const atores = [responsavel, comPermissao, semPermissao, portaria, sindico]
  const nomes = ["responsável", "outro com permissão", "outro sem permissão", "portaria", "síndico"]
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
