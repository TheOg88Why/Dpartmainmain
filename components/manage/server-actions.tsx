"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Square, RotateCw } from "lucide-react"

export function ServerActions() {
  const baseStyle =
    "group flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-transform hover:scale-[1.01] focus-visible:scale-[1.01] outline-none"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Server Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {/* Start */}
          <Button className={`${baseStyle} hover:ring-2 hover:ring-primary/50`} variant="secondary">
            <Play className="size-5 opacity-80 transition-transform group-hover:scale-110" />
            <span className="font-medium">Start</span>
          </Button>
          {/* Stop */}
          <Button className={`${baseStyle} hover:ring-2 hover:ring-destructive/50`} variant="outline">
            <Square className="size-5 opacity-80 transition-transform group-hover:scale-110" />
            <span className="font-medium">Stop</span>
          </Button>
          {/* Restart */}
          <Button className={`${baseStyle} hover:ring-2 hover:ring-primary/40`} variant="secondary">
            <RotateCw className="size-5 opacity-80 transition-transform group-hover:scale-110" />
            <span className="font-medium">Restart</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
