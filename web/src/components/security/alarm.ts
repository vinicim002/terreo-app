// Som e vibração do alerta de emergência (research R2 da spec 005). Usa só o que o navegador oferece: bipes com
// AudioContext e `navigator.vibrate`. Se o aparelho não deixar (sem interação, sem suporte), fica só a tela cheia.

/** Toca até ser parado; devolve a função que para. */
export function alarm(): () => void {
  let ctx: AudioContext | null = null
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctor) ctx = new Ctor()
  } catch {
    ctx = null
  }
  const beep = () => {
    try {
      navigator.vibrate?.([400, 200, 400])
    } catch {
      /* sem vibração */
    }
    if (!ctx) return
    try {
      for (const [offset, freq] of [
        [0, 880],
        [0.25, 660],
      ] as const) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = freq
        gain.gain.value = 0.2
        osc.connect(gain).connect(ctx.destination)
        osc.start(ctx.currentTime + offset)
        osc.stop(ctx.currentTime + offset + 0.2)
      }
    } catch {
      /* sem som */
    }
  }
  beep()
  const id = window.setInterval(beep, 2_000)
  return () => {
    window.clearInterval(id)
    try {
      navigator.vibrate?.(0)
      void ctx?.close()
    } catch {
      /* nada */
    }
  }
}
