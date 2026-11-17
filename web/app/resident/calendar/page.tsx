import { ScreenPage } from "@/components/layout/ScreenPage"
import { CalendarScreen } from "@/components/agenda/CalendarScreen"

export default function ResidentCalendar() {
  return (
    <ScreenPage profile="resident" slug="calendar" backHref="/resident/services/">
      <CalendarScreen profile="resident" />
    </ScreenPage>
  )
}
