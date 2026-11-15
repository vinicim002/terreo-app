import { DocPathError, readDoc } from "@/dev/repo"

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") ?? ""
  try {
    return Response.json({ path, content: await readDoc(path) })
  } catch (error) {
    if (error instanceof DocPathError)
      return Response.json({ error: "Caminho não permitido." }, { status: 400 })
    return Response.json({ error: "Arquivo não encontrado." }, { status: 404 })
  }
}
