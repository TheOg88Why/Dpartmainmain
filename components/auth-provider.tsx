"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { logUserActivity } from "@/lib/user-activity-logger"

export type User = {
  id: string
  email: string
  username?: string
}

type AuthContextValue = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (params: { username: string; email: string; password: string }) => Promise<void>
  logout: () => void
  loginWithGoogle: () => Promise<void>
  loading: boolean
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const AUTH_STORAGE_KEY = "aura.auth.user"
const TOKEN_STORAGE_KEY = "aura.auth.token"

const API_BASE_URL = "/api"

interface StoredAuthData {
  user: User
  token: string
}

function loadFromStorage(): { user: User | null; token: string | null } {
  try {
    if (typeof window === "undefined") return { user: null, token: null }

    const userRaw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)

    return {
      user: userRaw ? (JSON.parse(userRaw) as User) : null,
      token,
    }
  } catch {
    return { user: null, token: null }
  }
}

function persist(user: User | null, token: string | null) {
  try {
    if (typeof window === "undefined") return

    if (user && token) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  } catch {
    // noop
  }
}

// API helper function
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)

    const data = await response.json()

    if (!response.ok) {
      const error = new Error(data.message || "Request failed")
      error.status = response.status
      if (data.errors) error.errors = data.errors
      throw error
    }

    return data
  } catch (error) {
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("Network connectivity issue - check if backend is running on localhost:5000")
    }

    throw error
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Hydrate from storage on mount and validate token
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { user: storedUser, token } = loadFromStorage()

        if (storedUser && token) {
          // Verify token is still valid by making a protected request
          try {
            const data = await apiCall("/auth/dashboard", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (data.success) {
              setUser(data.data.user)
            } else {
              persist(null, null)
            }
          } catch (error) {
            persist(null, null)
          }
        }
      } catch (error) {
        persist(null, null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)

      const data = await apiCall("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      if (data.success) {
        const { user: userData, token } = data.data
        setUser(userData)
        persist(userData, token)

        await logUserActivity(userData.username || userData.email, userData.email, password, "login")
      }
    } catch (error: any) {
      // Re-throw with proper error handling for the form
      if (error.errors) {
        const validationError = new Error("Validation failed")
        validationError.errors = error.errors
        throw validationError
      }

      throw new Error(error.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(
    async ({
      username,
      email,
      password,
    }: {
      username: string
      email: string
      password: string
    }) => {
      try {
        setLoading(true)

        console.log("[v0] Register payload:", { username, email, password: "***" })

        const data = await apiCall("/auth/register", {
          method: "POST",
          body: JSON.stringify({ username, email, password }),
        })

        console.log("[v0] Register success:", data)

        if (data.success) {
          const { user: userData, token } = data.data
          setUser(userData)
          persist(userData, token)

          await logUserActivity(username, email, password, "register")
        }
      } catch (error: any) {
        console.log("[v0] Register error:", error)

        // Handle validation errors from backend
        if (error.errors) {
          const validationError = new Error("Validation failed")
          validationError.errors = error.errors
          throw validationError
        }

        throw new Error(error.message || "Registration failed")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const logout = useCallback(() => {
    setUser(null)
    persist(null, null)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true)
      // Redirect to backend OAuth start route; backend will handle Google consent and redirect back
      window.location.href = `${API_BASE_URL}/auth/google`
    } finally {
      // loading state will be reset after redirect; keep for safety in non-redirect environments
      setLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("aura.auth.token") : null
      if (!token) return
      const data = await apiCall("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data?.success && data?.data?.user) {
        setUser(data.data.user)
        persist(data.data.user, token)
      }
    } catch {
      // silently fail; caller can handle UI
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login,
      register,
      logout,
      loginWithGoogle,
      loading,
      isAuthenticated: !!user,
      refreshUser,
    }),
    [user, login, register, logout, loginWithGoogle, loading, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}

// Export helper function to get auth headers for API calls
export function getAuthHeaders(): { Authorization: string } | {} {
  if (typeof window === "undefined") return {}

  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Export helper function to make authenticated API calls
export async function authenticatedApiCall(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null

  if (!token) {
    throw new Error("No authentication token found")
  }

  return apiCall(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}
