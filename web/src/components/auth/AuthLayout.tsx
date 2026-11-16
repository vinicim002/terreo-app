import type { ReactNode } from "react"

/** Moldura das telas de entrada: ícone do app, título e conteúdo centralizado. */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" width={72} height={72} className="size-18 rounded-2xl" />
        <h1 className="text-3xl font-extrabold">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </main>
  )
}
