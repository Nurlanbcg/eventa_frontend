"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { LanguageSwitcher } from "@/components/language-switcher"
import { api } from "@/lib/api"
import { toast } from "sonner"

function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useLanguage()

    const [token, setToken] = useState<string | null>(null)
    const [isTokenLoaded, setIsTokenLoaded] = useState(false)
    const [password, setPassword] = useState("")
    const [retypePassword, setRetypePassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showRetypePassword, setShowRetypePassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const tokenParam = searchParams.get("token")
        if (tokenParam) {
            setToken(tokenParam)
        }
        setIsTokenLoaded(true)
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        // Validation
        if (password.length < 6) {
            setError(t("reset.passwordLength") || "Password must be at least 6 characters")
            return
        }

        if (password !== retypePassword) {
            setError(t("reset.passwordMismatch") || "Passwords do not match")
            return
        }

        if (!token) {
            setError(t("reset.invalidToken") || "Invalid reset link")
            return
        }

        setIsLoading(true)
        try {
            const response = await api.auth.resetPassword(token, password)
            if (response.success) {
                setSuccess(true)
                toast.success(t("reset.success") || "Password reset successfully")
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    router.push("/")
                }, 2000)
            } else {
                setError(response.message || t("reset.invalidToken") || "Invalid or expired reset link")
            }
        } catch (err: any) {
            setError(err.message || t("reset.invalidToken") || "Invalid or expired reset link")
        } finally {
            setIsLoading(false)
        }
    }

    // Show loading while token is being read from URL
    if (!isTokenLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner size={300} />
            </div>
        )
    }

    if (!token) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-background p-4 relative">
                <div className="absolute top-6 right-6">
                    <LanguageSwitcher />
                </div>
                <Card className="w-full max-w-md border-border shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-3 bg-destructive/10 rounded-full">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                            </div>
                            <h2 className="text-xl font-semibold">{t("reset.invalidToken") || "Invalid Reset Link"}</h2>
                            <p className="text-muted-foreground text-sm">
                                {t("reset.invalidTokenDescription") || "This password reset link is invalid or has expired."}
                            </p>
                            <Button onClick={() => router.push("/")} className="mt-4">
                                {t("reset.backToLogin") || "Back to Login"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        )
    }

    if (success) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-background p-4 relative">
                <div className="absolute top-6 right-6">
                    <LanguageSwitcher />
                </div>
                <Card className="w-full max-w-md border-border shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-3 bg-green-500/10 rounded-full">
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                            <h2 className="text-xl font-semibold">{t("reset.successTitle") || "Password Reset Successfully"}</h2>
                            <p className="text-muted-foreground text-sm">
                                {t("reset.successDescription") || "Your password has been reset. Redirecting to login..."}
                            </p>
                            <LoadingSpinner size={24} />
                        </div>
                    </CardContent>
                </Card>
            </main>
        )
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-background p-4 relative">
            <div className="absolute top-6 right-6">
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center justify-center mb-6">
                        <img src="/branding-logo.png" alt="Logo" className="h-16 w-auto object-contain" />
                    </div>
                </div>

                <Card className="border-border shadow-lg">
                    <CardHeader className="space-y-1 pb-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <Lock className="h-5 w-5 text-accent" />
                            <CardTitle className="text-xl">{t("reset.title") || "Reset Password"}</CardTitle>
                        </div>
                        <CardDescription>
                            {t("reset.description") || "Enter your new password below"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">{t("reset.newPassword") || "New Password"}</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder={t("reset.newPasswordPlaceholder") || "Enter new password"}
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
                            <div className="space-y-2">
                                <Label htmlFor="retype-password">{t("reset.retypePassword") || "Retype Password"}</Label>
                                <div className="relative">
                                    <Input
                                        id="retype-password"
                                        type={showRetypePassword ? "text" : "password"}
                                        placeholder={t("reset.retypePasswordPlaceholder") || "Retype new password"}
                                        value={retypePassword}
                                        onChange={(e) => setRetypePassword(e.target.value)}
                                        required
                                        className="bg-background pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowRetypePassword(!showRetypePassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showRetypePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-destructive text-center">{error}</p>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (t("reset.saving") || "Saving...") : (t("reset.save") || "Save Password")}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push("/")}
                        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                        {t("reset.backToLogin") || "Back to Login"}
                    </button>
                </div>
            </div>
        </main>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner size={300} />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
