import { Suspense } from "react"
import { ScreenPage } from "@/components/layout/ScreenPage"
import { NoticeDetail } from "@/components/notices/NoticeDetail"

export default function FrontDeskNotice() {
  return (
    <Suspense>
      <ScreenPage profile="front-desk" slug="notice" backHref="/front-desk/notices/" inner>
        <NoticeDetail profile="front-desk" />
      </ScreenPage>
    </Suspense>
  )
}
