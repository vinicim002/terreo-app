import { Markdown } from "@/dev/Markdown"
import { readDoc } from "@/dev/repo"

export default async function DevBacklog() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Backlog · docs/backlog.md</p>
      <Markdown text={await readDoc("docs/backlog.md")} />
    </div>
  )
}
