"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { api } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Monitor, Globe, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow, Locale } from "date-fns"
import { az, enUS, ru, tr } from "date-fns/locale"
import { toast } from "sonner"

const dateLocales: Record<string, Locale> = {
    az: az,
    en: enUS,
    ru: ru,
    tr: tr,
}

interface SessionsModalProps {
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

export function SessionsModal({ open, onOpenChange }: SessionsModalProps) {
    const { language, t } = useLanguage()
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(false)
    const [terminating, setTerminating] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            fetchSessions()
        }
    }, [open])

    const fetchSessions = async () => {
        setLoading(true)
        try {
            const response = await api.settings.getSessions()
            if (response.success) {
                setSessions(response.data)
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatLastActive = (dateString: string) => {
        try {
            const date = new Date(dateString)
            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const locale = dateLocales[language] || enUS

            if (diffMs < 60000) return t("settings.lastActive") + ": Now"
            return formatDistanceToNow(date, { addSuffix: true, locale })
        } catch {
            return dateString
        }
    }

    const handleTerminateSession = async (sessionId: string) => {
        setTerminating(sessionId)
        try {
            const response = await api.settings.terminateSession(sessionId)
            if (response.success) {
                setSessions(prev => prev.filter(s => s.id !== sessionId))
                toast.success(t("settings.sessionTerminated") || "Session terminated")
            }
        } catch (error) {
            console.error("Failed to terminate session:", error)
            toast.error(t("common.error") || "Failed to terminate session")
        } finally {
            setTerminating(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t("settings.activeSessions")}</DialogTitle>
                    <DialogDescription>{t("settings.activeSessionsDesc") || "Manage your active sessions"}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Monitor className="h-12 w-12 mb-4 opacity-50" />
                            <p>{t("settings.noActiveSessions")}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{session.device}</p>
                                                {session.isCurrent && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                                        {t("settings.currentSession")}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                                <span className="flex items-center gap-1">
                                                    <Globe className="h-3 w-3" />
                                                    {session.location}
                                                </span>
                                                <span>•</span>
                                                <span>{session.ip}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right text-sm">
                                                <p className="text-muted-foreground">{formatLastActive(session.lastActive)}</p>
                                            </div>
                                            {!session.isCurrent && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleTerminateSession(session.id)}
                                                    disabled={terminating === session.id}
                                                >
                                                    {terminating === session.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <X className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
