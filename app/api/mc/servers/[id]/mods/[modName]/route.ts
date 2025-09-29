import type { NextRequest } from "next/server"
import { upstream } from "../../../../../mc/_client"

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; modName: string } }) {
  const res = await upstream(`/servers/${params.id}/mods/${encodeURIComponent(params.modName)}`, { method: "DELETE" })
  const text = await res.text()
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  })
}
