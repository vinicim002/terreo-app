import { ScreenPage } from "@/components/layout/ScreenPage"
import { EventForm } from "@/components/agenda/EventForm"

export default function ManagerEventNew() {
  return (
    <ScreenPage profile="manager" slug="eventNew" backHref="/manager/calendar/" inner>
      <EventForm />
    </ScreenPage>
  )
}
