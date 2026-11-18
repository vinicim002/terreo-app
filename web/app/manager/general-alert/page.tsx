import { ScreenPage } from "@/components/layout/ScreenPage"
import { GeneralAlertForm } from "@/components/security/GeneralAlertForm"

export default function GeneralAlert() {
  return (
    <ScreenPage profile="manager" slug="general-alert" backHref="/manager/more/">
      <GeneralAlertForm />
    </ScreenPage>
  )
}
