"use client"

import type React from "react"

import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Mod = { name: string }

export function ModManager() {
  const [mods, setMods] = useState<Mod[]>([
    { name: "Sodium-0.5.2.jar" },
    { name: "Lithium-0.11.1.jar" },
    { name: "Fabric-API-0.92.1.jar" },
  ])
  const [isOver, setIsOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length) {
      setMods((prev) => [...prev, ...files.map((f) => ({ name: f.name || "mod.jar" }))])
    }
  }, [])

  const onChoose = () => inputRef.current?.click()

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length) {
      setMods((prev) => [...prev, ...files.map((f) => ({ name: f.name || "mod.jar" }))])
    }
  }

  function remove(name: string) {
    setMods((m) => m.filter((x) => x.name !== name))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mods</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsOver(true)
          }}
          onDragLeave={() => setIsOver(false)}
          onDrop={onDrop}
          onClick={onChoose}
          role="button"
          aria-label="Upload mods"
          className={[
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            isOver ? "border-primary bg-primary/5" : "border-border bg-muted/30",
          ].join(" ")}
        >
          <input ref={inputRef} type="file" accept=".jar" multiple className="sr-only" onChange={onFileChange} />
          <p className="text-sm text-muted-foreground">Drag & drop .jar files here, or click to select</p>
        </div>

        <div className="space-y-2">
          {mods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No mods uploaded.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {mods.map((m) => (
                <li key={m.name} className="flex items-center justify-between bg-card px-4 py-2">
                  <span className="text-sm">{m.name}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(m.name)}
                    aria-label={`Delete ${m.name}`}
                  >
                    ❌
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
