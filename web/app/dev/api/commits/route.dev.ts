import { listCommits } from "@/dev/repo"

export async function GET() {
  return Response.json({ commits: await listCommits(50) })
}
