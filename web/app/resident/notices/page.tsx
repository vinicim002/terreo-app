import { ScreenPage } from "@/components/layout/ScreenPage"
import { NoticeList } from "@/components/notices/NoticeList"

export default function ResidentNotices() {
  return (
    <ScreenPage profile="resident" slug="notices" backHref="/resident/services/">
      <NoticeList profile="resident" />
    </ScreenPage>
  )
}
