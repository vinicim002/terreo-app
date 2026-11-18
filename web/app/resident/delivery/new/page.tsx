import { ScreenPage } from "@/components/layout/ScreenPage"
import { CodeForm } from "@/components/deliveries/CodeForm"

export default function ResidentDeliveryNew() {
  return (
    <ScreenPage profile="resident" slug="deliveryNew" backHref="/resident/deliveries/" inner>
      <CodeForm />
    </ScreenPage>
  )
}
