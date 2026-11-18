import { ScreenPage } from "@/components/layout/ScreenPage"
import { VisitorForm } from "@/components/visitors/VisitorForm"

export default function ResidentVisitorNew() {
  return (
    <ScreenPage profile="resident" slug="visitorNew" backHref="/resident/visitors/" inner>
      <VisitorForm />
    </ScreenPage>
  )
}
