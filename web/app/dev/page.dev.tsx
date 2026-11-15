import { ApiStatus, SeedTools } from "@/dev/DevTools"
import { Markdown } from "@/dev/Markdown"
import { readDoc } from "@/dev/repo"

export default async function DevOverview() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Visão geral</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <ApiStatus />
        <SeedTools />
      </div>
      <Markdown text={await readDoc("README.md")} />
    </div>
  )
}
