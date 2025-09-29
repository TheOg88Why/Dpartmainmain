"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { authenticatedApiCall } from "@/components/auth-provider"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ProfileData = {
  user: {
    id: string
    username: string
    email: string
    role?: string
    createdAt?: string
    lastLogin?: string
  }
}

const fetcher = (url: string) => authenticatedApiCall(url).then((res) => res.data as ProfileData)

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, refreshUser, loading } = useAuth()
  const { toast } = useToast()
  const { data, isLoading, error, mutate } = useSWR(isAuthenticated ? "/profile" : null, fetcher)

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  const isDirty =
    (!!data?.user && (username !== data.user.username || email !== data.user.email)) || newPassword.length > 0

  useEffect(() => {
    if (!isAuthenticated) return
    if (data?.user) {
      setUsername(data.user.username || "")
      setEmail(data.user.email || "")
    }
  }, [data, isAuthenticated])

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Profile</CardTitle>
            <CardDescription className="text-pretty">You need to sign in to manage your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button className="bg-primary text-primary-foreground hover:opacity-90">Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Register</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Add client-side checks for password length and confirmation instead.
    if (newPassword) {
      if (newPassword.length < 6) {
        toast({
          title: "Password too short",
          description: "New password must be at least 6 characters.",
          variant: "destructive",
        })
        return
      }
      if (confirmPassword !== newPassword) {
        toast({
          title: "Passwords do not match",
          description: "Confirm password must match the new password.",
          variant: "destructive",
        })
        return
      }
    }

    if (!isDirty) {
      toast({
        title: "Nothing to save",
        description: "No changes detected.",
      })
      return
    }

    setSaving(true)
    try {
      const payload: any = { username, email }
      if (newPassword) {
        payload.newPassword = newPassword
        if (currentPassword) payload.currentPassword = currentPassword
      }

      console.log("[v0] Profile update payload:", {
        ...payload,
        currentPassword: payload.currentPassword ? "***" : undefined,
      })

      const res = await authenticatedApiCall("/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Profile update response:", res)

      if (!res?.success) {
        throw new Error(res?.message || "Profile update failed")
      }

      await mutate((prev: any) => {
        const next = prev ? { ...prev } : { user: {} }
        next.user = {
          ...(prev?.user || {}),
          username,
          email,
        }
        return next
      }, false)

      await mutate()
      await refreshUser()

      toast({ title: "Profile updated", description: "Your profile changes were saved." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      const msg = err?.message || "Failed to update profile"
      console.log("[v0] Profile update error:", err)
      toast({ title: "Update failed", description: msg, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Profile</CardTitle>
          <CardDescription className="text-pretty">
            Update your account details. Change your password by providing the current and a new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading profile…</p>
          ) : error ? (
            <p className="text-destructive">Failed to load profile</p>
          ) : (
            <form className="grid gap-6" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password if changing password"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter the new password"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  disabled={saving || !isDirty || (newPassword.length > 0 && confirmPassword !== newPassword)}
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
