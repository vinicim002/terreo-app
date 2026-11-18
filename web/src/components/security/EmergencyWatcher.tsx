"use client"

import { useState } from "react"
import { useGeneralAlert, useOpenEmergencies } from "@/hooks/data"
import type { Profile } from "@/preferences/types"
import { DeskEmergencyOverlay } from "./DeskEmergencyOverlay"
import { GeneralAlertOverlay } from "./GeneralAlertOverlay"

/**
 * Vigia de emergências em todos os perfis (research R2 da spec 005). Na portaria, consulta os alertas de apartamento a
 * cada 1 s e abre a tela cheia para quem está de plantão; para todos, abre a tela cheia do alerta geral ainda não
 * visto. Na Etapa 3, push e tempo real substituem a consulta, sem mudar as telas.
 */
export function EmergencyWatcher({ profile }: { profile: Profile }) {
  const desk = profile === "front-desk"
  const { data: open } = useOpenEmergencies(desk)
  const { data: general } = useGeneralAlert()
  const [minimized, setMinimized] = useState<string[]>([])

  const mine = open?.find((a) => a.fullScreenForMe && !minimized.includes(a.id))
  if (mine)
    return (
      <DeskEmergencyOverlay alert={mine} onMinimize={() => setMinimized((m) => [...m, mine.id])} />
    )
  if (general && !general.seenByMe) return <GeneralAlertOverlay alert={general} />
  return null
}
