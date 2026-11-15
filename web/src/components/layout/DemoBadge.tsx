import { APP_MODE } from "@/config/app-mode"
import { DemoBadgeText } from "./DemoBadgeText"

/** Faixa discreta em todas as telas da versão de demonstração (RF-004a). */
export function DemoBadge() {
  if (APP_MODE !== "demo") return null
  return (
    <div
      role="note"
      className="bg-warning-background px-4 py-1 text-center text-xs font-semibold text-warning"
    >
      <DemoBadgeText />
    </div>
  )
}
