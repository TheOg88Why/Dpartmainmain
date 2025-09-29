"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Play,
  Square,
  Trash2,
  ServerIcon,
  Users,
  Activity,
  HardDrive,
  Globe,
  Settings,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type ServerType = {
  id: string
  name: string
  status: "running" | "stopped"
  ramGB: number
  usage: number
  region?: string
  maxPlayers?: number
  currentPlayers?: number
  uptime?: string
  version?: string
  edition?: string
}

export default function ManageServerPage() {
  const params = useParams()
  const router = useRouter()
  const serverId = params.id as string

  const [server, setServer] = useState<ServerType | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchServer()
  }, [serverId])

  async function fetchServer() {
    try {
      const response = await fetch("/api/servers")
      const data = await response.json()
      const foundServer = data.servers.find((s: ServerType) => s.id === serverId)

      if (foundServer) {
        // Add mock additional data for demo
        setServer({
          ...foundServer,
          region: "US East",
          maxPlayers: 20,
          currentPlayers: foundServer.status === "running" ? Math.floor(Math.random() * 15) : 0,
          uptime: foundServer.status === "running" ? "2h 34m" : "—",
          version: "1.21.1",
          edition: "Java",
        })
      } else {
        toast.error("Server not found")
        router.push("/dashboard")
      }
    } catch (error) {
      toast.error("Failed to load server")
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  async function toggleServer() {
    if (!server) return

    setToggling(true)
    const newStatus = server.status === "running" ? "stopped" : "running"

    try {
      // Mock API call - in real app this would be a PATCH request
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setServer((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              currentPlayers: newStatus === "running" ? Math.floor(Math.random() * 15) : 0,
              uptime: newStatus === "running" ? "0m" : "—",
            }
          : null,
      )

      toast.success(`Server ${newStatus === "running" ? "started" : "stopped"}!`)
    } catch (error) {
      toast.error("Failed to toggle server")
    } finally {
      setToggling(false)
    }
  }

  async function deleteServer() {
    if (!server) return

    setDeleting(true)
    try {
      // Mock API call - in real app this would be a DELETE request
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Server deleted successfully!")
      router.push("/dashboard")
    } catch (error) {
      toast.error("Failed to delete server")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl sm:text-2xl font-semibold">Server Not Found</h1>
          <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <ServerIcon className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold">{server.name}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={server.status === "running" ? "default" : "secondary"}>{server.status}</Badge>
                    <span>•</span>
                    <span>
                      {server.edition} {server.version}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={server.status === "running" ? "destructive" : "default"}
                onClick={toggleServer}
                disabled={toggling}
                className="gap-2"
              >
                {toggling ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                  />
                ) : server.status === "running" ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {server.status === "running" ? "Stop" : "Start"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive bg-transparent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Server</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{server.name}"? This action cannot be undone and all server data
                      will be permanently lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteServer}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? "Deleting..." : "Delete Server"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Status Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div
                  className={cn("h-2 w-2 rounded-full", server.status === "running" ? "bg-green-500" : "bg-gray-400")}
                />
                <span className="text-2xl font-bold capitalize">{server.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">Uptime: {server.uptime}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {server.currentPlayers}/{server.maxPlayers}
              </div>
              <p className="text-xs text-muted-foreground">Current / Maximum</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RAM Usage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{server.usage}%</div>
              <p className="text-xs text-muted-foreground">{server.ramGB}GB allocated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Region</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{server.region}</div>
              <p className="text-xs text-muted-foreground">Server location</p>
            </CardContent>
          </Card>
        </div>

        {/* Server Details */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Server Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Edition</span>
                  <span className="font-medium">{server.edition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="font-medium">{server.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Max Players</span>
                  <span className="font-medium">{server.maxPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">RAM</span>
                  <span className="font-medium">{server.ramGB}GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Region</span>
                  <span className="font-medium">{server.region}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Server Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono bg-muted p-3 rounded-md max-h-48 overflow-y-auto">
                <div className="text-green-600">[INFO] Server started successfully</div>
                <div className="text-blue-600">[INFO] Player joined: Steve</div>
                <div className="text-yellow-600">[WARN] Player moved too quickly</div>
                <div className="text-blue-600">[INFO] Player left: Steve</div>
                <div className="text-muted-foreground">[DEBUG] Tick took 15ms</div>
                <div className="text-green-600">[INFO] Auto-save completed</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
