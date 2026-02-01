"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { getEventById } from "@/lib/mock-data"
import type { EventStatus, Event } from "@/lib/types"
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function EditEventPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  // Placeholder: replace with actual API fetch
  const event = null as Event | null // getEventById(id)
  const { t } = useLanguage()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: event?.name ?? "",
    date: event?.date ?? "",
    time: event?.time ?? "",
    address: event?.address ?? "",
    notes: event?.notes ?? "",
    status: (event?.status ?? "planning") as EventStatus,
  })

  if (!event) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    console.log("Updating event:", formData)

    router.push(`/admin/events/${id}`)
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href={`/admin/events/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("events.backToEvent")}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("events.editTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("events.modifyInformation")}
        </p>
      </div>

      {/* Form */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">{t("events.eventDetails")}</CardTitle>
          <CardDescription>
            {t("events.modifyInformation")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("events.eventNameLabel")}</Label>
              <Input
                id="name"
                placeholder={t("events.eventNamePlaceholder")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">{t("events.date")}</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">{t("events.time")}</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t("events.addressLabel")}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder={t("events.addressPlaceholder")}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t("events.status")}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as EventStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("events.selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">{t("events.statusPlanning")}</SelectItem>
                  <SelectItem value="in-progress">{t("events.statusInProgress")}</SelectItem>
                  <SelectItem value="completed">{t("events.statusCompleted")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("events.notesOptional")}</Label>
              <Textarea
                id="notes"
                placeholder={t("events.notesPlaceholder")}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? t("events.saving") : t("events.saveChanges")}
              </Button>
              <Button type="button" variant="outline" asChild className="flex-1">
                <Link href={`/admin/events/${id}`}>{t("events.cancel")}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
