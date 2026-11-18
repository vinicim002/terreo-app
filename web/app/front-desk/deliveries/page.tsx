import { ScreenPage } from "@/components/layout/ScreenPage"
import { ApartmentGrid } from "@/components/desk/ApartmentGrid"

export default function FrontDeskDeliveries() {
  return (
    <ScreenPage profile="front-desk" slug="deliveries">
      <ApartmentGrid />
    </ScreenPage>
  )
}
