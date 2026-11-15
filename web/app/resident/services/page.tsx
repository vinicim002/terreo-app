import { ScreenList } from "@/components/layout/ScreenList"
import { ScreenPage } from "@/components/layout/ScreenPage"

export default function Hub() {
  return (
    <ScreenPage profile="resident" slug="services">
      <ScreenList profile="resident" />
    </ScreenPage>
  )
}
