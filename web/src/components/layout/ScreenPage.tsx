"use client"

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { Header } from "@/components/layout/Header"
import { EmptyScreen } from "@/components/layout/EmptyScreen"
import { PROFILES_DEF, titleKey } from "@/navigation/screens"
import type { Profile } from "@/preferences/types"

interface ScreenPageProps {
  profile: Profile
  slug: string
  children?: ReactNode
  /** Título próprio (telas fora do catálogo, como o detalhe de um aviso). */
  title?: string
  /** Para onde voltar sem histórico; padrão: o início do perfil. */
  backHref?: string
  /** Telas internas fora do catálogo sempre mostram "voltar". */
  inner?: boolean
}

/** Tela de um perfil: cabeçalho com o título do catálogo e o conteúdo (ou "em construção"). */
export function ScreenPage({
  profile,
  slug,
  children,
  title: ownTitle,
  backHref,
  inner,
}: ScreenPageProps) {
  const t = useTranslations()
  const def = PROFILES_DEF[profile]
  const isHome = slug === ""
  const isTopLevel = !inner && def.nav.includes(slug)
  const title = ownTitle ?? (isHome ? t(titleKey(profile, slug)) : t(`screens.${slug}`))
  return (
    <>
      <Header
        title={title}
        subtitle={isHome ? t("common.condominium") : undefined}
        showBack={!isTopLevel}
        backHref={backHref ?? `${def.basePath}/`}
        notificationsHref={slug === "notifications" ? undefined : `${def.basePath}/notifications/`}
      />
      <main>{children ?? <EmptyScreen />}</main>
    </>
  )
}
