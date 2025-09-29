"use client"

import type React from "react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import PlanSelectionStep, { type Plan } from "./plan-selection-step"
import SuccessAnimation from "./success-animation"

// Types
type Edition = "java" | "bedrock"
type JavaDistro = "vanilla" | "paper" | "fabric" | "forge"
type BedrockPlatform = "android_windows" | "consoles"
type Region = "US" | "EU" | "Asia" | "SA"

export type CreateServerPayload = {
  name: string
  motd?: string
  edition: Edition
  java?: {
    distro: JavaDistro
    version: string
    mods: boolean
  }
  bedrock?: {
    version: string
    platform: BedrockPlatform
  }
  region: Region
  maxPlayers: number
  autoShutdown: boolean
  backups: boolean
  ramGB: number
  plan: Plan
  advanced?: {
    gamemode?: "survival" | "creative" | "adventure" | "spectator"
    difficulty?: "peaceful" | "easy" | "normal" | "hard"
    whiteList?: boolean
    allowFlight?: boolean
    enableCommandBlock?: boolean
  }
}

export default function CreateServerWizard({
  onCancel,
  onComplete,
  autoDeployOnReview = false,
}: {
  onCancel: () => void
  onComplete: (payload: CreateServerPayload) => Promise<void> | void
  autoDeployOnReview?: boolean
}) {
  // Step control - now 0-3 (plan, details, config, review)
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Step 0 — Plan Selection
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  // Step 1 — Server Details (fixed input focus issue with useCallback)
  const [name, setName] = useState("")
  const [motd, setMotd] = useState("")
  const [edition, setEdition] = useState<Edition>("java")

  const [javaDistro, setJavaDistro] = useState<JavaDistro>("vanilla")
  const [javaVersion, setJavaVersion] = useState<string>("1.21.1")
  const [mods, setMods] = useState<boolean>(false)

  const [bedrockVersion, setBedrockVersion] = useState<string>("1.21.20")
  const [bedrockPlatform, setBedrockPlatform] = useState<BedrockPlatform>("android_windows")

  // Step 2 — Region & Config
  const [region, setRegion] = useState<Region>("US")
  const [maxPlayers, setMaxPlayers] = useState<number>(10)
  const [autoShutdown, setAutoShutdown] = useState<boolean>(true)
  const [backups, setBackups] = useState<boolean>(false)

  // Advanced settings
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false)
  const [advGamemode, setAdvGamemode] = useState<"survival" | "creative" | "adventure" | "spectator">("survival")
  const [advDifficulty, setAdvDifficulty] = useState<"peaceful" | "easy" | "normal" | "hard">("easy")
  const [advWhitelist, setAdvWhitelist] = useState<boolean>(false)
  const [advAllowFlight, setAdvAllowFlight] = useState<boolean>(true)
  const [advCommandBlock, setAdvCommandBlock] = useState<boolean>(true)

  // Version lists (mock)
  const javaVersions = ["1.21.1", "1.21", "1.20.6", "1.20.4"]
  const bedrockVersions = ["1.21.20", "1.21.10", "1.21.0"]

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }, [])

  const handleMotdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMotd(e.target.value)
  }, [])

  // Update max players based on selected plan
  const updatePlanDefaults = useCallback((plan: Plan) => {
    setSelectedPlan(plan)
    // Set default max players based on plan
    if (plan.id === "free") {
      setMaxPlayers(10)
      setBackups(false)
    } else if (plan.id === "standard") {
      setMaxPlayers(50)
      setBackups(true)
    } else if (plan.id === "pro") {
      setMaxPlayers(100)
      setBackups(true)
    }
  }, [])

  // Live price estimate
  const estimatedPrice = useMemo(() => {
    if (!selectedPlan) return "0.00"
    let base = Number.parseFloat(selectedPlan.price.replace("$", ""))
    if (edition === "java") {
      if (javaDistro === "fabric" || javaDistro === "forge") base += 2
    }
    const playersFee =
      Math.max(0, maxPlayers - (selectedPlan.id === "free" ? 10 : selectedPlan.id === "standard" ? 50 : 100)) * 0.2
    const backupFee = backups && selectedPlan.id === "free" ? 2 : 0
    return (base + playersFee + backupFee).toFixed(2)
  }, [selectedPlan, edition, javaDistro, maxPlayers, backups])

  // Derive RAM for API
  const ramGB = useMemo(() => {
    if (!selectedPlan) return 1
    if (selectedPlan.id === "free") return 1
    if (selectedPlan.id === "standard") return 4
    return 8
  }, [selectedPlan])

  function canGoNextFromDetails() {
    if (!name.trim()) return false
    if (edition === "java" && !javaVersion) return false
    if (edition === "bedrock" && !bedrockVersion) return false
    return true
  }

  function renderStepIndicator() {
    const steps = ["Select Plan", "Server Details", "Configuration", "Review & Confirm"]
    return (
      <div className="border-b p-3 sm:p-4">
        <ol className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm overflow-x-auto">
          {steps.map((label, idx) => {
            const i = idx as 0 | 1 | 2 | 3
            const active = step === i
            const done = step > i
            return (
              <li key={label} className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                <motion.span
                  className={cn(
                    "size-5 sm:size-6 rounded-full border grid place-items-center text-xs transition-colors",
                    done
                      ? "bg-primary text-primary-foreground border-primary"
                      : active
                        ? "bg-accent text-foreground border-primary"
                        : "bg-muted text-muted-foreground",
                  )}
                  animate={active ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  aria-hidden
                >
                  {done ? <CheckCircle2 className="h-3 w-3" /> : idx + 1}
                </motion.span>
                <span className={cn("text-muted-foreground hidden sm:inline", active && "text-foreground font-medium")}>
                  {label}
                </span>
                {idx < steps.length - 1 && <span className="mx-1 sm:mx-2 h-3 sm:h-4 w-px bg-border" aria-hidden />}
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  function StepDetails() {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="p-3 sm:p-6 space-y-4 sm:space-y-6"
      >
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="server-name">Server Name</Label>
            <Input
              id="server-name"
              placeholder="My Minecraft Server"
              value={name}
              onChange={handleNameChange}
              aria-required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motd">MOTD</Label>
            <Input id="motd" placeholder="Welcome to AuraDeploy!" value={motd} onChange={handleMotdChange} />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Edition</Label>
          <RadioGroup
            value={edition}
            onValueChange={(v) => setEdition(v as Edition)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:max-w-md"
            aria-label="Select edition"
          >
            <div className="flex items-center gap-2 rounded-md border p-3">
              <RadioGroupItem id="ed-java" value="java" />
              <Label htmlFor="ed-java" className="cursor-pointer">
                Java Edition
              </Label>
            </div>
            <div className="flex items-center gap-2 rounded-md border p-3">
              <RadioGroupItem id="ed-bedrock" value="bedrock" />
              <Label htmlFor="ed-bedrock" className="cursor-pointer">
                Bedrock Edition
              </Label>
            </div>
          </RadioGroup>
        </div>

        {edition === "java" ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label>Distribution</Label>
              <Select value={javaDistro} onValueChange={(v) => setJavaDistro(v as JavaDistro)}>
                <SelectTrigger aria-label="Select Java distribution">
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Java Distribution</SelectLabel>
                    <SelectItem value="vanilla">Vanilla</SelectItem>
                    <SelectItem value="paper">Paper</SelectItem>
                    <SelectItem value="fabric">Fabric</SelectItem>
                    <SelectItem value="forge">Forge</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Version</Label>
              <Select value={javaVersion} onValueChange={setJavaVersion}>
                <SelectTrigger aria-label="Select Java version">
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Java Version</SelectLabel>
                    {javaVersions.map((v) => (
                      <SelectItem value={v} key={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {(javaDistro === "fabric" || javaDistro === "forge") && (
              <div className="col-span-full flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">Enable Mods</div>
                  <div className="text-sm text-muted-foreground">Only available for Fabric/Forge.</div>
                </div>
                <Switch checked={mods} onCheckedChange={setMods} aria-label="Enable mods" />
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Version</Label>
              <Select value={bedrockVersion} onValueChange={setBedrockVersion}>
                <SelectTrigger aria-label="Select Bedrock version">
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Bedrock Version</SelectLabel>
                    {bedrockVersions.map((v) => (
                      <SelectItem value={v} key={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={bedrockPlatform} onValueChange={(v) => setBedrockPlatform(v as BedrockPlatform)}>
                <SelectTrigger aria-label="Select Bedrock platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Platform</SelectLabel>
                    <SelectItem value="android_windows">Android / Windows</SelectItem>
                    <SelectItem value="consoles">Consoles</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  function StepRegionAndConfig() {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="p-3 sm:p-6 space-y-4 sm:space-y-6"
      >
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Region</Label>
            <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
              <SelectTrigger aria-label="Select region">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Region</SelectLabel>
                  <SelectItem value="Asia">Asia</SelectItem>
                  <SelectItem value="EU">EU</SelectItem>
                  <SelectItem value="US">US</SelectItem>
                  <SelectItem value="SA">SA</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-players">Max Players</Label>
            <Input
              id="max-players"
              type="number"
              min={1}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value || 0))}
            />
            <p className="text-xs text-muted-foreground">Based on your {selectedPlan?.name} plan</p>
          </div>

          <div className="space-y-2">
            <div className="flex h-10 items-center justify-between rounded-md border px-3">
              <span className="text-sm">Auto-Shutdown</span>
              <Switch checked={autoShutdown} onCheckedChange={setAutoShutdown} aria-label="Auto shutdown" />
            </div>
            <div className="flex h-10 items-center justify-between rounded-md border px-3">
              <span className="text-sm">Backups</span>
              <Switch checked={backups} onCheckedChange={setBackups} aria-label="Backups" />
            </div>
          </div>
        </div>

        <div className="rounded-md border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Advanced Settings</div>
              <div className="text-sm text-muted-foreground">Optional server.properties</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setAdvancedOpen((v) => !v)}>
              {advancedOpen ? "Hide" : "Show"}
            </Button>
          </div>
          {advancedOpen && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Gamemode</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={advGamemode}
                  onChange={(e) => setAdvGamemode(e.target.value as any)}
                >
                  <option value="survival">Survival</option>
                  <option value="creative">Creative</option>
                  <option value="adventure">Adventure</option>
                  <option value="spectator">Spectator</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={advDifficulty}
                  onChange={(e) => setAdvDifficulty(e.target.value as any)}
                >
                  <option value="peaceful">Peaceful</option>
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Whitelist</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={advWhitelist ? "true" : "false"}
                  onChange={(e) => setAdvWhitelist(e.target.value === "true")}
                >
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Allow Flight</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={advAllowFlight ? "true" : "false"}
                  onChange={(e) => setAdvAllowFlight(e.target.value === "true")}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Enable Command Block</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={advCommandBlock ? "true" : "false"}
                  onChange={(e) => setAdvCommandBlock(e.target.value === "true")}
                >
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Estimated Price</div>
              <div className="text-sm text-muted-foreground">Live estimate based on your selections</div>
            </div>
            <div className="text-xl font-semibold">${estimatedPrice}/mo</div>
          </div>
        </div>
      </motion.div>
    )
  }

  function StepReview() {
    const summary = {
      Plan: selectedPlan?.name || "—",
      Name: name,
      MOTD: motd || "—",
      Edition: edition === "java" ? "Java" : "Bedrock",
      Version:
        edition === "java"
          ? `${javaVersion} (${javaDistro})`
          : `${bedrockVersion} (${bedrockPlatform === "android_windows" ? "Android/Windows" : "Consoles"})`,
      Mods:
        edition === "java"
          ? javaDistro === "fabric" || javaDistro === "forge"
            ? mods
              ? "Enabled"
              : "Disabled"
            : "N/A"
          : "N/A",
      Region: region,
      Players: maxPlayers,
      Gamemode: advGamemode,
      Difficulty: advDifficulty,
      Whitelist: advWhitelist ? "Enabled" : "Disabled",
      AllowFlight: advAllowFlight ? "Yes" : "No",
      CommandBlock: advCommandBlock ? "Enabled" : "Disabled",
    }

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="p-3 sm:p-6 space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle>Review Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {Object.entries(summary).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-md border p-3">
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="font-medium text-right">{String(value)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <div className="text-sm text-muted-foreground">Final Price</div>
            <div className="text-xl font-semibold">${estimatedPrice}/mo</div>
          </div>
          <div className="text-sm text-muted-foreground text-right">
            RAM: {selectedPlan?.ram} • CPU: {selectedPlan?.cpu}
          </div>
        </div>
      </motion.div>
    )
  }

  async function handleSubmit() {
    if (!selectedPlan) return

    setSubmitting(true)
    setErrorMsg(null)
    toast.loading("Creating your server...")

    const payload: CreateServerPayload = {
      name,
      motd: motd || undefined,
      edition,
      java:
        edition === "java"
          ? {
              distro: javaDistro,
              version: javaVersion,
              mods: javaDistro === "fabric" || javaDistro === "forge" ? mods : false,
            }
          : undefined,
      bedrock:
        edition === "bedrock"
          ? {
              version: bedrockVersion,
              platform: bedrockPlatform,
            }
          : undefined,
      region,
      maxPlayers,
      autoShutdown,
      backups,
      ramGB,
      plan: selectedPlan,
      advanced: {
        gamemode: advGamemode,
        difficulty: advDifficulty,
        whiteList: advWhitelist,
        allowFlight: advAllowFlight,
        enableCommandBlock: advCommandBlock,
      },
    }

    try {
      await onComplete(payload)
      toast.dismiss()
      // We immediately navigate to deploying page from onComplete.
      // Keep submitting state true to disable actions until navigation.
    } catch (error: any) {
      toast.dismiss()
      setErrorMsg(error?.message || "Failed to create server. Please try again.")
      toast.error(errorMsg || "Failed to create server. Please try again.")
      setSubmitting(false)
    }
  }

  // Auto-generate name if user did not type one
  // Keeps name empty state friendly, but fills when transitioning across version/distro
  function generateDefaultName() {
    if (edition === "java") {
      return `${javaDistro}-${javaVersion.replaceAll(".", "-")}-test`
    }
    return `bedrock-${bedrockVersion.replaceAll(".", "-")}-test`
  }

  // If user hasn't typed a name, keep it auto-generated based on current selection
  // This only sets when name is empty to avoid overriding manual input.
  useEffect(() => {
    if (!name.trim()) {
      setName(generateDefaultName())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edition, javaDistro, javaVersion, bedrockVersion])

  // Auto-submit once user reaches Review step, if enabled
  useEffect(() => {
    if (autoDeployOnReview && step === 3 && !submitting) {
      void handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDeployOnReview, step])

  const handleNext = () => {
    if (step === 0) {
      toast.success(`${selectedPlan?.name} plan selected!`)
    } else if (step === 1) {
      toast.success("Server details configured!")
    } else if (step === 2) {
      toast.success("Configuration complete!")
    }
    setStep((s) => (s + 1) as 1 | 2 | 3)
  }

  const handleBack = () => {
    setStep((s) => (s - 1) as 0 | 1 | 2)
  }

  // Lightweight "Creating Server..." screen while the deploy request is in-flight
  // Smoothly animates up to 20% as a visual cue until we navigate to the deploying page.
  const [preProgress, setPreProgress] = useState(0)
  useEffect(() => {
    if (!submitting) return
    let t: any
    const tick = () => {
      setPreProgress((p) => {
        if (p >= 20) return p
        return p + 1
      })
      t = setTimeout(tick, 100)
    }
    t = setTimeout(tick, 200)
    return () => clearTimeout(t)
  }, [submitting])

  function CreatingScreen() {
    const label =
      edition === "java"
        ? `${javaDistro[0].toUpperCase()}${javaDistro.slice(1)} ${javaVersion}`
        : `Bedrock ${bedrockVersion}`
    return (
      <div className="p-6">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <h2 className="text-xl font-semibold">Creating Server…</h2>
          <p className="text-sm text-muted-foreground">
            Deploying {label} Server… ({preProgress}%)
          </p>
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded bg-muted">
              <div
                className="h-2 rounded bg-primary transition-all"
                style={{ width: `${preProgress}%` }}
                aria-valuenow={preProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
              />
            </div>
            <p className="text-xs text-muted-foreground">This will take a moment…</p>
          </div>
          {errorMsg && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2 text-sm text-left">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (showSuccess) {
    return <SuccessAnimation serverName={name} onComplete={onCancel} />
  }

  return (
    <div className="w-full max-h-[90vh] flex flex-col">
      {renderStepIndicator()}

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {submitting ? (
            <CreatingScreen />
          ) : (
            <>
              {step === 0 && (
                <PlanSelectionStep
                  selectedPlan={selectedPlan}
                  onPlanSelect={updatePlanDefaults}
                  onNext={handleNext}
                  onCancel={onCancel}
                />
              )}
              {step === 1 && <StepDetails />}
              {step === 2 && <StepRegionAndConfig />}
              {step === 3 && <StepReview />}
            </>
          )}
        </AnimatePresence>
      </div>

      {step > 0 && (
        <div className="flex items-center justify-between border-t px-3 py-3 sm:px-6 bg-background">
          <div className="text-sm text-muted-foreground">Step {Math.min(step + 1, 4)} of 4</div>
          <div className="flex gap-2">
            {/* Disable Back/Next during deployment */}
            <Button variant="outline" onClick={handleBack} size="sm" disabled={submitting}>
              Back
            </Button>
            {step < 3 ? (
              <Button
                className="bg-primary text-primary-foreground"
                onClick={handleNext}
                disabled={(step === 1 && !canGoNextFromDetails()) || submitting}
                size="sm"
              >
                Next
              </Button>
            ) : (
              <Button
                className="bg-primary text-primary-foreground"
                onClick={handleSubmit}
                disabled={submitting}
                size="sm"
              >
                {submitting ? "Creating..." : "Create Server"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
