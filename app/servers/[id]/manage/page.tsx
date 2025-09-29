"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ManageServer() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const {
    data: status,
    mutate: refetchStatus,
    isLoading,
  } = useSWR(`/api/mc/servers/${id}/status`, fetcher, {
    refreshInterval: 5000,
  })

  const running = status?.status === "running"

  async function call(path: string, method = "POST", body?: any) {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json().catch(() => ({}))
  }

  async function handleStop() {
    try {
      await call(`/api/mc/servers/${id}/stop`)
      toast.success("Server stopping...")
      refetchStatus()
    } catch (e: any) {
      toast.error(`Stop failed: ${e.message || e}`)
    }
  }
  async function handleRestart() {
    try {
      await call(`/api/mc/servers/${id}/restart`)
      toast.success("Server restarting...")
      refetchStatus()
    } catch (e: any) {
      toast.error(`Restart failed: ${e.message || e}`)
    }
  }
  async function handleStart() {
    // No explicit start in API; use restart as start
    return handleRestart()
  }
  async function handleDelete() {
    try {
      await call(`/api/mc/servers/${id}`, "DELETE")
      toast.success("Server deleted")
      router.push("/dashboard")
    } catch (e: any) {
      toast.error(`Delete failed: ${e.message || e}`)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Manage Server</h1>
            <div className="text-sm text-muted-foreground">ID: {id}</div>
          </div>
          <div className="flex gap-2">
            <Button onClick={running ? handleStop : handleStart} className="gap-2">
              {running ? "Stop" : "Start"}
            </Button>
            <Button variant="outline" onClick={handleRestart}>
              Restart
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {isLoading ? "Loading..." : `Server status: ${status?.status || "unknown"}`}
          </CardContent>
        </Card>

        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="commands">Commands</TabsTrigger>
            <TabsTrigger value="mods">Mods</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="mt-4">
            <LogsPanel serverId={id} />
          </TabsContent>

          <TabsContent value="commands" className="mt-4">
            <CommandsPanel serverId={id} />
          </TabsContent>

          <TabsContent value="mods" className="mt-4">
            <ModsPanel serverId={id} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <SettingsPanel serverId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function LogsPanel({ serverId }: { serverId: string }) {
  const [lines, setLines] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const es = new EventSource(`/api/mc/servers/${serverId}/logs/live`)
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        const line = typeof data === "string" ? data : data.lines || ev.data
        setLines((prev) => [...prev.slice(-999), line])
      } catch {
        setLines((prev) => [...prev.slice(-999), ev.data])
      }
    }
    es.onerror = () => {
      // Keep SSE resilient; will reconnect on refresh
      es.close()
    }
    return () => es.close()
  }, [serverId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [lines])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-xs bg-muted rounded-md p-3 h-80 overflow-y-auto">
          {lines.map((l, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {l}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </CardContent>
    </Card>
  )
}

function CommandsPanel({ serverId }: { serverId: string }) {
  const [command, setCommand] = useState("")
  const [sending, setSending] = useState(false)

  async function send() {
    if (!command.trim()) return
    setSending(true)
    try {
      await fetch(`/api/mc/servers/${serverId}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      })
      setCommand("")
      toast.success("Command sent")
    } catch (e: any) {
      toast.error(`Command failed: ${e.message || e}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execute Command</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label htmlFor="cmd">Command</Label>
        <Input id="cmd" value={command} onChange={(e) => setCommand(e.target.value)} placeholder='e.g. say "Hello!"' />
        <Button onClick={send} disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </Button>
      </CardContent>
    </Card>
  )
}

function ModsPanel({ serverId }: { serverId: string }) {
  const { data, mutate } = useSWR(`/api/mc/servers/${serverId}/mods`, fetcher)
  const [modUrl, setModUrl] = useState("")
  const [modName, setModName] = useState("")
  const [installing, setInstalling] = useState(false)

  async function install() {
    if (!modUrl || !modName) return
    setInstalling(true)
    try {
      await fetch(`/api/mc/servers/${serverId}/mods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modUrl, modName }),
      })
      toast.success("Mod install requested")
      setModUrl("")
      setModName("")
      mutate()
    } catch (e: any) {
      toast.error(`Install failed: ${e.message || e}`)
    } finally {
      setInstalling(false)
    }
  }
  async function remove(name: string) {
    try {
      await fetch(`/api/mc/servers/${serverId}/mods/${encodeURIComponent(name)}`, { method: "DELETE" })
      toast.success("Mod removed")
      mutate()
    } catch (e: any) {
      toast.error(`Remove failed: ${e.message || e}`)
    }
  }

  const mods: Array<{ name: string }> = useMemo(() => {
    if (!data) return []
    // Accept array of strings or objects with name
    if (Array.isArray(data)) return data.map((m: any) => (typeof m === "string" ? { name: m } : m))
    if (Array.isArray(data?.mods)) return data.mods.map((m: any) => (typeof m === "string" ? { name: m } : m))
    return []
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mods</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="mod-url">Mod URL</Label>
            <Input id="mod-url" value={modUrl} onChange={(e) => setModUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mod-name">Mod File Name</Label>
            <Input
              id="mod-name"
              value={modName}
              onChange={(e) => setModName(e.target.value)}
              placeholder="fabric-api.jar"
            />
          </div>
        </div>
        <Button onClick={install} disabled={installing}>
          {installing ? "Installing..." : "Install Mod"}
        </Button>

        <div className="mt-6">
          <div className="text-sm font-medium mb-2">Installed Mods</div>
          <div className="rounded-md border divide-y">
            {mods.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3">No mods installed.</div>
            ) : (
              mods.map((m) => (
                <div key={m.name} className="flex items-center justify-between p-3">
                  <span className="text-sm">{m.name}</span>
                  <Button variant="outline" size="sm" onClick={() => remove(m.name)}>
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SettingsPanel({ serverId }: { serverId: string }) {
  const [gamemode, setGamemode] = useState<"survival" | "creative" | "adventure" | "spectator">("survival")
  const [difficulty, setDifficulty] = useState<"peaceful" | "easy" | "normal" | "hard">("easy")
  const [maxPlayers, setMaxPlayers] = useState<number>(20)
  const [whiteList, setWhiteList] = useState<boolean>(false)
  const [pvp, setPvp] = useState<"true" | "false">("true")
  const [enableCommandBlock, setEnableCommandBlock] = useState<boolean>(true)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const body: any = {
        gamemode,
        difficulty,
        "max-players": String(maxPlayers),
        whitelist: String(whiteList),
        pvp,
        enableCommandBlock,
      }
      const res = await fetch(`/api/mc/servers/${serverId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Settings saved")
    } catch (e: any) {
      toast.error(`Save failed: ${e.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Gamemode</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              value={gamemode}
              onChange={(e) => setGamemode(e.target.value as any)}
            >
              <option value="survival">Survival</option>
              <option value="creative">Creative</option>
              <option value="adventure">Adventure</option>
              <option value="spectator">Spectator</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
            >
              <option value="peaceful">Peaceful</option>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mp">Max Players</Label>
            <Input
              id="mp"
              type="number"
              min={1}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label>Whitelist</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              value={whiteList ? "true" : "false"}
              onChange={(e) => setWhiteList(e.target.value === "true")}
            >
              <option value="false">Disabled</option>
              <option value="true">Enabled</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>PvP</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              value={pvp}
              onChange={(e) => setPvp(e.target.value as any)}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Enable Command Block</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              value={enableCommandBlock ? "true" : "false"}
              onChange={(e) => setEnableCommandBlock(e.target.value === "true")}
            >
              <option value="false">Disabled</option>
              <option value="true">Enabled</option>
            </select>
          </div>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  )
}
