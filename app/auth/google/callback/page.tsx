"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function GoogleCallbackPage() {
  const router = useRouter()
  const search = useSearchParams()

  useEffect(() => {
    const run = async () => {
      const token = search.get("token")
      if (!token) {
        router.replace("/login?error=missing_token")
        return
      }

      try {
        // Persist token so AuthProvider can hydrate on next load
        localStorage.setItem("aura.auth.token", token)

        // Fetch user profile using token and persist user object
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json().catch(() => null)

        if (res.ok && data?.success && data?.data?.user) {
          localStorage.setItem("aura.auth.user", JSON.stringify(data.data.user))
        }

        // Redirect to dashboard
        router.replace("/dashboard")
      } catch (e) {
        router.replace("/login?error=google_persist_failed")
      }
    }
    run()
  }, [router, search])

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-md border p-6">
        <h1 className="text-xl font-semibold">Signing you in…</h1>
        <p className="text-muted-foreground mt-2 text-sm">Please wait while we complete your Google sign-in.</p>
      </div>
    </section>
  )
}
