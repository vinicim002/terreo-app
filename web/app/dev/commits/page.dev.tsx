import { listCommits } from "@/dev/repo"

export default async function DevCommits() {
  const commits = await listCommits(50)
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Commits</h1>
      {commits.length === 0 ? (
        <p className="text-muted-foreground">Ainda não há commits.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Commit</th>
                <th className="p-2">Data</th>
                <th className="p-2">Autor</th>
                <th className="p-2">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {commits.map((c) => (
                <tr key={c.hash} className="border-t border-border">
                  <td className="p-2 font-mono">{c.hash}</td>
                  <td className="p-2 whitespace-nowrap">{c.date}</td>
                  <td className="p-2">{c.author}</td>
                  <td className="p-2">{c.subject}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
