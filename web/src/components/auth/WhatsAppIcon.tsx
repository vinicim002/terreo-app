/** Ícone do WhatsApp (traço simples), para os botões azuis da marca. */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path d="M3 21l1.65-4.8A8.5 8.5 0 1 1 7.9 19.4z" strokeLinejoin="round" />
      <path
        d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"
        strokeLinejoin="round"
      />
    </svg>
  )
}
