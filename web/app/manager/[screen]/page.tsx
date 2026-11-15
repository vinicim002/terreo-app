import { ScreenPage } from "@/components/layout/ScreenPage"
import { dynamicSlugs } from "@/navigation/screens"

// Telas vazias geradas do catálogo (contracts/rotas.md). Telas com página própria ficam fora.
const OWN_PAGES = ["more"]

export const dynamicParams = false

export function generateStaticParams() {
  return dynamicSlugs("manager", OWN_PAGES).map((screen) => ({ screen }))
}

export default async function ManagerScreen({ params }: PageProps<"/manager/[screen]">) {
  const { screen } = await params
  return <ScreenPage profile="manager" slug={screen} />
}
