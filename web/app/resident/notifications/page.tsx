import { ScreenPage } from "@/components/layout/ScreenPage"
import { NotificationsScreen } from "@/components/notifications/NotificationsScreen"

export default function ResidentNotifications() {
  return (
    <ScreenPage profile="resident" slug="notifications" backHref="/resident/">
      <NotificationsScreen profile="resident" />
    </ScreenPage>
  )
}
