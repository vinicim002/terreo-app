/** Emoji da bandeira de um país (letras indicadoras regionais a partir do código ISO). */
export function flagEmoji(code: string) {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

/**
 * Bandeira de um país. A classe `flag-emoji` usa a fonte de bandeiras "Twemoji Country Flags" quando ela estiver
 * disponível (no Windows, que não desenha bandeiras com emoji), antes das fontes de emoji do sistema.
 */
export function Flag({ code, className = "" }: { code: string; className?: string }) {
  return (
    <span aria-hidden className={`flag-emoji leading-none ${className}`}>
      {flagEmoji(code)}
    </span>
  )
}
