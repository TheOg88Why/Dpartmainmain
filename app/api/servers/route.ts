import { NextResponse } from "next/server"

type Server = {
  id: string
  name: string
  status: "running" | "stopped"
  ramGB: number
  usage: number
}

// In-memory store for demo purposes
let SERVERS: Server[] = [
  { id: "s1", name: "Survival", status: "running", ramGB: 4, usage: 46 },
  { id: "s2", name: "Creative", status: "stopped", ramGB: 1, usage: 0 },
]

export async function GET() {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 600)) // simulate latency
  return NextResponse.json({ servers: SERVERS })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const name = (body?.name as string) || `Server ${SERVERS.length + 1}`
  const ramGB = Number(body?.ramGB) || 1
  const s: Server = { id: `s${Date.now()}`, name, status: "stopped", ramGB, usage: 0 }
  SERVERS = [s, ...SERVERS]
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500))
  return NextResponse.json({ server: s }, { status: 201 })
}
