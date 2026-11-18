import { ScreenPage } from "@/components/layout/ScreenPage"
import { TravelWatch } from "@/components/desk/TravelWatch"

export default function FrontDeskTravelWatch() {
  return (
    <ScreenPage profile="front-desk" slug="travel-watch" backHref="/front-desk/more/">
      <TravelWatch />
    </ScreenPage>
  )
}
