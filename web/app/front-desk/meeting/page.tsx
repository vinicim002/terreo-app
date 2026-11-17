import { Suspense } from "react"
import { ScreenPage } from "@/components/layout/ScreenPage"
import { MeetingDetail } from "@/components/meetings/MeetingDetail"

export default function FrontDeskMeeting() {
  return (
    <Suspense>
      <ScreenPage profile="front-desk" slug="meeting" backHref="/front-desk/calendar/" inner>
        <MeetingDetail profile="front-desk" />
      </ScreenPage>
    </Suspense>
  )
}
