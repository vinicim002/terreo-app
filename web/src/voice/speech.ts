// Reconhecimento de fala do próprio aparelho (spec 004, research R5). Sem suporte, as telas avisam e o campo
// continua digitável. Nos testes de ponta a ponta, um reconhecimento falso é injetado em `window.SpeechRecognition`.
import type { Locale } from "@/preferences/types"

const LANG: Record<Locale, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" }

interface RecognitionResultList {
  length: number
  [index: number]: { 0: { transcript: string }; isFinal: boolean }
}

export interface Recognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  start(): void
  stop(): void
  onresult: ((event: { results: RecognitionResultList }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type RecognitionCtor = new () => Recognition

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function speechSupported() {
  return ctor() !== null
}

/**
 * Começa a ouvir. `onText` recebe o texto acumulado (parcial e final); `onDone` é chamado ao parar,
 * com o motivo do erro quando houver (`not-allowed` = microfone não liberado).
 */
export function listen(
  locale: Locale,
  onText: (text: string) => void,
  onDone: (error?: string) => void,
): { stop: () => void } | null {
  const Ctor = ctor()
  if (!Ctor) return null
  const r = new Ctor()
  r.lang = LANG[locale]
  r.interimResults = true
  r.continuous = false
  let failed: string | undefined
  r.onresult = (event) => {
    let text = ""
    for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript
    onText(text.trim())
  }
  r.onerror = (event) => {
    failed = event.error
  }
  r.onend = () => onDone(failed)
  r.start()
  return { stop: () => r.stop() }
}
