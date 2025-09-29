"use client"

import { Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function TopBar() {
  // Pretend status — could be "running" | "stopped"
  const status: "running" | "stopped" = "running"

  return (
    <header className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <h1 className="text-pretty text-lg font-semibold leading-6 md:text-xl">Minecraft Server Name</h1>
        <Badge variant={status === "running" ? "default" : "destructive"} className="capitalize" aria-live="polite">
          {status === "running" ? "Running" : "Stopped"}
        </Badge>
      </div>
      <Button variant="ghost" size="icon" aria-label="Open settings">
        <Settings className="size-5" />
      </Button>
    </header>
  )
}
