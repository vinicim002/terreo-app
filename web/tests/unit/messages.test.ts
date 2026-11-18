import { describe, expect, it } from "vitest"
import en from "../../messages/en.json"
import es from "../../messages/es.json"
import pt from "../../messages/pt.json"

// RF-014: falha se algum texto existir em um idioma e faltar em outro.
function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

function leaves(obj: object, prefix = ""): [string, string][] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? leaves(v, `${prefix}${k}.`) : [[`${prefix}${k}`, String(v)]],
  )
}

const ptKeys = keys(pt).sort()

const IGUAIS_EM_ESPANHOL = [
  "auth.codeTitle",
  "auth.codeLabel",
  "auth.confirm",
  "auth.resend",
  "auth.cancel",
  "onboarding.next",
  "kinds.tenant",
  "kinds.family",
  "kindLabels.tenant",
  "kindLabels.family",
  "household.kind",
  "household.cancel",
  "household.phone",
  "profile.edit",
  "profile.editTitle",
  "profile.photo",
  "profile.model",
  "profile.petKinds.cat",
  "profile.petKind",
  "profile.cancel",
  "profile.contactPhone",
  "profile.relationship",
  "admin.filters.all",
  "admin.filters.tenants",
  "admin.status.pending",
  // Spec 003
  "screens.noticeEdit",
  "comm.notices.resolveNote",
  "comm.form.chars",
  "comm.pollForm.partial",
  "comm.agenda.upcoming",
  "comm.agenda.recurrence.semiannual",
  "comm.meetings.upcoming",
  "comm.notifications.types.delivery",
  "comm.prefs.types.notices",
  "comm.prefs.types.deliveries",
  // Spec 004
  "screens.apartmentDesk",
  "fd.sizes.large",
  "fd.deliveries.cancel",
  "fd.codeForm.code",
  "fd.desk.search",
  "fd.desk.visitors",
  "fd.desk.grid",
  "fd.desk.codes",
  "fd.receive.apartment",
  "fd.visitors.visit",
  "fd.visitors.cancel",
  "fd.visitors.walkInApartment",
  "fd.visitors.walkInSave",
  "fd.onDuty.next",
  "fd.memos.seen",
  "fd.memos.markSeen",
  "fd.lost.lost",
  "fd.lost.confirm",
  "fd.lost.cancel",
  "fd.lost.reportLost",
  "fd.lost.photo",
]

describe.each([
  ["inglês", en],
  ["espanhol", es],
])("traduções — %s", (_nome, messages) => {
  it("tem exatamente as mesmas chaves do português", () => {
    const outras = keys(messages).sort()
    expect(
      outras.filter((k) => !ptKeys.includes(k)),
      "sobrando",
    ).toEqual([])
    expect(
      ptKeys.filter((k) => !outras.includes(k)),
      "faltando",
    ).toEqual([])
  })

  it("não tem textos vazios", () => {
    for (const [key, value] of leaves(messages)) expect(value.trim(), key).not.toBe("")
  })

  it("está de fato traduzido (não é cópia do português)", () => {
    const ptMap = new Map(leaves(pt))
    // Nomes próprios e palavras iguais nos idiomas podem repetir; o resto não.
    const PERMITIDOS = new Set([
      "common.appName",
      "common.condominium",
      "settings.languages.pt",
      "settings.languages.en",
      "settings.languages.es",
      "settings.libras",
      "phone.country", // "País" é igual em português e espanhol
      ...(_nome === "espanhol" ? ["phone.search"] : []), // "Buscar país"
      "profile.color", // "Color" é igual em inglês e espanhol
      // Spec 004: nomes de lojas, "Envelope" e textos só com parâmetros.
      "fd.stores.ifood",
      "fd.stores.mercado-livre",
      "fd.stores.shopee",
      "fd.stores.amazon",
      "fd.sizes.envelope",
      "fd.onDuty.range",
      "fd.memos.by",
      // Palavras que se escrevem igual em português e espanhol:
      ...(_nome === "espanhol" ? IGUAIS_EM_ESPANHOL : []),
    ])
    const iguais = leaves(messages).filter(
      ([key, value]) => !PERMITIDOS.has(key) && ptMap.get(key) === value,
    )
    expect(iguais.map(([key]) => key)).toEqual([])
  })

  it("mantém os mesmos parâmetros {…} do português", () => {
    const ptMap = new Map(leaves(pt))
    for (const [key, value] of leaves(messages)) {
      // Só nomes de variável: {nome} ou {nome, plural, ...}; os ramos do plural ({hoje}, {# dia}) são texto.
      const params = (s: string) =>
        [
          ...s
            .replace(/(=\d+|zero|one|two|few|many|other)\s*\{[^{}]*\}/g, "")
            .matchAll(/\{(\w+)(?=[},])/g),
        ]
          .map((m) => m[1])
          .filter((n, i, a) => a.indexOf(n) === i)
          .sort()
      expect(params(value), key).toEqual(params(ptMap.get(key) ?? ""))
    }
  })
})
