import type { ReactNode } from "react"
import { BottomNav } from "@/components/layout/BottomNav"
import { AccessGuard } from "@/auth/AccessGuard"
import { EmergencyWatcher } from "@/components/security/EmergencyWatcher"
import type { Profile } from "@/preferences/types"

/** Moldura de todas as telas de um perfil: guarda, conteúdo, barra de baixo e o vigia de emergências (spec 005). */
export function ProfileShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  return (
    <AccessGuard profile={profile}>
      <div className="pb-[calc(5rem+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav profile={profile} />
      <EmergencyWatcher profile={profile} />
    </AccessGuard>
  )
}
