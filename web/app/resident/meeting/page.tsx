import { Suspense } from "react"
import { ScreenPage } from "@/components/layout/ScreenPage"
import { MeetingDetail } from "@/components/meetings/MeetingDetail"

export default function ResidentMeeting() {
  return (
    <Suspense>
      <ScreenPage profile="resident" slug="meeting" backHref="/resident/meetings/" inner>
        <MeetingDetail profile="resident" />
      </ScreenPage>
    </Suspense>
  )
}
