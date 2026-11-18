import { ScreenPage } from "@/components/layout/ScreenPage"
import { DeskVisitors } from "@/components/desk/DeskVisitors"

export default function FrontDeskVisitors() {
  return (
    <ScreenPage profile="front-desk" slug="visitors">
      <DeskVisitors />
    </ScreenPage>
  )
}
