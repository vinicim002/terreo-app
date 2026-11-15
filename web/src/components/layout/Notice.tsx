import type { ReactNode } from "react"

/** Mensagem de página inteira (não encontrado, outro perfil, entrada em breve). */
export function Notice({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <p className="text-muted-foreground">{text}</p>
      {action}
    </main>
  )
}
