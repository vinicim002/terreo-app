import { Markdown } from "@/dev/Markdown"
import { readDoc } from "@/dev/repo"

export default async function DevChangelog() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Histórico · docs/changelog.md</p>
      <Markdown text={await readDoc("docs/changelog.md")} />
    </div>
  )
}
