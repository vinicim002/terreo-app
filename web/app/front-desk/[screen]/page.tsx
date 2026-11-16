import { ScreenPage } from "@/components/layout/ScreenPage"
import { dynamicSlugs } from "@/navigation/screens"

// Telas vazias geradas do catálogo (contracts/rotas.md). Telas com página própria ficam fora.
const OWN_PAGES = ["more", "residents", "rules"]

export const dynamicParams = false

export function generateStaticParams() {
  return dynamicSlugs("front-desk", OWN_PAGES).map((screen) => ({ screen }))
}

export default async function FrontDeskScreen({ params }: PageProps<"/front-desk/[screen]">) {
  const { screen } = await params
  return <ScreenPage profile="front-desk" slug={screen} />
}
