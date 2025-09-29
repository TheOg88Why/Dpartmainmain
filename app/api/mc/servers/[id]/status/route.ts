import type { NextRequest } from "next/server"
import { upstream } from "../../../../mc/_client"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await upstream(`/servers/${params.id}/status`, { method: "GET" })
  const text = await res.text()
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  })
}
