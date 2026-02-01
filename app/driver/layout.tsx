"use client"

import React, { useState, useRef, useEffect } from "react"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Globe, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

import { useLanguage } from "@/lib/language-context"

export default function DriverLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isAuthenticated, isLoading, logout } = useAuth()
    const { t, language, setLanguage } = useLanguage()
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    const [isLangOpen, setIsLangOpen] = useState(false)
    const langRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== "driver")) {
            router.replace("/")
        }
    }, [isLoading, isAuthenticated, user, router])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setIsLangOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const languages = [
        { code: "az" as const, label: "AZE" },
        { code: "en" as const, label: "ENG" },
        { code: "ru" as const, label: "RUS" },
        { code: "tr" as const, label: "TUR" },
    ]

    if (isLoading || !isAuthenticated || user?.role !== "driver") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner size={300} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-zinc-900 text-white border-b border-zinc-800">
                <div className="flex items-center justify-between h-16 px-4">
                    <div className="flex items-center gap-3">
                        <img src="/branding-logo.png" alt="Logo" className="h-8 w-auto object-contain" />
                    </div>
                    <div className="flex items-center gap-1 sm:gap-3">
                        {/* Language Switcher */}
                        <div ref={langRef} className="relative flex items-center">
                            <AnimatePresence>
                                {isLangOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20, width: 0 }}
                                        animate={{ opacity: 1, x: 0, width: "auto" }}
                                        exit={{ opacity: 0, x: 20, width: 0 }}
                                        className="flex items-center gap-1 overflow-hidden mr-1 bg-white/20 backdrop-blur-md rounded-full p-1"
                                    >
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    setLanguage(lang.code)
                                                    setIsLangOpen(false)
                                                }}
                                                type="button"
                                                className={`
                                                    px-2 py-1 rounded-full text-xs font-semibold transition-colors
                                                    ${language === lang.code
                                                        ? "bg-white text-zinc-900"
                                                        : "hover:bg-white/30 text-white"
                                                    }
                                                `}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10 hover:text-white"
                                onClick={() => setIsLangOpen(!isLangOpen)}
                            >
                                <Globe className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 hover:text-white"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>

                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs opacity-80">{user.phone}</p>
                        </div>

                        {/* Logout */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 hover:text-white"
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
