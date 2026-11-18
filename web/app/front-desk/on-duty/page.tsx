import { ScreenPage } from "@/components/layout/ScreenPage"
import { OnDuty } from "@/components/staff/OnDuty"

export default function FrontDeskOnDuty() {
  return (
    <ScreenPage profile="front-desk" slug="on-duty" backHref="/front-desk/more/">
      <OnDuty />
    </ScreenPage>
  )
}
