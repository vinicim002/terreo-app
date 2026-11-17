import { ScreenPage } from "@/components/layout/ScreenPage"
import { MeetingsScreen } from "@/components/meetings/MeetingsScreen"

export default function ManagerMeetings() {
  return (
    <ScreenPage profile="manager" slug="meetings" backHref="/manager/more/">
      <MeetingsScreen profile="manager" />
    </ScreenPage>
  )
}
