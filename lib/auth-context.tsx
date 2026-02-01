"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User, UserRole } from "./types"
import { api } from "./api"

// Token expiration time in milliseconds (7 days)
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

// Helper to get token from either storage
const getToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem("token") || sessionStorage.getItem("token")
}

const getTokenExpiry = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem("tokenExpiry") || sessionStorage.getItem("tokenExpiry")
}

const clearTokens = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("tokenExpiry")
  sessionStorage.removeItem("token")
  sessionStorage.removeItem("tokenExpiry")
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role?: UserRole, rememberMe?: boolean) => Promise<boolean>
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
    const expiryTime = getTokenExpiry()
    // If no expiry time is stored, don't assume expired - let the server validate
    if (!expiryTime) return false
    return Date.now() > parseInt(expiryTime, 10)
  }, [])

  // Load user from token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken()

      // Check if token exists
      if (token) {
        // Check if token has expired (client-side check)
        if (isTokenExpired()) {
          // Token has expired, clear it
          console.log("Session expired")
          clearTokens()
          setUser(null)
          setIsLoading(false)
          return
        }

        // Validate token with server
        try {
          const response = await api.auth.me()
          if (response.success) {
            setUser(response.data.user)
            // If tokenExpiry was missing (localStorage), set it now for future checks
            if (!getTokenExpiry() && localStorage.getItem("token")) {
              localStorage.setItem("tokenExpiry", String(Date.now() + TOKEN_EXPIRY_MS))
            }
          } else {
            // Token invalid on server
            clearTokens()
            setUser(null)
          }
        } catch (error) {
          console.error("Auth check failed:", error)
          clearTokens()
          setUser(null)
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [isTokenExpired])

  const login = useCallback(async (email: string, password: string, role?: UserRole, rememberMe: boolean = true): Promise<boolean> => {
    try {
      const response = await api.auth.login({ email, password, role })
      if (response.success) {
        // Clear both storages first
        clearTokens()

        if (rememberMe) {
          // Use localStorage for persistent session (7 days)
          localStorage.setItem("token", response.data.token)
          localStorage.setItem("tokenExpiry", String(Date.now() + TOKEN_EXPIRY_MS))
        } else {
          // Use sessionStorage for session-only (cleared when browser closes)
          sessionStorage.setItem("token", response.data.token)
          // No expiry needed for session storage - it's cleared on browser close
        }
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
    clearTokens()
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

