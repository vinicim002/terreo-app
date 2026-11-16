import { ScreenPage } from "@/components/layout/ScreenPage"
import { RulesList } from "@/components/rules/RulesList"

export default function Rules() {
  return (
    <ScreenPage profile="resident" slug="rules">
      <RulesList />
    </ScreenPage>
  )
}
