import { ScreenPage } from "@/components/layout/ScreenPage"
import { OnDuty } from "@/components/staff/OnDuty"

export default function ResidentOnDuty() {
  return (
    <ScreenPage profile="resident" slug="on-duty" backHref="/resident/services/">
      <OnDuty />
    </ScreenPage>
  )
}
