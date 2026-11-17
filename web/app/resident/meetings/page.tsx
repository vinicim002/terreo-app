import { ScreenPage } from "@/components/layout/ScreenPage"
import { MeetingsScreen } from "@/components/meetings/MeetingsScreen"

export default function ResidentMeetings() {
  return (
    <ScreenPage profile="resident" slug="meetings" backHref="/resident/services/">
      <MeetingsScreen profile="resident" />
    </ScreenPage>
  )
}
