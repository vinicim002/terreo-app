import { ScreenPage } from "@/components/layout/ScreenPage"
import { NoticeList } from "@/components/notices/NoticeList"

export default function ManagerNotices() {
  return (
    <ScreenPage profile="manager" slug="notices">
      <NoticeList profile="manager" />
    </ScreenPage>
  )
}
