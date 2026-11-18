import { ScreenPage } from "@/components/layout/ScreenPage"
import { TravelMode } from "@/components/travel/TravelMode"

export default function ResidentTravelMode() {
  return (
    <ScreenPage profile="resident" slug="travel-mode" backHref="/resident/services/">
      <TravelMode />
    </ScreenPage>
  )
}
