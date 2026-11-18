import { ManagerShortcuts } from "@/components/home/CommHighlights"
import { EmptyScreen } from "@/components/layout/EmptyScreen"
import { ScreenPage } from "@/components/layout/ScreenPage"
import { GeneralAlertBanner } from "@/components/security/GeneralAlertOverlay"

export default function Home() {
  return (
    <ScreenPage profile="manager" slug="">
      <GeneralAlertBanner manageHref="/manager/general-alert/" />
      <ManagerShortcuts />
      <EmptyScreen />
    </ScreenPage>
  )
}
