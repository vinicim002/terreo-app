import { ScreenPage } from "@/components/layout/ScreenPage"
import { dynamicSlugs } from "@/navigation/screens"

// Telas vazias geradas do catálogo (contracts/rotas.md). Telas com página própria ficam fora.
const OWN_PAGES = [
  "services",
  "rules",
  "welcome",
  "profile",
  "invite",
  "notices",
  "polls",
  "calendar",
  "meetings",
  "notifications",
  "deliveries",
  "visitors",
  "travel-mode",
  "on-duty",
  "lost-and-found",
]

export const dynamicParams = false

export function generateStaticParams() {
  return dynamicSlugs("resident", OWN_PAGES).map((screen) => ({ screen }))
}

export default async function ResidentScreen({ params }: PageProps<"/resident/[screen]">) {
  const { screen } = await params
  return <ScreenPage profile="resident" slug={screen} />
}
