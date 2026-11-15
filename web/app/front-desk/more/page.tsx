import { ScreenList } from "@/components/layout/ScreenList"
import { ScreenPage } from "@/components/layout/ScreenPage"

export default function Hub() {
  return (
    <ScreenPage profile="front-desk" slug="more">
      <ScreenList profile="front-desk" />
    </ScreenPage>
  )
}
