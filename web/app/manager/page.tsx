import { ManagerShortcuts } from "@/components/home/CommHighlights"
import { EmptyScreen } from "@/components/layout/EmptyScreen"
import { ScreenPage } from "@/components/layout/ScreenPage"

export default function Home() {
  return (
    <ScreenPage profile="manager" slug="">
      <ManagerShortcuts />
      <EmptyScreen />
    </ScreenPage>
  )
}
