import type { NextRequest } from "next/server"
import { upstream } from "../../../../mc/_client"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await upstream(`/servers/${params.id}/mods`, { method: "GET" })
  const text = await res.text()
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const res = await upstream(`/servers/${params.id}/mods`, { method: "POST", body: JSON.stringify(body) })
  const text = await res.text()
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  })
}
