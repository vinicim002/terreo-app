import { ScreenPage } from "@/components/layout/ScreenPage"
import { EmergencyAlertsScreen } from "@/components/security/EmergencyAlertsScreen"

export default function FrontDeskEmergencyAlerts() {
  return (
    <ScreenPage profile="front-desk" slug="emergency-alert" backHref="/front-desk/more/">
      <EmergencyAlertsScreen canRespond />
    </ScreenPage>
  )
}
