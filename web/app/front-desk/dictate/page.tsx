import { ScreenPage } from "@/components/layout/ScreenPage"
import { DictateMemo } from "@/components/desk/DictateMemo"

export default function FrontDeskDictate() {
  return (
    <ScreenPage profile="front-desk" slug="dictate" backHref="/front-desk/">
      <DictateMemo />
    </ScreenPage>
  )
}
