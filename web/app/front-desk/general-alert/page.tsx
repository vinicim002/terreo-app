import { ScreenPage } from "@/components/layout/ScreenPage"
import { GeneralAlertForm } from "@/components/security/GeneralAlertForm"

export default function GeneralAlert() {
  return (
    <ScreenPage profile="front-desk" slug="general-alert" backHref="/front-desk/more/">
      <GeneralAlertForm />
    </ScreenPage>
  )
}
