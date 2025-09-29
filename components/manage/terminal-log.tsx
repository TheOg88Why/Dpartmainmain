"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sampleLines = [
  '[Server] Preparing level "world"',
  '[Server] Done (3.214s)! For help, type "help"',
  "[Server] Loading properties",
  "[Server] Starting minecraft server version 1.20.1",
  "[Server] New player joined: Steve",
  "[Server] Saving chunks",
]

export function TerminalLog() {
  const [lines, setLines] = useState<string[]>([])
  const [autoAppend, setAutoAppend] = useState(true)
  const boxRef = useRef<HTMLDivElement>(null)

  // Append fake logs periodically
  useEffect(() => {
    if (!autoAppend) return
    const id = setInterval(() => {
      setLines((prev) => [...prev, sampleLines[Math.floor(Math.random() * sampleLines.length)]])
    }, 1200)
    return () => clearInterval(id)
  }, [autoAppend])

  // Auto scroll to bottom
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [lines])

  const placeholder = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-4 w-full animate-pulse rounded bg-muted/60" aria-hidden />
      )),
    [],
  )

  function onClear() {
    setLines([])
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Terminal Log</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setAutoAppend((v) => !v)} aria-pressed={autoAppend}>
            {autoAppend ? "Pause" : "Resume"}
          </Button>
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear Logs
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={boxRef}
          className="h-[420px] w-full overflow-auto rounded-md border border-border bg-black/80 p-3 font-mono text-sm text-white"
          role="log"
          aria-live="polite"
        >
          {lines.length === 0 ? (
            <div className="space-y-2">{placeholder}</div>
          ) : (
            <pre className="whitespace-pre-wrap leading-6">
              {lines.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
