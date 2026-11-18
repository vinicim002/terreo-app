import { ScreenPage } from "@/components/layout/ScreenPage"
import { ResidentVisitors } from "@/components/visitors/ResidentVisitors"

export default function ResidentVisitorsPage() {
  return (
    <ScreenPage profile="resident" slug="visitors" backHref="/resident/services/">
      <ResidentVisitors />
    </ScreenPage>
  )
}
