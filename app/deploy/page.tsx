"use client"

import { useRouter } from "next/navigation"
import CreateServerWizard, { type CreateServerPayload } from "@/components/dashboard/create-server-wizard"
import { toast } from "sonner"
import { useState } from "react"

interface DeployResponse {
  success: boolean
  serverId: string
  status: string
  message: string
  progressUrl: string
  logsUrl: string
  commandUrl: string
}

interface ProgressResponse {
  percent: number
  message: string
  status: string
}

export default function DeployPage() {
  const router = useRouter()
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployProgress, setDeployProgress] = useState(0)
  const [deployMessage, setDeployMessage] = useState("")
  const [deployedServerId, setDeployedServerId] = useState<string | null>(null)

  const pollProgress = async (progressUrl: string) => {
    const fullUrl = `/api/mc${progressUrl}`

    try {
      const response = await fetch(fullUrl)

      if (!response.ok) {
        throw new Error(`Progress check failed: ${response.status}`)
      }

      const data: ProgressResponse = await response.json()
      setDeployProgress(data.percent || 0)
      setDeployMessage(data.message || "Deploying...")

      // Continue polling if not complete
      if (data.percent < 100 && data.status !== "running") {
        setTimeout(() => pollProgress(progressUrl), 3000)
      } else {
        // Deployment complete
        setDeployMessage("✅ Server Deployed Successfully")
      }
    } catch (error) {
      console.error("[v0] Progress polling error:", error)
      setDeployMessage("Error checking deployment progress")
    }
  }

  async function onComplete(payload: CreateServerPayload) {
    setIsDeploying(true)
    setDeployProgress(0)
    setDeployMessage("Starting deployment...")

    const distro = payload.edition === "java" ? payload.java?.distro || "vanilla" : "vanilla"
    const version = payload.edition === "java" ? payload.java?.version : payload.bedrock?.version

    if (!version) {
      toast.error("Please select a valid version for your edition.")
      setIsDeploying(false)
      throw new Error("Missing version")
    }

    const generatedName = `${distro}-${version.replace(/\./g, "-")}-test`
    const serverName = payload.name && payload.name.trim() ? payload.name : generatedName

    const body = {
      edition: distro,
      version,
      motd: payload.motd || `✨ ${distro[0].toUpperCase()}${distro.slice(1)} ${version} Server by AuraDeploy ✨`,
      ram: payload.ramGB ?? 2,
      serverName,
      gamemode: payload.advanced?.gamemode ?? "survival",
      difficulty: payload.advanced?.difficulty ?? "normal",
      maxPlayers: payload.maxPlayers ?? 20,
      onlineMode: false,
      loadingScreen: {
        enabled: true,
        type: "percentage",
        percentage: 10,
      },
    }

    try {
      const res = await fetch("/api/mc/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const msg = await res.text()
        toast.error(`Deploy failed: ${msg}`)
        setIsDeploying(false)
        throw new Error(msg)
      }

      const data: DeployResponse = await res.json()

      if (!data.success || !data.serverId) {
        toast.error("Deployment failed: No serverId returned")
        setIsDeploying(false)
        throw new Error("No serverId")
      }

      setDeployedServerId(data.serverId)

      // Store for later use
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("lastDeployedServerId", data.serverId)
          if (data.progressUrl) sessionStorage.setItem(`dp:progressUrl:${data.serverId}`, data.progressUrl)
          if (data.logsUrl) sessionStorage.setItem(`dp:logsUrl:${data.serverId}`, data.logsUrl)
          if (data.commandUrl) sessionStorage.setItem(`dp:commandUrl:${data.serverId}`, data.commandUrl)
        }
      } catch {
        /* ignore */
      }

      if (data.progressUrl) {
        pollProgress(data.progressUrl)
      }
    } catch (error: any) {
      setIsDeploying(false)
      throw error
    }
  }

  const handleManageServer = () => {
    if (deployedServerId) {
      router.push(`/manage/${deployedServerId}`)
    }
  }

  if (isDeploying) {
    const isComplete = deployProgress >= 100 || deployMessage.includes("✅")

    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 flex items-center justify-center">
        <div className="max-w-md mx-auto space-y-6 text-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              {isComplete ? "🎉 Deployment Complete!" : "🚀 Deploying Server..."}
            </h2>
            <p className="text-muted-foreground">{deployMessage}</p>
          </div>

          <div className="space-y-2">
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-3 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${deployProgress}%` }}
                aria-valuenow={deployProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
              />
            </div>
            <p className="text-sm text-muted-foreground">{deployProgress}%</p>
          </div>

          {isComplete && deployedServerId && (
            <div className="space-y-3 pt-4">
              <div className="text-green-600 font-medium">✅ Server Deployed Successfully</div>
              <button
                onClick={handleManageServer}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                🚀 Manage Server
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-3xl mx-auto rounded-lg border bg-card">
        <CreateServerWizard onCancel={() => router.push("/dashboard")} onComplete={onComplete} autoDeployOnReview />
      </div>
    </div>
  )
}
