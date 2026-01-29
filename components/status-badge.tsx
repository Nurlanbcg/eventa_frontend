"use client"

import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import type { EventStatus, GuestStatus, DriverStatus } from "@/lib/types"

type Status = EventStatus | GuestStatus | DriverStatus

const statusStyles: Record<Status, { bg: string; text: string; labelKey: string }> = {
  // Event statuses
  planning: { bg: "bg-muted", text: "text-muted-foreground", labelKey: "status.planning" },
  "in-progress": { bg: "bg-accent/20", text: "text-accent", labelKey: "status.inProgress" },
  completed: { bg: "bg-success/20", text: "text-success", labelKey: "status.completed" },
  // Guest statuses
  pending: { bg: "bg-muted", text: "text-muted-foreground", labelKey: "status.pending" },
  assigned: { bg: "bg-accent/20", text: "text-accent", labelKey: "status.assigned" },
  "picked-up": { bg: "bg-warning/20", text: "text-warning", labelKey: "status.pickedUp" },
  // Driver statuses
  available: { bg: "bg-success/20", text: "text-success", labelKey: "status.available" },
  "on-trip": { bg: "bg-accent/20", text: "text-accent", labelKey: "status.onTrip" },
}

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useLanguage()
  const style = statusStyles[status]
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        style.bg,
        style.text,
        className
      )}
    >
      {t(style.labelKey)}
    </span>
  )
}
