import { ScreenPage } from "@/components/layout/ScreenPage"
import { OnDuty } from "@/components/staff/OnDuty"

export default function ManagerOnDuty() {
  return (
    <ScreenPage profile="manager" slug="on-duty" backHref="/manager/more/">
      <OnDuty />
    </ScreenPage>
  )
}
