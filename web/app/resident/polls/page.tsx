import { ScreenPage } from "@/components/layout/ScreenPage"
import { PollsScreen } from "@/components/polls/PollsScreen"

export default function ResidentPolls() {
  return (
    <ScreenPage profile="resident" slug="polls" backHref="/resident/services/">
      <PollsScreen />
    </ScreenPage>
  )
}
