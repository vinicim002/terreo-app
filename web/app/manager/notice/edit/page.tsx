import { Suspense } from "react"
import { EditScreen } from "@/components/comm/EditScreen"
import { NoticeForm } from "@/components/notices/NoticeForm"

export default function ManagerNoticeEdit() {
  return (
    <Suspense>
      <EditScreen slugNew="noticeNew" slugEdit="noticeEdit" backHref="/manager/notices/">
        <NoticeForm />
      </EditScreen>
    </Suspense>
  )
}
