import type { ReactNode } from "react"

/**
 * Moldura das telas de entrada (login, código, escolha de papel): topo laranja da marca com o mascote e, por cima,
 * um cartão de cantos arredondados com o título e o conteúdo.
 */
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
    <div className="relative min-h-dvh overflow-hidden bg-brand">
      <span aria-hidden className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10" />
      <span aria-hidden className="absolute -left-16 top-24 size-40 rounded-full bg-white/10" />
      <div className="relative flex h-[30dvh] min-h-44 items-center justify-center pt-[env(safe-area-inset-top)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascote-branco.png"
          alt=""
          width={100}
          height={112}
          className="h-28 w-auto drop-shadow-xl"
        />
      </div>
      <main className="relative mx-auto flex min-h-[70dvh] max-w-md flex-col gap-6 rounded-t-[2rem] bg-background px-5 pb-10 pt-8 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] sm:mb-10 sm:min-h-0 sm:rounded-[2rem]">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-extrabold">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  )
}
