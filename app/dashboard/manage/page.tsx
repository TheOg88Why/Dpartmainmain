"use client"

import { TopBar } from "@/components/manage/top-bar"
import { TerminalLog } from "@/components/manage/terminal-log"
import { CommandBox } from "@/components/manage/command-box"
import { ServerActions } from "@/components/manage/server-actions"
import { ModManager } from "@/components/manage/mod-manager"
import { PropertiesEditor } from "@/components/manage/properties-editor"

export default function ManageDashboardPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <TopBar />
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section aria-label="Server Logs" className="min-h-[420px]">
            <TerminalLog />
          </section>
          <section aria-label="Controls and Mods" className="space-y-6">
            <CommandBox />
            <ServerActions />
            <ModManager />
          </section>
        </div>
        <section aria-label="Server Properties" className="mt-8">
          <PropertiesEditor />
        </section>
      </div>
    </main>
  )
}
