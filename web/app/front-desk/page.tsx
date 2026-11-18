import { DeskHome } from "@/components/desk/DeskHome"
import { ScreenPage } from "@/components/layout/ScreenPage"

export default function Home() {
  return (
    <ScreenPage profile="front-desk" slug="">
      <DeskHome />
    </ScreenPage>
  )
}
