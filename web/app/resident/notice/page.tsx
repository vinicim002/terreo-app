import { Suspense } from "react"
import { ScreenPage } from "@/components/layout/ScreenPage"
import { NoticeDetail } from "@/components/notices/NoticeDetail"

export default function ResidentNotice() {
  return (
    <Suspense>
      <ScreenPage profile="resident" slug="notice" backHref="/resident/notices/" inner>
        <NoticeDetail profile="resident" />
      </ScreenPage>
    </Suspense>
  )
}
