"use client"

import useSWR from "swr"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Request failed: ${r.status}`)
    return r.json()
  })

export default function DeployingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const search = useSearchParams()
  const distro = search.get("distro") || undefined
  const version = search.get("version") || undefined
  const name = search.get("name") || undefined

  const [progressPath, setProgressPath] = useState<string>(`/api/mc/servers/${id}/progress`)
  useEffect(() => {
    try {
      const key = `dp:progressUrl:${id}`
      const stored = typeof window !== "undefined" ? sessionStorage.getItem(key) : null
      if (stored) {
        // Canonicalize to our internal proxy route
        let path = stored
        if (stored.startsWith("http")) {
          try {
            const u = new URL(stored)
            path = u.pathname
          } catch {
            /* ignore */
          }
        }
        if (path.startsWith("/api/servers/")) path = `/api/mc${path}` // proxy through our API
        if (!path.startsWith("/api/mc/")) path = `/api/mc/servers/${id}/progress`
        setProgressPath(path)
      }
    } catch {
      // fall back to default
    }
  }, [id])

  const { data, error, mutate } = useSWR<any>(progressPath, fetcher, { refreshInterval: 2500 })

  useEffect(() => {
    if (error) toast.error(error.message || "Failed to fetch deployment progress")
  }, [error])

  const rawPercent =
    (typeof data?.percent === "number" && data?.percent) ??
    (typeof data?.percentage === "number" && data?.percentage) ??
    (typeof data?.progress === "number" && data?.progress) ??
    (typeof data?.progressPercent === "number" && data?.progressPercent) ??
    0

  const apiStatus = (data?.status || data?.state || "").toString()
  const upstreamMessage = (data?.message || data?.phase || data?.step || "") as string

  const [smoothPercent, setSmoothPercent] = useState(0)
  useEffect(() => {
    if (rawPercent < smoothPercent) return
    const t = setInterval(() => {
      setSmoothPercent((p) => {
        if (p >= rawPercent) return p
        const delta = Math.max(1, Math.round((rawPercent - p) * 0.2))
        return Math.min(p + delta, rawPercent)
      })
    }, 80)
    return () => clearInterval(t)
  }, [rawPercent, smoothPercent])

  const prettyMessage = useMemo(() => {
    const pct = Math.round(smoothPercent)
    if (upstreamMessage) return `${upstreamMessage} (${pct}%)`
    const labelDistro = distro ? (distro === "fabric" ? "Fabric" : distro[0].toUpperCase() + distro.slice(1)) : "Server"
    if (pct <= 10) return `Allocating port… (${pct}%)`
    if (pct <= 35) return `Downloading ${labelDistro}${version ? ` ${version}` : ""} server jar… (${pct}%)`
    if (pct <= 70) return `Installing server files… (${pct}%)`
    if (pct <= 95) return `Starting server… (${pct}%)`
    return `Server is online! (${pct}%)`
  }, [smoothPercent, upstreamMessage, distro, version])

  const isDone = (apiStatus && apiStatus === "running") || rawPercent >= 100
  useEffect(() => {
    if (!isDone) return
    const t = setTimeout(() => router.push("/dashboard"), 1200)
    return () => clearTimeout(t)
  }, [isDone, router])

  const lastProgressRef = useRef<number>(Date.now())
  const lastPctRef = useRef<number>(0)
  useEffect(() => {
    if (rawPercent > lastPctRef.current) {
      lastPctRef.current = rawPercent
      lastProgressRef.current = Date.now()
    }
  }, [rawPercent])

  useEffect(() => {
    const timeoutMs = 3 * 60 * 1000 // 3 minutes
    const i = setInterval(() => {
      if (isDone) return
      const stalled = Date.now() - lastProgressRef.current > timeoutMs
      if (stalled) {
        toast.error("Deployment appears stalled. Please retry or cancel.")
        clearInterval(i)
      }
    }, 5000)
    return () => clearInterval(i)
  }, [isDone])

  const label = useMemo(() => {
    if (distro && version) {
      const pretty = distro[0].toUpperCase() + distro.slice(1)
      return `Deploying ${pretty} ${version} Server… (${Math.round(smoothPercent)}%)`
    }
    return `Deploying Server… (${Math.round(smoothPercent)}%)`
  }, [distro, version, smoothPercent])

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-xl rounded-lg border bg-card p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-balance">{isDone ? "Server Created!" : "Creating Server…"}</h1>
          <p className="text-sm text-muted-foreground">{label}</p>
          {name ? <p className="text-xs text-muted-foreground">Name: {name}</p> : null}
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2 text-sm">
            {error.message || "Deployment failed. Please try again."}
          </div>
        ) : (
          <div className="space-y-3">
            <Progress value={Math.min(100, smoothPercent)} />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{prettyMessage}</div>
              <div className="text-right text-sm text-muted-foreground">
                {Math.min(100, Math.round(smoothPercent))}%
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          {isDone ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-green-600"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Success! Redirecting…</span>
            </motion.div>
          ) : (
            <motion.div
              className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              aria-hidden
            />
          )}

          <div className="flex gap-2">
            {!isDone ? (
              <>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={() => mutate()}>
                  Retry
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => router.push("/dashboard")} className="bg-primary text-primary-foreground">
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => router.push(`/manage/${encodeURIComponent(String(id))}`)}>
                  Manage Server
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
