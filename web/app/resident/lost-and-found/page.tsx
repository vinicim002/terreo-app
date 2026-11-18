import { ScreenPage } from "@/components/layout/ScreenPage"
import { LostFound } from "@/components/lostfound/LostFound"

export default function ResidentLostAndFound() {
  return (
    <ScreenPage profile="resident" slug="lost-and-found" backHref="/resident/services/">
      <LostFound profile="resident" />
    </ScreenPage>
  )
}
