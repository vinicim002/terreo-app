import { ScreenPage } from "@/components/layout/ScreenPage"
import { NotificationsScreen } from "@/components/notifications/NotificationsScreen"

export default function FrontDeskNotifications() {
  return (
    <ScreenPage profile="front-desk" slug="notifications" backHref="/front-desk/">
      <NotificationsScreen profile="front-desk" />
    </ScreenPage>
  )
}
