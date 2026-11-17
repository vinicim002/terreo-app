import { Suspense } from "react"
import { ScreenPage } from "@/components/layout/ScreenPage"
import { NoticeDetail } from "@/components/notices/NoticeDetail"

export default function ManagerNotice() {
  return (
    <Suspense>
      <ScreenPage profile="manager" slug="notice" backHref="/manager/notices/" inner>
        <NoticeDetail profile="manager" />
      </ScreenPage>
    </Suspense>
  )
}
