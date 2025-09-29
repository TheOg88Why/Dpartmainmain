"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import SuccessRedirectOverlay from "@/components/success-redirect-overlay"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function LoginForm() {
  const { login, loginWithGoogle, loading } = useAuth()
  const router = useRouter()
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)

  const resolver = useMemo(() => zodResolver(schema), [])
  const form = useForm<z.infer<typeof schema>>({
    resolver,
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = useCallback(
    async (values: z.infer<typeof schema>) => {
      try {
        await login(values.email, values.password)
        toast.success("Welcome back!")
        setShowSuccessOverlay(true)
      } catch (err: any) {
        console.error("Login error:", err?.message || err)
        toast.error(err.message || "Unable to login. Please try again.")
      }
    },
    [login],
  )

  const handleGoogleLogin = useCallback(async () => {
    try {
      await loginWithGoogle()
      toast.success("Signed in with Google!")
      setShowSuccessOverlay(true)
    } catch (err: any) {
      console.error("Google login error:", err?.message || err)
      toast.error("Google login failed. Please try again.")
    }
  }, [loginWithGoogle])

  const handleRedirectComplete = useCallback(() => {
    router.push("/dashboard")
  }, [router])

  return (
    <>
      <div className="mx-auto w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-muted-foreground mt-2 text-sm">Access your AuraDeploy dashboard</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      disabled={loading}
                      className="disabled:opacity-50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={loading}
                      className="disabled:opacity-50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between text-sm">
              <a className="text-primary hover:opacity-90" href="#forgot">
                Forgot Password
              </a>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={loading}
                aria-busy={loading}
                aria-label="Continue with Google"
              >
                {loading ? "Connecting..." : "Continue with Google"}
              </Button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full bg-primary text-primary-foreground hover:opacity-90"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <a href="/register" className="text-primary hover:underline">
            Create one
          </a>
        </div>
      </div>

      <SuccessRedirectOverlay
        show={showSuccessOverlay}
        message="Redirecting to Dashboard..."
        onComplete={handleRedirectComplete}
      />
    </>
  )
}
