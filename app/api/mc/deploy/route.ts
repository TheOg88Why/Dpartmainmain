import type { NextRequest } from "next/server"
import { upstream } from "../_client"

export async function POST(req: NextRequest) {
  const body = await req.json()
  // Pass-through to external API
  const res = await upstream("/deploy", {
    method: "POST",
    body: JSON.stringify(body),
  })
  const text = await res.text()
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  })
}
