"use client"

import useSWR from "swr"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import ServerCard from "@/components/dashboard/server-card"
import { useAuth, authenticatedApiCall } from "@/components/auth-provider"
import { Plus, LogOut, Server, CreditCard, User, RefreshCw } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import CreateServerWizard from "@/components/dashboard/create-server-wizard"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import LogoutConfirmationDialog from "@/components/logout-confirmation-dialog"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

// Custom fetcher that uses authenticatedApiCall
const fetcher = (url: string) => authenticatedApiCall(url).then((data) => data.data)

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const { data, isLoading, error, mutate } = useSWR<{ servers: any[] }>(isAuthenticated ? "/servers" : null, fetcher, {
    refreshInterval: 30000,
  })

  const [openWizard, setOpenWizard] = useState(false)
  const [creatingServer, setCreatingServer] = useState(false)
  const [togglingServer, setTogglingServer] = useState<string | null>(null)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-3xl font-semibold">Sign in required</h1>
        <p className="text-muted-foreground mt-2">Please login or register to access your dashboard.</p>
      </section>
    )
  }

  const handleCreateServer = async (payload: any) => {
    setCreatingServer(true)
    try {
      const response = await authenticatedApiCall("/servers", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      await mutate()
      setOpenWizard(false)

      // Redirect to the new server's management page
      if (response.data?.server?.id) {
        router.push(`/servers/${response.data.server.id}`)
      }
    } catch (err: any) {
      console.error("Failed to create server:", err)
      toast.error(err.message || "Failed to create server. Please try again.")
    } finally {
      setCreatingServer(false)
    }
  }

  const handleToggleServer = async (id: string) => {
    setTogglingServer(id)
    try {
      // Optimistic update
      if (!data?.servers) return

      const nextServers = data.servers.map((s) =>
        s.id === id
          ? {
              ...s,
              status: s.status === "running" ? "stopped" : "running",
              usage: s.status === "running" ? 0 : Math.floor(Math.random() * 100) + 1,
            }
          : s,
      )

      mutate({ servers: nextServers }, false)

      // Actual API call
      await authenticatedApiCall(`/servers/${id}/toggle`, {
        method: "POST",
      })

      // Revalidate to get actual server state
      await mutate()

      const newStatus = nextServers.find((s) => s.id === id)?.status
      toast.success(`Server ${newStatus === "running" ? "started" : "stopped"}!`)
    } catch (err: any) {
      console.error("Failed to toggle server:", err)
      toast.error(err.message || "Failed to toggle server. Please try again.")
      await mutate()
    } finally {
      setTogglingServer(null)
    }
  }

  const handleDeleteServer = async (id: string) => {
    try {
      // Optimistic update
      if (!data?.servers) return

      const nextServers = data.servers.filter((s) => s.id !== id)
      mutate({ servers: nextServers }, false)

      await authenticatedApiCall(`/servers/${id}`, {
        method: "DELETE",
      })

      toast.success("Server deleted successfully!")
    } catch (err: any) {
      console.error("Failed to delete server:", err)
      toast.error(err.message || "Failed to delete server. Please try again.")
      await mutate()
    }
  }

  const handleLogout = () => {
    setShowLogoutDialog(true)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutDialog(false)
    router.push("/login")
  }

  const servers = data?.servers || []

  // Helper for user initials fallback
  const initials =
    (user?.username || user?.email || "U")
      .split("@")[0]
      .split(" ")
      .map((p) => p[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "U"

  return (
    <>
      <SidebarProvider>
        <Sidebar className="border-r">
          <SidebarHeader className="px-3 py-2">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="font-medium">AuraDeploy</span>
            </div>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive>
                      <a href="#" className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        My Servers
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="#billing" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Billing
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-2">
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={"/placeholder.svg?height=64&width=64&query=user%20avatar"} alt="User avatar" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{user?.username || user?.email}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
              </div>
              <Button variant="outline" size="sm" className="bg-transparent" onClick={handleLogout}>
                <LogOut className="h-3 w-3 mr-1" />
                Logout
              </Button>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="px-3 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-4 sm:mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  Welcome back, {user?.username || user?.email}! Manage your servers and deployments.
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Open user menu"
                    className="rounded-full ring-1 ring-border hover:ring-2 transition p-0.5"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={"/placeholder.svg?height=72&width=72&query=user%20avatar"} alt="User avatar" />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-sm">{user?.username || user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/profile")}>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">My Servers</h2>
                <p className="text-muted-foreground text-sm">
                  {servers.length} server{servers.length !== 1 ? "s" : ""} deployed
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => mutate()} disabled={isLoading} size="sm">
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  onClick={() => setOpenWizard(true)}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" /> Create Server
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <Skeleton className="mb-2 h-5 w-1/2" />
                    <Skeleton className="mb-2 h-4 w-1/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="mt-3 h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : servers.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 sm:p-8 text-center">
                <Server className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No servers yet</h3>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                  Get started by creating your first server.
                </p>
                <Button onClick={() => setOpenWizard(true)} className="mt-4" size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Server
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {servers.map((server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    onToggle={handleToggleServer}
                    onDelete={handleDeleteServer}
                    isToggling={togglingServer === server.id}
                  />
                ))}
              </div>
            )}
          </div>
        </SidebarInset>

        <Dialog open={openWizard} onOpenChange={setOpenWizard}>
          <DialogContent className="w-[95vw] max-w-2xl p-0 max-h-[95vh]">
            <CreateServerWizard onCancel={() => setOpenWizard(false)} onComplete={handleCreateServer} />
          </DialogContent>
        </Dialog>
      </SidebarProvider>

      <LogoutConfirmationDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} onConfirm={confirmLogout} />
    </>
  )
}
