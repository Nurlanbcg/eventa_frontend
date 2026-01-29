"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { useTheme } from "next-themes"
import { api } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Laptop, Languages, Loader2, Download } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AuditLogsModal } from "@/components/audit-logs-modal"
import { formatDistanceToNow } from "date-fns"

interface SettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface Session {
    id: string
    device: string
    browser: string
    location: string
    ip: string
    lastActive: string
    isCurrent: boolean
}

interface AuditLog {
    id: string
    action: string
    description: string
    ip: string
    date: string
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
    const { language, setLanguage, t } = useLanguage()
    const { theme, setTheme } = useTheme()

    const [sessions, setSessions] = useState<Session[]>([])
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("general")
    const [auditLogsModalOpen, setAuditLogsModalOpen] = useState(false)

    const languages = [
        { code: "az", label: "Azərbaycan" },
        { code: "en", label: "English" },
        { code: "ru", label: "Русский" },
        { code: "tr", label: "Türkçe" },
    ]

    // Fetch sessions and logs when Activity tab is opened
    useEffect(() => {
        if (open && activeTab === "activity") {
            fetchActivityData()
        }
    }, [open, activeTab])

    const fetchActivityData = async () => {
        setLoading(true)
        try {
            const [sessionsRes, logsRes] = await Promise.all([
                api.settings.getSessions(),
                api.settings.getAuditLogs(10)
            ])

            if (sessionsRes.success) {
                setSessions(sessionsRes.data)
            }
            if (logsRes.success) {
                setLogs(logsRes.data)
            }
        } catch (error) {
            console.error("Failed to fetch activity data:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatLastActive = (dateString: string) => {
        try {
            const date = new Date(dateString)
            const now = new Date()
            const diffMs = now.getTime() - date.getTime()

            if (diffMs < 60000) return t("settings.lastActive") + ": Now"
            return formatDistanceToNow(date, { addSuffix: true })
        } catch {
            return dateString
        }
    }

    const formatLogDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleString()
        } catch {
            return dateString
        }
    }

    const getActionLabel = (action: string) => {
        const actionMap: Record<string, string> = {
            login: t("settings.action") + ": Login",
            logout: t("settings.action") + ": Logout",
            password_change: t("settings.action") + ": Password Changed",
            profile_update: t("settings.action") + ": Profile Updated",
            session_terminated: t("settings.action") + ": Session Terminated",
            "2fa_enabled": t("settings.action") + ": 2FA Enabled",
            "2fa_disabled": t("settings.action") + ": 2FA Disabled",
        }
        return actionMap[action] || action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{t("settings.title")}</DialogTitle>
                        <DialogDescription>{t("settings.description")}</DialogDescription>
                    </DialogHeader>
                    <Tabs
                        defaultValue="general"
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full flex-1 flex flex-col min-h-0"
                    >
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="general">{t("settings.general")}</TabsTrigger>
                            <TabsTrigger value="security">{t("settings.security")}</TabsTrigger>
                            <TabsTrigger value="activity">{t("settings.activity")}</TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto min-h-0 pt-4 px-1">
                            {/* GENERAL TAB */}
                            <TabsContent value="general" className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Languages className="w-4 h-4" />
                                        <Label>{t("settings.language")}</Label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {languages.map((lang) => (
                                            <Button
                                                key={lang.code}
                                                variant={language === lang.code ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setLanguage(lang.code as any)}
                                                className="w-full justify-start"
                                            >
                                                {lang.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Sun className="w-4 h-4" />
                                        <Label>{t("settings.theme")}</Label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')}>
                                            <Sun className="w-4 h-4 mr-2" /> {t("settings.light")}
                                        </Button>
                                        <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')}>
                                            <Moon className="w-4 h-4 mr-2" /> {t("settings.dark")}
                                        </Button>
                                        <Button variant={theme === 'system' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('system')}>
                                            <Laptop className="w-4 h-4 mr-2" /> {t("settings.system")}
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* SECURITY TAB */}
                            <TabsContent value="security" className="space-y-6">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">{t("settings.twoFactor")}</Label>
                                        <div className="text-sm text-muted-foreground">
                                            {t("settings.twoFactorDesc")}
                                        </div>
                                    </div>
                                    <Switch id="2fa-toggle" />
                                </div>
                            </TabsContent>

                            {/* ACTIVITY TAB */}
                            <TabsContent value="activity" className="space-y-6">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-muted-foreground">{t("settings.activeSessions")}</h3>
                                            <div className="rounded-md border">
                                                {sessions.length === 0 ? (
                                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                                        {t("settings.noActiveSessions")}
                                                    </div>
                                                ) : (
                                                    sessions.map((session, i) => (
                                                        <div key={session.id} className={`flex items-start justify-between p-3 ${i !== sessions.length - 1 ? 'border-b' : ''}`}>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-medium">{session.device}</p>
                                                                    {session.isCurrent && (
                                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{t("settings.currentSession")}</Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-3">
                                                                    <span>{session.location}</span>
                                                                    <span>•</span>
                                                                    <span>{session.ip}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                                                                {formatLastActive(session.lastActive)}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-muted-foreground">{t("settings.auditLogs")}</h3>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setAuditLogsModalOpen(true)}
                                                >
                                                    {t("settings.viewAll")}
                                                </Button>
                                            </div>
                                            <div className="rounded-md border divide-y">
                                                {logs.length === 0 ? (
                                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                                        {t("settings.noAuditLogs")}
                                                    </div>
                                                ) : (
                                                    logs.map((log) => (
                                                        <div key={log.id} className="p-3 flex items-center justify-between text-sm">
                                                            <div>
                                                                <p className="font-medium">{getActionLabel(log.action)}</p>
                                                                <p className="text-xs text-muted-foreground">{log.ip}</p>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">{formatLogDate(log.date)}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <AuditLogsModal
                open={auditLogsModalOpen}
                onOpenChange={setAuditLogsModalOpen}
            />
        </>
    )
}
