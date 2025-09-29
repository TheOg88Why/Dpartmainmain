"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PropertiesEditor() {
  const [open, setOpen] = useState(true)
  const [motd, setMotd] = useState("A Minecraft Server")
  const [gamemode, setGamemode] = useState<"survival" | "creative" | "adventure" | "spectator">("survival")
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal")
  const [maxPlayers, setMaxPlayers] = useState(20)

  function save() {
    // eslint-disable-next-line no-alert
    alert("Saved (placeholder)")
  }

  return (
    <Card className="overflow-hidden border border-border bg-card">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="properties-panel"
      >
        <span className="text-base font-semibold">Server Properties</span>
        <span className="text-sm text-muted-foreground">{open ? "Collapse" : "Expand"}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="properties-panel"
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="grid gap-4 p-4 md:grid-cols-2">
              {/* MOTD */}
              <div className="space-y-2">
                <Label htmlFor="motd">MOTD</Label>
                <Input
                  id="motd"
                  value={motd}
                  onChange={(e) => setMotd(e.target.value)}
                  placeholder="Message of the Day"
                />
              </div>

              {/* Gamemode */}
              <div className="space-y-2">
                <Label>Gamemode</Label>
                <Select
                  value={gamemode}
                  onValueChange={(v: "survival" | "creative" | "adventure" | "spectator") => setGamemode(v)}
                >
                  <SelectTrigger aria-label="Gamemode">
                    <SelectValue placeholder="Select a gamemode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="survival">Survival</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="spectator">Spectator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={(v: "easy" | "normal" | "hard") => setDifficulty(v)}>
                  <SelectTrigger aria-label="Difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Players */}
              <div className="space-y-2">
                <Label htmlFor="maxPlayers">Max Players</Label>
                <Input
                  id="maxPlayers"
                  type="number"
                  min={1}
                  max={100}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border p-4">
              <Button variant="outline">Cancel</Button>
              <Button onClick={save}>Save Changes</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
