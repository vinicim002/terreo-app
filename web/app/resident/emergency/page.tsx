import { ScreenPage } from "@/components/layout/ScreenPage"
import { EmergencyScreen } from "@/components/security/EmergencyScreen"

export default function ResidentEmergency() {
  return (
    <ScreenPage profile="resident" slug="emergency">
      <EmergencyScreen />
    </ScreenPage>
  )
}
