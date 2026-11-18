import { ScreenPage } from "@/components/layout/ScreenPage"
import { EmergencyAlertsScreen } from "@/components/security/EmergencyAlertsScreen"

export default function ManagerEmergencyAlerts() {
  return (
    <ScreenPage profile="manager" slug="emergency-alert" backHref="/manager/more/">
      <EmergencyAlertsScreen canRespond={false} />
    </ScreenPage>
  )
}
