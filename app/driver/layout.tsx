"use client"

import React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Car, LogOut } from "lucide-react"

import { useLanguage } from "@/lib/language-context"

export default function DriverLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isAuthenticated, isLoading, logout } = useAuth()
    const { t } = useLanguage()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== "driver")) {
            router.replace("/")
        }
    }, [isLoading, isAuthenticated, user, router])

    if (isLoading || !isAuthenticated || user?.role !== "driver") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-primary text-primary-foreground border-b border-border">
                <div className="flex items-center justify-between h-16 px-4">
                    <div className="flex items-center gap-3">
                        <img src="/branding-logo.png" alt="Logo" className="h-8 w-auto object-contain" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs opacity-80">{user.phone}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                            onClick={() => {
                                logout()
                                router.push("/")
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="sr-only">{t("sidebar.logout")}</span>
                        </Button>
                    </div>
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    )
}
