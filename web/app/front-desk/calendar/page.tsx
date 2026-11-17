import { ScreenPage } from "@/components/layout/ScreenPage"
import { CalendarScreen } from "@/components/agenda/CalendarScreen"

export default function FrontDeskCalendar() {
  return (
    <ScreenPage profile="front-desk" slug="calendar" backHref="/front-desk/more/">
      <CalendarScreen profile="front-desk" />
    </ScreenPage>
  )
}
