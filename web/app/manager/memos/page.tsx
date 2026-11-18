import { ScreenPage } from "@/components/layout/ScreenPage"
import { MemosScreen } from "@/components/memos/MemosScreen"

export default function ManagerMemos() {
  return (
    <ScreenPage profile="manager" slug="memos" backHref="/manager/more/">
      <MemosScreen />
    </ScreenPage>
  )
}
