import { ScreenPage } from "@/components/layout/ScreenPage"
import { CalendarScreen } from "@/components/agenda/CalendarScreen"

export default function ManagerCalendar() {
  return (
    <ScreenPage profile="manager" slug="calendar" backHref="/manager/more/">
      <CalendarScreen profile="manager" />
    </ScreenPage>
  )
}
