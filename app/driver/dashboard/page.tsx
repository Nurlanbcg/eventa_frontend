"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"

import type { GuestStatus, Guest } from "@/lib/types"
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  CheckCircle2,
  User,
  Calendar,
  ArrowRight,
} from "lucide-react"

// Mock driver's assigned tasks
const driverTasks: Guest[] = []
// const driverTasks = mockGuests.filter(
//   (g) => g.assignedDriverId === "drv-001" && g.status !== "completed"
// )

const completedTasks: Guest[] = []
// const completedTasks = mockGuests.filter(
//   (g) => g.assignedDriverId === "drv-001" && g.status === "completed"
// )

export default function DriverDashboard() {
  const [tasks, setTasks] = useState<Guest[]>(driverTasks)

  const updateTaskStatus = (taskId: string, newStatus: GuestStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    )
  }

  const getNextStatus = (currentStatus: GuestStatus): GuestStatus | null => {
    switch (currentStatus) {
      case "assigned":
        return "picked-up"
      case "picked-up":
        return "completed"
      default:
        return null
    }
  }

  const getStatusButtonLabel = (status: GuestStatus): string => {
    switch (status) {
      case "assigned":
        return "Mark as Arrived"
      case "picked-up":
        return "Mark as Completed"
      default:
        return ""
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Today's Tasks</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {tasks.length} active transfer{tasks.length !== 1 ? "s" : ""} assigned to you
        </p>
      </div>

      {/* Active Tasks */}
      <div className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const event = null // getEventById(task.eventId)
            const nextStatus = getNextStatus(task.status)
            return (
              <Card key={task.id} className="border-border overflow-hidden">
                <CardHeader className="pb-3 bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-accent" />
                        {task.name}
                      </CardTitle>
                      {event && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {/* event.name */}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={task.status} />
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
                          Pickup Location
                        </p>
                        <p className="text-sm mt-0.5">{task.pickupAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-accent/20 rounded-lg shrink-0">
                        <MapPin className="h-4 w-4 text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Drop-off Location
                        </p>
                        <p className="text-sm mt-0.5">{task.dropoffAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Guest Contact */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Guest Phone</p>
                      <p className="text-sm font-medium">{task.phone}</p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${task.phone}`}>Call</a>
                    </Button>
                  </div>

                  {/* Event Time */}
                  {event && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Event at {/* event.time */}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {task.notes && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-xs font-medium text-warning mb-1">Special Notes</p>
                      <p className="text-sm">{task.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1 bg-transparent" variant="outline" asChild>
                      <Link href={`/driver/dashboard/task/${task.id}`}>
                        <Navigation className="h-4 w-4 mr-2" />
                        Navigate
                      </Link>
                    </Button>
                    {nextStatus && (
                      <Button
                        className="flex-1"
                        onClick={() => updateTaskStatus(task.id, nextStatus)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {getStatusButtonLabel(task.status)}
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
              <p className="font-medium">All tasks completed!</p>
              <p className="text-sm text-muted-foreground mt-1">
                No active transfers at the moment
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Completed Today ({completedTasks.length})
          </h2>
          <div className="space-y-2">
            {completedTasks.map((task) => {
              const event = null // getEventById(task.eventId)
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-sm font-medium">{task.name}</p>
                      <p className="text-xs text-muted-foreground">{event?.name}</p>
                    </div>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
