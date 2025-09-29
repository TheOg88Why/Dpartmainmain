import type { NextRequest } from "next/server"
import { upstreamUrl } from "../../../../_client"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  // Stream directly from upstream without exposing API key to client: we cannot set custom headers via EventSource,
  // so we establish the upstream connection server-side and pipe events.
  const KEY = process.env.MC_API_KEY
  const upstream = upstreamUrl(`/servers/${params.id}/logs/live`)

  if (!KEY) {
    return new Response("MC_API_KEY missing", { status: 500 })
  }

  const controller = new AbortController()
  const upstreamRes = await fetch(upstream, {
    headers: { "x-api-key": KEY },
    signal: controller.signal,
  })

  if (!upstreamRes.ok || !upstreamRes.body) {
    return new Response(`Failed to connect: ${upstreamRes.status}`, { status: upstreamRes.status })
  }

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const reader = upstreamRes.body.getReader()
  ;(async () => {
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) await writer.write(value)
      }
    } catch (e) {
      // ignore
    } finally {
      await writer.close()
      controller.abort()
    }
  })()

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
