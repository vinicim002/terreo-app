import { ScreenPage } from "@/components/layout/ScreenPage"
import { NoticeList } from "@/components/notices/NoticeList"

export default function FrontDeskNotices() {
  return (
    <ScreenPage profile="front-desk" slug="notices" backHref="/front-desk/more/">
      <NoticeList profile="front-desk" />
    </ScreenPage>
  )
}
