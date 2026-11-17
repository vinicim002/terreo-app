import { ScreenPage } from "@/components/layout/ScreenPage"
import { PollsScreen } from "@/components/polls/PollsScreen"

export default function ManagerPolls() {
  return (
    <ScreenPage profile="manager" slug="polls" backHref="/manager/more/">
      <PollsScreen manager />
    </ScreenPage>
  )
}
