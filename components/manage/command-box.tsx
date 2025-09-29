"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CommandBox() {
  const [cmd, setCmd] = useState("")
  const [responses, setResponses] = useState<string[]>([])

  function send() {
    if (!cmd.trim()) return
    setResponses((r) => [`Executed: ${cmd}`, ...r])
    setCmd("")
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      send()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Command</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type Minecraft command…"
            aria-label="Minecraft command"
          />
          <Button onClick={send}>Send</Button>
        </div>
        <div className="max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          {responses.length === 0 ? (
            <p className="text-muted-foreground">No responses yet.</p>
          ) : (
            <ul className="space-y-2">
              {responses.map((r, i) => (
                <li key={i} className="leading-6">
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
