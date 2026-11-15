import { listDocs } from "@/dev/repo"

export async function GET() {
  return Response.json({ files: await listDocs() })
}
