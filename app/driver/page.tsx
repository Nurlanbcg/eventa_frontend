"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { GuestStatus } from "@/lib/types"
import {
  MapPin,
  Phone,
  Clock,
  XCircle,
  CheckCircle2,
  User,
  Calendar,
  Navigation,
  Coffee,
} from "lucide-react"

import { useLanguage } from "@/lib/language-context"

interface Transfer {
  _id: string
  guestId: {
    _id: string
    name: string
    phone: string
    pickupAddress: string
    dropoffAddress: string
    notes?: string
    status: GuestStatus
  }
  eventId: {
    _id: string
    name: string
    date: string
    time: string
  }
  status: "pending" | "accepted" | "arrived" | "in-progress" | "completed" | "declined"
  pickupTime?: string
  declineReason?: string
}

const DECLINE_REASON_KEYS = [
  "driver.declineReason.onBreak",
  "driver.declineReason.refueling",
  "driver.declineReason.carRepair",
  "driver.declineReason.shiftEnded",
  "driver.declineReason.personalMatter",
  "driver.declineReason.trafficRisk",
  "driver.declineReason.gpsIssue",
  "driver.declineReason.phoneIssue",
  "driver.declineReason.documentIssue",
]

export default function DriverDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [busyReason, setBusyReason] = useState<string | null>(null)
  const [isBusyModalOpen, setIsBusyModalOpen] = useState(false)

  const fetchTransfers = async () => {
    if (!user) return

    try {
      // For driver users, user.id IS the driverId
      const response = await api.transfers.getByDriver(user.id || user._id || "")
      if (response.success) {
        setTransfers(response.data.transfers || [])
      }
    } catch (error) {
      console.error("Failed to fetch transfers:", error)
      toast.error("Failed to load your assigned transfers")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTransfers()
    }
  }, [user])

  // Real-time updates - poll every 5 seconds when page is visible
  useEffect(() => {
    if (!user) return

    const pollInterval = setInterval(() => {
      // Only poll if page is visible (not in background tab)
      if (document.visibilityState === 'visible') {
        fetchTransfers()
      }
    }, 5000) // Poll every 5 seconds

    // Also poll when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTransfers()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup interval and event listener on unmount
    return () => {
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  const activeTasks = transfers.filter(t => t.status !== "completed" && t.status !== "declined")
  const completedTasks = transfers.filter(t => t.status === "completed")

  const updateTaskStatus = async (transferId: string, newStatus: string, declineReason?: string) => {
    try {
      const updateData: { status: string; declineReason?: string } = { status: newStatus }
      if (declineReason) {
        updateData.declineReason = declineReason
      }
      const response = await api.transfers.update(transferId, updateData)
      if (response.success) {
        toast.success(t("driver.statusUpdated") || "Status updated")
        fetchTransfers() // Refresh
      }
    } catch (error) {
      console.error("Update status error:", error)
      toast.error("Failed to update status")
    }
  }

  const handleDecline = async (reason: string) => {
    if (!selectedTransfer) return
    await updateTaskStatus(selectedTransfer._id, "declined", reason)
    setIsDeclineModalOpen(false)
    setSelectedTransfer(null)
  }

  const handleSetBusy = async (reason: string) => {
    try {
      const response = await api.drivers.updateBusyStatus({
        status: 'offline',
        busyReason: reason
      })
      if (response.success) {
        setIsBusy(true)
        setBusyReason(reason)
        setIsBusyModalOpen(false)
        toast.success(t("driver.statusBusy") || "Status: Busy")
      }
    } catch (error) {
      console.error("Set busy status error:", error)
      toast.error("Failed to update status")
    }
  }

  const handleSetFree = async () => {
    try {
      const response = await api.drivers.updateBusyStatus({ status: 'available' })
      if (response.success) {
        setIsBusy(false)
        setBusyReason(null)
        toast.success(t("driver.statusFree") || "Status: Available")
      }
    } catch (error) {
      console.error("Set free status error:", error)
      toast.error("Failed to update status")
    }
  }

  const openDeclineModal = (transfer: Transfer) => {
    setSelectedTransfer(transfer)
    setIsDeclineModalOpen(true)
  }

  const getNextStatus = (currentStatus: string): string | null => {
    switch (currentStatus) {
      case "pending":
        return "accepted"
      case "accepted":
        return "arrived"
      case "arrived":
        return "in-progress"
      case "in-progress":
        return "completed"
      default:
        return null
    }
  }

  const getStatusButtonLabel = (status: string): string => {
    switch (status) {
      case "pending":
        return t("driver.accept") || "Qəbul et"
      case "accepted":
        return t("driver.markAsArrived") || "Çatdım"
      case "arrived":
        return t("driver.markAsPickedUp") || "Götürdüm"
      case "in-progress":
        return t("driver.markAsCompleted") || "Tamamladım"
      default:
        return ""
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <LoadingSpinner size={300} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("driver.todaysTasks")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("driver.activeTransfersAssigned").replace("{count}", activeTasks.length.toString())}
          </p>
        </div>
        {isBusy ? (
          <Button
            variant="default"
            size="sm"
            className="shrink-0"
            onClick={handleSetFree}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t("driver.iAmFreeNow") || "Artıq boşam"}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-warning border-warning hover:bg-warning hover:text-warning-foreground"
            onClick={() => setIsBusyModalOpen(true)}
          >
            <Coffee className="h-4 w-4 mr-2" />
            {t("driver.iAmBusy") || "Məşğulam"}
          </Button>
        )}
      </div>

      {/* Active Tasks */}
      <div className="space-y-4">
        {activeTasks.length > 0 ? (
          activeTasks.map((transfer) => {
            const guest = transfer.guestId
            const event = transfer.eventId
            const nextStatus = getNextStatus(transfer.status)
            return (
              <Card key={transfer._id} className="border-border overflow-hidden">
                <CardHeader className="pb-3 bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-accent" />
                        {guest?.name || "Unknown Guest"}
                      </CardTitle>
                      {event && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {event.name} - {event.date}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={guest?.status || transfer.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Pickup Info */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-success/20 rounded-lg shrink-0">
                        <MapPin className="h-4 w-4 text-success" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {t("driver.pickupLocation")}
                        </p>
                        <p className="text-sm mt-0.5">{guest?.pickupAddress || "N/A"}</p>
                      </div>
                      {(transfer.status === 'accepted' || transfer.status === 'arrived') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          asChild
                        >
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(guest?.pickupAddress || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            {t("driver.navigate") || "Naviqasiya"}
                          </a>
                        </Button>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-accent/20 rounded-lg shrink-0">
                        <MapPin className="h-4 w-4 text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {t("driver.dropoffLocation")}
                        </p>
                        <p className="text-sm mt-0.5">{guest?.dropoffAddress || "N/A"}</p>
                      </div>
                      {transfer.status === 'in-progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          asChild
                        >
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(guest?.dropoffAddress || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            {t("driver.navigate") || "Naviqasiya"}
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Guest Contact */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{t("driver.guestPhone")}</p>
                      <p className="text-sm font-medium">{guest?.phone || "N/A"}</p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${guest?.phone}`}>{t("driver.call")}</a>
                    </Button>
                  </div>

                  {/* Event Time */}
                  {event && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{t("driver.eventAt")} {event.time}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {guest?.notes && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-xs font-medium text-warning mb-1">{t("driver.specialNotes")}</p>
                      <p className="text-sm">{guest.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {transfer.status === 'pending' && (
                      <Button
                        className="flex-1 bg-transparent text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        variant="outline"
                        onClick={() => openDeclineModal(transfer)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t("driver.decline") || "İmtina et"}
                      </Button>
                    )}
                    {nextStatus && (
                      <Button
                        className="flex-1"
                        onClick={() => updateTaskStatus(transfer._id, nextStatus)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {getStatusButtonLabel(transfer.status)}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
              <p className="font-medium">{t("driver.allTasksCompleted")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("driver.noActiveTransfers")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Tasks */}
      {
        completedTasks.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {t("driver.completedToday")} ({completedTasks.length})
            </h2>
            <div className="space-y-2">
              {completedTasks.map((transfer) => {
                const guest = transfer.guestId
                const event = transfer.eventId
                return (
                  <div
                    key={transfer._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <div>
                        <p className="text-sm font-medium">{guest?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{event?.name}</p>
                      </div>
                    </div>
                    <StatusBadge status={guest?.status || transfer.status} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      }

      {/* Decline Modal */}
      <Dialog open={isDeclineModalOpen} onOpenChange={setIsDeclineModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("driver.declineReason") || "İmtina səbəbi seçin"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {DECLINE_REASON_KEYS.map((reasonKey, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => handleDecline(t(reasonKey))}
              >
                {t(reasonKey)}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Busy Reason Modal */}
      <Dialog open={isBusyModalOpen} onOpenChange={setIsBusyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("driver.busyReason") || "Məşğulluq səbəbi seçin"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {DECLINE_REASON_KEYS.map((reasonKey, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => handleSetBusy(t(reasonKey))}
              >
                {t(reasonKey)}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div >
  )
}
