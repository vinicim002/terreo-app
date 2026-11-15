import Link from "next/link"
import type { ReactNode } from "react"

// Painel de desenvolvimento (contracts/painel-dev.md). Só existe no `next dev`; em português (RF-033).
const SECTIONS = [
  { href: "/dev/", label: "Visão geral" },
  { href: "/dev/progress/", label: "Andamento" },
  { href: "/dev/backlog/", label: "Backlog" },
  { href: "/dev/changelog/", label: "Histórico" },
  { href: "/dev/commits/", label: "Commits" },
  { href: "/dev/docs/", label: "Documentos" },
]

export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-4 p-4 md:flex-row">
      <nav aria-label="Painel de desenvolvimento" className="md:w-52 md:shrink-0">
        <p className="mb-2 text-lg font-extrabold">Térreo · painel</p>
        <ul className="flex flex-wrap gap-2 md:flex-col">
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="block rounded-lg px-3 py-2 hover:bg-muted">
                {s.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/"
              className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted"
            >
              ← Abrir o app
            </Link>
          </li>
        </ul>
      </nav>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
