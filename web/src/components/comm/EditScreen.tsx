"use client"

import { useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { ScreenPage } from "@/components/layout/ScreenPage"

/** Tela de formulário do síndico: "Novo …" sem `id` na URL, "Editar …" com `id`. */
export function EditScreen({
  slugNew,
  slugEdit,
  backHref,
  children,
}: {
  slugNew: string
  slugEdit: string
  backHref: string
  children: ReactNode
}) {
  const id = useSearchParams().get("id")
  return (
    <ScreenPage profile="manager" slug={id ? slugEdit : slugNew} backHref={backHref} inner>
      {children}
    </ScreenPage>
  )
}
