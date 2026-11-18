import { ScreenPage } from "@/components/layout/ScreenPage"
import { LostFound } from "@/components/lostfound/LostFound"

export default function FrontDeskLostAndFound() {
  return (
    <ScreenPage profile="front-desk" slug="lost-and-found" backHref="/front-desk/more/">
      <LostFound profile="front-desk" />
    </ScreenPage>
  )
}
