"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { Car, Shield, User, Send, Eye, EyeOff } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LanguageSwitcher } from "@/components/language-switcher"

import { api } from "@/lib/api"
import { toast } from "sonner"

export default function LoginPage() {
  // State for setup check
  const [isSystemSetup, setIsSystemSetup] = useState<boolean | null>(null)

  // Login State
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  // Role is now auto-detected
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSetupPassword, setShowSetupPassword] = useState(false)
  const [showSetupRetypePassword, setShowSetupRetypePassword] = useState(false)

  // Setup State
  const [setupData, setSetupData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    retypePassword: ""
  })

  // Forgot Password State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSuccess, setResetSuccess] = useState(false)

  const router = useRouter()
  const { login } = useAuth()
  const { t } = useLanguage()

  // Check system setup status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.auth.checkSetupStatus()
        setIsSystemSetup(response.isSetup)
      } catch (error) {
        console.error("Failed to check system status", error)
        // Fallback to assuming setup is done to prevent getting stuck in loading
        setIsSystemSetup(true)
      }
    }
    checkStatus()
  }, [])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Role is auto-detected by backend
      const success = await login(email, password)
      if (success) {
        // Fetch user info to know where to redirect
        const userRes = await api.auth.me()
        if (userRes.success) {
          const role = userRes.data.user.role
          if (role === 'admin') {
            router.replace("/admin")
          } else if (role === 'driver') {
            router.replace("/driver")
          } else {
            router.replace("/admin") // Default fallback
          }
        }
      } else {
        setError(t("login.invalidCredentials"))
      }
    } catch (err) {
      console.error(err)
      setError(t("login.invalidCredentials"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (setupData.password !== setupData.retypePassword) {
      setError("Passwords do not match") // TODO: Translate if possible, or use generic error
      return
    }

    setIsLoading(true)
    try {
      const response = await api.auth.setup({
        name: setupData.name,
        email: setupData.email,
        phone: setupData.phone,
        password: setupData.password
      })

      if (response.success) {
        // Auto login logic - token is in response.data.token
        // We might need to manually set it or call login again.
        // Simplest is to call login with the credentials we just used.
        const success = await login(setupData.email, setupData.password)
        if (success) {
          router.replace("/admin")
        } else {
          // Should not happen really
          router.replace("/admin")
        }
      } else {
        setError(response.message || "Setup failed")
      }
    } catch (err: any) {
      setError(err.message || "Setup failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate sending reset email
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setResetSuccess(true)
    setIsLoading(false)
  }

  if (isSystemSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size={300} />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Language Selector - Top Right */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img src="/branding-logo.png" alt="Logo" className="h-16 w-auto object-contain" />
          </div>
          <p className="text-muted-foreground text-sm">
            {isSystemSetup ? t("login.subtitle") : t("setup.subtitle")}
          </p>
        </div>

        {isSystemSetup ? (
          // LOGIN FORM
          <Card className="border-border shadow-lg">
            <CardHeader className="space-y-1 pb-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                <CardTitle className="text-xl">{t("login.title")}</CardTitle>
              </div>
              <CardDescription>
                {t("login.welcome")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("login.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("login.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("login.password")}</Label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-xs text-accent hover:underline"
                    >
                      {t("login.forgotPassword")}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("login.passwordPlaceholder")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-background pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>


                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("login.signingIn") : t("login.signIn")}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          // SETUP FORM
          <Card className="border-border shadow-lg">
            <CardHeader className="space-y-1 pb-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <User className="h-5 w-5 text-accent" />
                <CardTitle className="text-xl">{t("setup.title")}</CardTitle>
              </div>
              <CardDescription>
                {t("setup.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetupSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setup-name">{t("setup.name")}</Label>
                  <Input
                    id="setup-name"
                    value={setupData.name}
                    onChange={(e) => setSetupData({ ...setupData, name: e.target.value })}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-email">{t("login.email")}</Label>
                  <Input
                    id="setup-email"
                    type="email"
                    value={setupData.email}
                    onChange={(e) => setSetupData({ ...setupData, email: e.target.value })}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-phone">{t("setup.phone")}</Label>
                  <Input
                    id="setup-phone"
                    type="tel"
                    value={setupData.phone}
                    onChange={(e) => setSetupData({ ...setupData, phone: e.target.value })}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-password">{t("login.password")}</Label>
                  <div className="relative">
                    <Input
                      id="setup-password"
                      type={showSetupPassword ? "text" : "password"}
                      value={setupData.password}
                      onChange={(e) => setSetupData({ ...setupData, password: e.target.value })}
                      required
                      className="bg-background pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPassword(!showSetupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSetupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-retype">{t("setup.retypePassword")}</Label>
                  <div className="relative">
                    <Input
                      id="setup-retype"
                      type={showSetupRetypePassword ? "text" : "password"}
                      value={setupData.retypePassword}
                      onChange={(e) => setSetupData({ ...setupData, retypePassword: e.target.value })}
                      required
                      className="bg-background pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupRetypePassword(!showSetupRetypePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSetupRetypePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("common.loading") : t("setup.submit")}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center">
          {!isSystemSetup && (
            <p className="text-xs text-muted-foreground">
              {t("setup.oneTimeMessage")}
            </p>
          )}
        </div>

      </div>

      {/* Forgot Password Modal */}
      <Dialog
        open={isForgotPasswordOpen}
        onOpenChange={(open) => {
          setIsForgotPasswordOpen(open)
          if (!open) {
            setResetEmail("")
            setResetSuccess(false)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("forgot.title")}</DialogTitle>
            <DialogDescription>
              {t("forgot.description")}
            </DialogDescription>
          </DialogHeader>
          {!resetSuccess ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">{t("forgot.email")}</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder={t("forgot.emailPlaceholder")}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <LoadingSpinner size={16} className="mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? t("forgot.sending") : t("forgot.sendLink")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="flex-1"
                >
                  {t("forgot.cancel")}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                <p className="text-sm text-foreground">
                  {t("forgot.successMessage")} <strong>{resetEmail}</strong>
                </p>
              </div>
              <Button
                onClick={() => {
                  setIsForgotPasswordOpen(false)
                  setResetEmail("")
                  setResetSuccess(false)
                }}
                className="w-full"
              >
                {t("forgot.close")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
