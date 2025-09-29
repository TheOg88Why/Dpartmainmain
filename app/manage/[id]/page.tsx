"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then(async (r) => {
    if (!r.ok) throw new Error(await r.text())
    return r.json()
  })

export default function ManageServerPage() {
  const { id } = useParams<{ id: string }>()
  const [logs, setLogs] = useState<string[]>([])
  const [cmd, setCmd] = useState("")
  const logRef = useRef<HTMLDivElement | null>(null)

  // Live logs via SSE proxied by our API
  useEffect(() => {
    if (!id) return
    const url = `/api/mc/servers/${id}/logs/live`
    const es = new EventSource(url)
    es.onmessage = (e) => {
      setLogs((prev) => {
        const next = [...prev, e.data]
        // Keep last 1000 lines
        return next.slice(-1000)
      })
    }
    es.onerror = () => {
      toast.error("Log stream disconnected")
      es.close()
    }
    return () => es.close()
  }, [id])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  // Mods list
  const { data: mods, mutate: refreshMods } = useSWR<{ mods: string[] }>(
    id ? `/api/mc/servers/${id}/mods` : null,
    fetcher,
  )

  async function sendCommand(command: string) {
    if (!command.trim()) return
    try {
      const res = await fetch(`/api/mc/servers/${id}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      })
      if (!res.ok) {
        const msg = await res.text()
        toast.error(`Command failed: ${msg}`)
        return
      }
      toast.success("Command sent")
      setCmd("")
    } catch (e: any) {
      toast.error(e?.message || "Failed to send command")
    }
  }

  async function addModByUrl() {
    const url = prompt("Enter mod URL (e.g., direct .jar link):")
    if (!url) return
    try {
      const res = await fetch(`/api/mc/servers/${id}/mods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Mod scheduled for install")
      refreshMods()
    } catch (e: any) {
      toast.error(e?.message || "Mod upload failed")
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Server Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {/* These map to typical server commands; adjust if distinct start/stop endpoints exist */}
            <Button size="sm" onClick={() => sendCommand("start")}>
              Start
            </Button>
            <Button size="sm" variant="secondary" onClick={() => sendCommand("stop")}>
              Stop
            </Button>
            <Button size="sm" variant="outline" onClick={() => sendCommand("restart")}>
              Restart
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={logRef}
              className="h-80 w-full overflow-auto rounded border bg-muted/40 p-2 font-mono text-xs leading-5"
              aria-label="Live server logs"
            >
              {logs.length === 0 ? (
                <div className="text-muted-foreground">Connecting to live logs…</div>
              ) : (
                logs.map((line, i) => <div key={i}>{line}</div>)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Command Console</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="Type a server command (e.g., say Hello)"
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  sendCommand(cmd)
                }
              }}
              aria-label="Server command input"
            />
            <Button onClick={() => sendCommand(cmd)}>Send</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Installed Mods ({mods?.mods?.length ?? 0})</div>
              <Button size="sm" variant="outline" onClick={addModByUrl}>
                Add Mod by URL
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded border bg-muted/40 p-2 text-sm">
              {(mods?.mods ?? []).length ? (
                <ul className="list-disc pl-5">
                  {mods!.mods.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted-foreground text-sm">No mods found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Server Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Editor coming soon. For now, use commands or manage via dashboard settings.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
