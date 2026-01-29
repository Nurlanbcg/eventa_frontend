"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
// import { getGuestById, getEventById } from "@/lib/mock-data"

import type { GuestStatus, Guest, Event } from "@/lib/types"
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Calendar,
  Clock,
  Navigation,
  CheckCircle2,
  Map,
} from "lucide-react"

export default function TaskDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const guest: Guest | null = null // getGuestById(id)
  const event: Event | null = null // guest ? getEventById(guest.eventId) : null

  const [status, setStatus] = useState<GuestStatus>(guest?.status || "pending")

  if (!guest || !event) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Task not found</p>
      </div>
    )
  }

  const getNextStatus = (): GuestStatus | null => {
    switch (status) {
      case "assigned":
        return "picked-up"
      case "picked-up":
        return "completed"
      default:
        return null
    }
  }

  const getStatusButtonLabel = (): string => {
    switch (status) {
      case "assigned":
        return "Guest Picked Up"
      case "picked-up":
        return "Transfer Completed"
      default:
        return ""
    }
  }

  const handleStatusUpdate = () => {
    const nextStatus = getNextStatus()
    if (nextStatus) {
      setStatus(nextStatus)
      if (nextStatus === "completed") {
        setTimeout(() => router.push("/driver/dashboard"), 1000)
      }
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href="/driver/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Transfer Details
          </h1>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Guest Info */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-accent" />
            Guest Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-medium">{guest.name}</p>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium">{guest.phone}</p>
            </div>
            <Button asChild size="sm">
              <a href={`tel:${guest.phone}`}>Call Guest</a>
            </Button>
          </div>
          {guest.notes && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs font-medium text-warning mb-1">Special Notes</p>
              <p className="text-sm">{guest.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Info */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" />
            Event Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Event</p>
            <p className="font-medium">{event.name}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Event starts at {event.time}</span>
          </div>
        </CardContent>
      </Card>

      {/* Route */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Navigation className="h-4 w-4 text-accent" />
            Route
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="p-2 bg-success/20 rounded-full">
                <MapPin className="h-4 w-4 text-success" />
              </div>
              <div className="w-0.5 h-8 bg-border my-1" />
              <div className="p-2 bg-accent/20 rounded-full">
                <MapPin className="h-4 w-4 text-accent" />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs font-medium text-success uppercase tracking-wide">Pickup</p>
                <p className="text-sm mt-0.5">{guest.pickupAddress}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-accent uppercase tracking-wide">Drop-off</p>
                <p className="text-sm mt-0.5">{guest.dropoffAddress}</p>
              </div>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="aspect-video rounded-lg bg-muted border border-border flex items-center justify-center">
            <div className="text-center">
              <Map className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Map Preview</p>
              <p className="text-xs text-muted-foreground">Navigation available in mobile app</p>
            </div>
          </div>

          <Button className="w-full bg-transparent" variant="outline" asChild>
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(guest.pickupAddress)}&destination=${encodeURIComponent(guest.dropoffAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Open in Google Maps
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Status Actions */}
      {getNextStatus() && (
        <Card className="border-border border-accent/50 bg-accent/5">
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <div>
                <p className="font-medium">Update Status</p>
                <p className="text-sm text-muted-foreground">
                  {status === "assigned"
                    ? "Tap when you've arrived at the pickup location"
                    : "Tap when the guest has been dropped off"}
                </p>
              </div>
              <Button size="lg" className="w-full" onClick={handleStatusUpdate}>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {getStatusButtonLabel()}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "completed" && (
        <Card className="border-border border-success/50 bg-success/5">
          <CardContent className="py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="font-medium text-success">Transfer Completed!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Great job! Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
