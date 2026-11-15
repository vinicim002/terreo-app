import { backlogProgress } from "@/dev/repo"

export default async function DevProgress() {
  const stages = await backlogProgress()
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Andamento</h1>
      <ul className="flex flex-col gap-3">
        {stages.map((s) => {
          const percent = s.total ? Math.round((s.done / s.total) * 100) : 0
          return (
            <li key={s.title} className="rounded-xl border border-border bg-card p-4">
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{s.title}</span>
                <span>
                  {s.done}/{s.total} · {percent}%
                </span>
              </div>
              <div
                className="mt-2 h-2 rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={s.title}
              >
                <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
