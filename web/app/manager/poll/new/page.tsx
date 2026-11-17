import { ScreenPage } from "@/components/layout/ScreenPage"
import { PollForm } from "@/components/polls/PollForm"

export default function ManagerPollNew() {
  return (
    <ScreenPage profile="manager" slug="pollNew" backHref="/manager/polls/" inner>
      <PollForm />
    </ScreenPage>
  )
}
