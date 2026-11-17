import { Suspense } from "react"
import { ScreenPage } from "@/components/layout/ScreenPage"
import { MeetingDetail } from "@/components/meetings/MeetingDetail"

export default function ManagerMeeting() {
  return (
    <Suspense>
      <ScreenPage profile="manager" slug="meeting" backHref="/manager/meetings/" inner>
        <MeetingDetail profile="manager" />
      </ScreenPage>
    </Suspense>
  )
}
