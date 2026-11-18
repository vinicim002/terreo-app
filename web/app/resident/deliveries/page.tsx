import { ScreenPage } from "@/components/layout/ScreenPage"
import { ResidentDeliveries } from "@/components/deliveries/ResidentDeliveries"

export default function ResidentDeliveriesPage() {
  return (
    <ScreenPage profile="resident" slug="deliveries">
      <ResidentDeliveries />
    </ScreenPage>
  )
}
