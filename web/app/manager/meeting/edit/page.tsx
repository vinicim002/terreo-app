import { Suspense } from "react"
import { EditScreen } from "@/components/comm/EditScreen"
import { MeetingForm } from "@/components/meetings/MeetingForm"

export default function ManagerMeetingEdit() {
  return (
    <Suspense>
      <EditScreen slugNew="meetingNew" slugEdit="meetingEdit" backHref="/manager/meetings/">
        <MeetingForm />
      </EditScreen>
    </Suspense>
  )
}
