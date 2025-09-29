"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Settings, Trash2 } from "lucide-react"
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

export type Server = {
  id: string
  name: string
  status: "running" | "stopped"
  ramGB: number
  usage: number
}

interface ServerCardProps {
  server: Server
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  isToggling: boolean
}

export default function ServerCard({ server, onToggle, onDelete, isToggling }: ServerCardProps) {
  const router = useRouter()
  const running = server.status === "running"

  const handleManageClick = () => {
    router.push(`/servers/${server.id}`)
  }

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="truncate">{server.name}</span>
            <Badge variant={running ? "default" : "secondary"}>{server.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">{server.ramGB} GB RAM</div>
          <div>
            <div className="mb-1 text-xs text-muted-foreground">RAM Usage</div>
            <Progress value={server.usage} />
            <div className="text-xs text-muted-foreground mt-1">{server.usage}%</div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleManageClick} className="flex-1 gap-2 bg-transparent">
            <Settings className="h-4 w-4" />
            Manage
          </Button>
          <Button
            variant={running ? "destructive" : "default"}
            size="sm"
            className={!running ? "bg-primary text-primary-foreground" : ""}
            onClick={() => onToggle(server.id)}
            disabled={isToggling}
          >
            {isToggling ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
              />
            ) : running ? (
              "Stop"
            ) : (
              "Start"
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive bg-transparent">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Server</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{server.name}"? This action cannot be undone and all server data will
                  be permanently lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(server.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Server
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
