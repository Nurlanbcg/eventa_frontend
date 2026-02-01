"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User, UserRole } from "./types"
import { api } from "./api"

// Token expiration time in milliseconds (7 days)
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if token has expired
  const isTokenExpired = useCallback(() => {
    const expiryTime = localStorage.getItem("tokenExpiry")
    // If no expiry time is stored, don't assume expired - let the server validate
    if (!expiryTime) return false
    return Date.now() > parseInt(expiryTime, 10)
  }, [])

  // Load user from token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")

      // Check if token exists
      if (token) {
        // Check if token has expired (client-side check)
        if (isTokenExpired()) {
          // Token has expired, clear it
          console.log("Session expired")
          localStorage.removeItem("token")
          localStorage.removeItem("tokenExpiry")
          setUser(null)
          setIsLoading(false)
          return
        }

        // Validate token with server
        try {
          const response = await api.auth.me()
          if (response.success) {
            setUser(response.data.user)
            // If tokenExpiry was missing, set it now for future checks
            if (!localStorage.getItem("tokenExpiry")) {
              localStorage.setItem("tokenExpiry", String(Date.now() + TOKEN_EXPIRY_MS))
            }
          } else {
            // Token invalid on server
            localStorage.removeItem("token")
            localStorage.removeItem("tokenExpiry")
            setUser(null)
          }
        } catch (error) {
          console.error("Auth check failed:", error)
          localStorage.removeItem("token")
          localStorage.removeItem("tokenExpiry")
          setUser(null)
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [isTokenExpired])

  const login = useCallback(async (email: string, password: string, role?: UserRole): Promise<boolean> => {
    try {
      const response = await api.auth.login({ email, password, role })
      if (response.success) {
        localStorage.setItem("token", response.data.token)
        // Store token expiration time (current time + 24 hours)
        localStorage.setItem("tokenExpiry", String(Date.now() + TOKEN_EXPIRY_MS))
        setUser(response.data.user)
        return true
      }
      return false
    } catch (error) {
      console.error("Login failed:", error)
      return false
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("token")
    localStorage.removeItem("tokenExpiry")
    router.push("/")
  }, [router])

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
