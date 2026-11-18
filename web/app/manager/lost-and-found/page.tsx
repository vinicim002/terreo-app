import { ScreenPage } from "@/components/layout/ScreenPage"
import { LostFound } from "@/components/lostfound/LostFound"

export default function ManagerLostAndFound() {
  return (
    <ScreenPage profile="manager" slug="lost-and-found" backHref="/manager/more/">
      <LostFound profile="manager" />
    </ScreenPage>
  )
}
