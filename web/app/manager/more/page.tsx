import { ScreenList } from "@/components/layout/ScreenList"
import { ScreenPage } from "@/components/layout/ScreenPage"

export default function Hub() {
  return (
    <ScreenPage profile="manager" slug="more">
      <ScreenList profile="manager" />
    </ScreenPage>
  )
}
