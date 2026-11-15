import { backlogProgress } from "@/dev/repo"

export async function GET() {
  return Response.json({ stages: await backlogProgress() })
}
