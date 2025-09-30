// ✅ app/api/mc/deploy/route.ts
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  const apiKey = process.env.DEPLOY_API_KEY

  const res = await fetch("http://194.238.16.252:3000/api/deploy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey!,
    },
    body: JSON.stringify(body),
  })

  const data = await res.text()
  return new NextResponse(data, { status: res.status })
}
