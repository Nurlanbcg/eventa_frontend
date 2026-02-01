"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { api } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Download, Calendar, Globe, Monitor } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDistanceToNow, Locale } from "date-fns"
import { az, enUS, ru, tr } from "date-fns/locale"

const dateLocales: Record<string, Locale> = {
    az: az,
    en: enUS,
    ru: ru,
    tr: tr,
}

interface AuditLogsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface AuditLog {
    id: string
    action: string
    description: string
    ip: string
    date: string
}

export function AuditLogsModal({ open, onOpenChange }: AuditLogsModalProps) {
    const { language, t } = useLanguage()
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        if (open) {
            fetchLogs()
        }
    }, [open])

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const response = await api.settings.getAuditLogs(50) // Fetch more logs for detailed view
            if (response.success) {
                setLogs(response.data)
            }
        } catch (error) {
            console.error("Failed to fetch audit logs:", error)
        } finally {
            setLoading(false)
        }
    }

    const getActionLabel = (action: string) => {
        const actionMap: Record<string, string> = {
            login: "Login",
            logout: "Logout",
            password_change: "Password Changed",
            profile_update: "Profile Updated",
            session_terminated: "Session Terminated",
            "2fa_enabled": "2FA Enabled",
            "2fa_disabled": "2FA Disabled",
            user_created: "User Created",
            user_deleted: "User Deleted",
            driver_created: "Driver Created",
            driver_deleted: "Driver Deleted",
            event_created: "Event Created",
            event_updated: "Event Updated",
            event_deleted: "Event Deleted",
        }
        return actionMap[action] || action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    }

    const formatLogDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            const day = String(date.getDate()).padStart(2, '0')
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const year = date.getFullYear()
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            const seconds = String(date.getSeconds()).padStart(2, '0')
            return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`
        } catch {
            return dateString
        }
    }

    const getRelativeTime = (dateString: string) => {
        try {
            const locale = dateLocales[language] || enUS
            return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale })
        } catch {
            return ""
        }
    }

    const handleExport = async (range: string) => {
        setExporting(true)
        try {
            const response = await api.settings.exportAuditLogs(range)
            if (response.success && response.data) {
                const data = response.data
                if (data.length === 0) {
                    alert(t("common.noData"))
                    return
                }

                const headers = Object.keys(data[0])
                const csvContent = [
                    headers.join(","),
                    ...data.map((row: any) =>
                        headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(",")
                    )
                ].join("\n")

                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.href = url
                link.download = `audit_logs_${range}_${new Date().toISOString().split('T')[0]}.csv`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
            }
        } catch (error) {
            console.error("Export failed:", error)
        } finally {
            setExporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
                <DialogHeader className="flex flex-row items-center justify-between pr-8">
                    <div>
                        <DialogTitle>{t("settings.auditLogs")}</DialogTitle>
                        <DialogDescription>{t("settings.auditLogsDesc") || "View your account activity history"}</DialogDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={exporting}>
                                {exporting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                )}
                                {t("common.export")}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport("today")}>
                                {t("settings.exportToday")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("week")}>
                                {t("settings.exportWeek")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("month")}>
                                {t("settings.exportMonth")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("year")}>
                                {t("settings.exportYear")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Calendar className="h-12 w-12 mb-4 opacity-50" />
                            <p>{t("common.noData")}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-1">
                                            <p className="font-medium">{getActionLabel(log.action)}</p>
                                            {log.description && (
                                                <p className="text-sm text-muted-foreground">{log.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                                <span className="flex items-center gap-1">
                                                    <Globe className="h-3 w-3" />
                                                    {log.ip}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p className="text-muted-foreground">{formatLogDate(log.date)}</p>
                                            <p className="text-xs text-muted-foreground/70">{getRelativeTime(log.date)}</p>
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
