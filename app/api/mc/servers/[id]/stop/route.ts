import type { NextRequest } from "next/server"
import { upstream } from "../../../../mc/_client"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await upstream(`/servers/${params.id}/stop`, { method: "POST" })
  const text = await res.text()
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  })
}
