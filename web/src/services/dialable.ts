// Números discáveis dos contatos (spec 005, research R7): serviços públicos de 3 dígitos (190, 192, 193, 199…),
// 0800 e telefones brasileiros fixos e celulares. Devolve o número para `tel:`, o texto para exibir e se é celular
// (só celulares têm WhatsApp).

export interface Dialable {
  /** Valor guardado e usado no `tel:` (ex.: `192`, `08000210196`, `+5521987654321`). */
  tel: string
  display: string
  isMobile: boolean
}

const onlyDigits = (text: string) => text.replace(/\D/g, "")

/** Formata um telefone brasileiro em E.164 (`+55DDNNNNNNNNN`). Outros países ficam como estão. */
export function displayPhone(tel: string): string {
  if (/^1\d\d$/.test(tel)) return tel
  if (/^0800\d{7}$/.test(tel)) return `0800 ${tel.slice(4, 7)} ${tel.slice(7)}`
  const m = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(tel)
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : tel
}

/** Celular brasileiro: 9 dígitos depois do DDD, começando com 9. */
export function isBrazilianMobile(tel: string) {
  return /^\+55\d{2}9\d{8}$/.test(tel)
}

export function normalizeDialable(text: string): Dialable | null {
  const raw = text.trim()
  if (!raw) return null
  let digits = onlyDigits(raw)
  if (/^1\d\d$/.test(digits)) return { tel: digits, display: digits, isMobile: false }
  if (/^0800\d{7}$/.test(digits))
    return { tel: digits, display: displayPhone(digits), isMobile: false }
  if (raw.startsWith("+")) {
    if (!digits.startsWith("55")) return null // só números do Brasil nesta etapa
    digits = digits.slice(2)
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1) // 0 de longa distância
  }
  if (digits.length === 12 || digits.length === 13) {
    if (!digits.startsWith("55")) return null
    digits = digits.slice(2)
  }
  if (digits.length !== 10 && digits.length !== 11) return null
  const ddd = digits.slice(0, 2)
  if (!/^[1-9][1-9]$/.test(ddd)) return null // DDDs do Brasil não têm zero
  const number = digits.slice(2)
  const mobile = number.length === 9
  if (mobile && !number.startsWith("9")) return null
  if (!mobile && !/^[2-5]/.test(number)) return null // fixos começam com 2 a 5
  const tel = `+55${digits}`
  return { tel, display: displayPhone(tel), isMobile: mobile }
}

export const telLink = (tel: string) => `tel:${tel}`

export const whatsappLink = (tel: string) => `https://wa.me/${tel.replace(/^\+/, "")}`
