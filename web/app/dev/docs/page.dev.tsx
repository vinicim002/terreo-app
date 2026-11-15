import Link from "next/link"
import { Markdown } from "@/dev/Markdown"
import { listDocs, readDoc } from "@/dev/repo"

// Tipos escritos à mão: as rotas .dev.tsx não existem nos tipos gerados para o build.
export default async function DevDocs({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>
}) {
  const { path } = await searchParams
  if (path) {
    let content: string | null = null
    try {
      content = await readDoc(path)
    } catch {
      content = null
    }
    return (
      <div className="flex flex-col gap-4">
        <Link href="/dev/docs/" className="text-sm text-link">
          ← Todos os documentos
        </Link>
        <p className="font-mono text-sm text-muted-foreground">{path}</p>
        {content === null ? (
          <p className="text-destructive">Documento não encontrado ou não permitido.</p>
        ) : (
          <Markdown text={content} />
        )}
      </div>
    )
  }

  const docs = await listDocs()
  const groups = Map.groupBy(docs, (d) => d.group)
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Documentos</h1>
      {[...groups].map(([group, files]) => (
        <section key={group}>
          <h2 className="mb-1 font-semibold">{group}</h2>
          <ul className="flex flex-col">
            {files.map((f) => (
              <li key={f.path}>
                <Link
                  href={`/dev/docs/?path=${encodeURIComponent(f.path)}`}
                  className="block rounded px-2 py-1 font-mono text-sm hover:bg-muted"
                >
                  {f.path.split("/").at(-1)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
