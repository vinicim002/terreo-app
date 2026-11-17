import { ScreenPage } from "@/components/layout/ScreenPage"
import { NotificationsScreen } from "@/components/notifications/NotificationsScreen"

export default function ManagerNotifications() {
  return (
    <ScreenPage profile="manager" slug="notifications" backHref="/manager/">
      <NotificationsScreen profile="manager" />
    </ScreenPage>
  )
}
