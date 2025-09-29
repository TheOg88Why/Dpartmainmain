"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"
import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import SuccessRedirectOverlay from "@/components/success-redirect-overlay"

const schema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  })

export default function RegisterForm() {
  const { register: registerUser, loginWithGoogle } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)

  const resolver = useMemo(() => zodResolver(schema), [])

  const form = useForm<z.infer<typeof schema>>({
    resolver,
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirm: "",
    },
  })

  const onSubmit = useCallback(
    async (values: z.infer<typeof schema>) => {
      setLoading(true)
      try {
        await registerUser({
          username: values.username,
          email: values.email,
          password: values.password,
        })

        toast.success("Account created successfully!")
        setShowSuccessOverlay(true)
      } catch (err: any) {
        console.error("Register error:", err)

        if (err.errors && Array.isArray(err.errors)) {
          const firstError = err.errors[0]
          toast.error(firstError.msg || firstError.message || "Validation failed")

          err.errors.forEach((error: any) => {
            const fieldName = error.path || error.param
            if (fieldName && ["username", "email", "password"].includes(fieldName)) {
              form.setError(fieldName as any, {
                message: error.msg || error.message,
              })
            }
          })
        } else if (err.message) {
          toast.error(err.message)
        } else {
          toast.error("Failed to create account. Please try again.")
        }
      } finally {
        setLoading(false)
      }
    },
    [registerUser, form],
  )

  const handleRedirectComplete = useCallback(() => {
    router.push("/dashboard")
  }, [router])

  return (
    <>
      <div className="mx-auto w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-muted-foreground mt-2 text-sm">Join AuraDeploy and get started today</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="coolplayer" {...field} disabled={loading} className="disabled:opacity-50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
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

            <div className="mt-2 grid gap-3">
              <Button type="button" variant="outline" onClick={loginWithGoogle}>
                Continue with Google
              </Button>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline">
            Sign in
          </a>
        </div>
      </div>

      <SuccessRedirectOverlay
        show={showSuccessOverlay}
        message="Welcome! Redirecting to Dashboard..."
        onComplete={handleRedirectComplete}
      />
    </>
  )
}
