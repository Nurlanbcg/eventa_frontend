"use client"

import React from "react"

import { useState, useEffect, useRef, Suspense } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import type { Event } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/status-badge"
import { MapPicker } from "@/components/map-picker"

import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Map,
  ArrowUpDown,
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useSearchParams } from "next/navigation"

import { api } from "@/lib/api"
import { toast } from "sonner"

export default function EventsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "asc" | "desc">("newest")
  const [events, setEvents] = useState<Event[]>([])
  const searchParams = useSearchParams()
  const hasHandledCreateParam = useRef(false)
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [isEditEventOpen, setIsEditEventOpen] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [mapModalTarget, setMapModalTarget] = useState<"create" | "edit">("create")
  const [tempAddress, setTempAddress] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDeleteEventOpen, setIsDeleteEventOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    address: "",
    notes: "",
  })
  const [editFormData, setEditFormData] = useState({
    name: "",
    date: "",
    time: "",
    address: "",
    notes: "",
  })

  const fetchEvents = async () => {
    try {
      const response = await api.events.getAll({ limit: 100 })
      if (response.success) {
        setEvents(response.data.events)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
      toast.error(t("events.fetchError") || "Failed to fetch events")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  // Check for create=true query param to auto-open modal (only once)
  useEffect(() => {
    if (searchParams.get("create") === "true" && !hasHandledCreateParam.current) {
      hasHandledCreateParam.current = true
      setIsCreateEventOpen(true)
      // Remove query param from URL without navigation
      router.replace("/admin/events", { scroll: false })
    }
  }, [searchParams, router])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)


    try {
      const response = await api.events.create(formData)
      if (response.success) {
        toast.success(t("events.createSuccess") || "Event created successfully")
        setIsCreateEventOpen(false)
        setFormData({ name: "", date: "", time: "", address: "", notes: "" })
        fetchEvents()
      }
    } catch (error) {
      console.error("Create event error:", error)
      toast.error(t("events.createError") || "Failed to create event")
    } finally {
      setIsLoading(false)
    }
  }

  const openEditModal = (event: Event) => {
    setSelectedEvent(event)
    setEditFormData({
      name: event.name,
      date: event.date,
      time: event.time,
      address: event.address,
      notes: event.notes || "",
    })
    setIsEditEventOpen(true)
  }

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!selectedEvent) return

    try {
      const response = await api.events.update(selectedEvent._id || selectedEvent.id, editFormData)
      if (response.success) {
        toast.success(t("events.updateSuccess") || "Event updated successfully")
        setIsEditEventOpen(false)
        setSelectedEvent(null)
        setEditFormData({ name: "", date: "", time: "", address: "", notes: "" })
        fetchEvents()
      }
    } catch (error) {
      console.error("Update event error:", error)
      toast.error(t("events.updateError") || "Failed to update event")
    } finally {
      setIsLoading(false)
    }
  }

  const openDeleteEventModal = (event: Event) => {
    setEventToDelete(event)
    setIsDeleteEventOpen(true)
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    const id = eventToDelete._id || eventToDelete.id
    try {
      const response = await api.events.delete(id)
      if (response.success) {
        toast.success(t("events.deleteSuccess") || "Event deleted successfully")
        setIsDeleteEventOpen(false)
        setEventToDelete(null)
        fetchEvents()
      }
    } catch (error) {
      console.error("Delete event error:", error)
      toast.error(t("events.deleteError") || "Failed to delete event")
    }
  }

  const openMapModal = (target: "create" | "edit") => {
    setMapModalTarget(target)
    setTempAddress(target === "create" ? formData.address : editFormData.address)
    setIsMapModalOpen(true)
  }

  const handleMapSave = (address: string, lat: number, lng: number) => {
    if (mapModalTarget === "create") {
      setFormData({ ...formData, address })
    } else {
      setEditFormData({ ...editFormData, address })
    }
    setIsMapModalOpen(false)
  }

  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-[50vh]"><LoadingSpinner size={300} /></div>}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("events.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t("events.subtitle")}
            </p>
          </div>
          <Button onClick={() => setIsCreateEventOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t("events.addEvent")}
          </Button>
        </div>

        {/* Search and Sort */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("events.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 h-9">
                <ArrowUpDown className="h-4 w-4" />
                {sortBy === "newest" ? t("events.sortNewest") : sortBy === "asc" ? t("events.sortAZ") : t("events.sortZA")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("newest")}>
                {t("events.sortNewest")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("asc")}>
                {t("events.sortAZ")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("desc")}>
                {t("events.sortZA")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Table */}
        {isLoading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <LoadingSpinner size={300} />
          </div>
        ) : (
          <>
            <Card className="border-border hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("events.tableEvent")}</TableHead>
                    <TableHead>{t("events.tableDate")}</TableHead>
                    <TableHead>{t("events.location")}</TableHead>
                    <TableHead>{t("events.guests")}</TableHead>
                    <TableHead>{t("events.status")}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const sortedEvents = [...filteredEvents].sort((a, b) => {
                      if (sortBy === "asc") return a.name.localeCompare(b.name)
                      if (sortBy === "desc") return b.name.localeCompare(a.name)
                      return 0 // newest - maintain original order
                    })
                    return sortedEvents.map((event) => (
                      <TableRow
                        key={event._id || event.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/admin/events/${event._id || event.id}`)}
                      >
                        <TableCell>
                          <span className="font-medium">
                            {event.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{event.date}</span>
                            <Clock className="h-3.5 w-3.5 text-muted-foreground ml-2" />
                            <span>{event.time}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm max-w-[200px]">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{event.address}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{event.guestCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={event.status} />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">

                              <DropdownMenuItem onClick={() => openEditModal(event)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {t("events.editEvent")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openDeleteEventModal(event)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("events.deleteEvent")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  })()}
                </TableBody>
              </Table>
            </Card>

            {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
              {filteredEvents.map((event) => (
                <Card
                  key={event._id || event.id}
                  className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/admin/events/${event._id || event.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">
                        {event.name}
                      </CardTitle>
                      <StatusBadge status={event.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{event.date}</span>
                      <Clock className="h-3.5 w-3.5 ml-2" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{event.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{event.guestCount} {t("dashboard.guests")}</span>
                    </div>
                    <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => openEditModal(event)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        {t("common.edit")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => openDeleteEventModal(event)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        {t("common.delete")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t("events.noEvents")}</p>
              </div>
            )}
          </>
        )}

        {/* Create Event Modal */}
        <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("events.createTitle")}</DialogTitle>
              <DialogDescription>
                {t("events.createSubtitle")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
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
                  <Label htmlFor="date">{t("events.dateLabel")}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="text"
                      placeholder={t("events.datePlaceholder")}
                      pattern="(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\\d{4}"
                      value={formData.date}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^\d/]/g, "")
                        if (value.length < formData.date.length) {
                          setFormData({ ...formData, date: value })
                          return
                        }
                        if (value.length === 2 && !value.includes("/")) value += "/"
                        if (value.length === 5 && value.split("/").length === 2) value += "/"
                        if (value.length <= 10) setFormData({ ...formData, date: value })
                      }}
                      required
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">{t("events.timeLabel")}</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="time"
                      type="text"
                      placeholder={t("events.timePlaceholder")}
                      pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                      value={formData.time}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^\d:]/g, "")
                        if (value.length < formData.time.length) {
                          setFormData({ ...formData, time: value })
                          return
                        }
                        if (value.length === 2 && !value.includes(":")) value += ":"
                        if (value.length <= 5) setFormData({ ...formData, time: value })
                      }}
                      required
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t("events.addressLabel")}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder={t("events.addressPlaceholder")}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      className="pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 bg-transparent"
                    onClick={() => openMapModal("create")}
                    title={t("events.chooseOnMap")}
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t("events.notesOptional")}</Label>
                <Textarea
                  id="notes"
                  placeholder={t("events.notesPlaceholder")}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? t("events.creating") : t("events.createButton")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreateEventOpen(false)} className="flex-1">
                  {t("events.cancel")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Event Modal */}
        <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("events.editTitle")}</DialogTitle>
              <DialogDescription>
                {t("events.modifyInformation")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("events.eventNameLabel")}</Label>
                <Input
                  id="edit-name"
                  placeholder={t("events.eventNamePlaceholder")}
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">{t("events.dateLabel")}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-date"
                      type="text"
                      placeholder={t("events.datePlaceholder")}
                      pattern="(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\\d{4}"
                      value={editFormData.date}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^\d/]/g, "")
                        if (value.length < editFormData.date.length) {
                          setEditFormData({ ...editFormData, date: value })
                          return
                        }
                        if (value.length === 2 && !value.includes("/")) value += "/"
                        if (value.length === 5 && value.split("/").length === 2) value += "/"
                        if (value.length <= 10) setEditFormData({ ...editFormData, date: value })
                      }}
                      required
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">{t("events.timeLabel")}</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-time"
                      type="text"
                      placeholder={t("events.timePlaceholder")}
                      pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                      value={editFormData.time}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^\d:]/g, "")
                        if (value.length < editFormData.time.length) {
                          setEditFormData({ ...editFormData, time: value })
                          return
                        }
                        if (value.length === 2 && !value.includes(":")) value += ":"
                        if (value.length <= 5) setEditFormData({ ...editFormData, time: value })
                      }}
                      required
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">{t("events.addressLabel")}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-address"
                      placeholder={t("events.addressPlaceholder")}
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      required
                      className="pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 bg-transparent"
                    onClick={() => openMapModal("edit")}
                    title={t("events.chooseOnMap")}
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">{t("events.notesOptional")}</Label>
                <Textarea
                  id="edit-notes"
                  placeholder={t("events.notesPlaceholder")}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? t("events.saving") : t("events.saveChanges")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditEventOpen(false)} className="flex-1">
                  {t("events.cancel")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Event Confirmation Dialog */}
        <Dialog open={isDeleteEventOpen} onOpenChange={setIsDeleteEventOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("events.deleteTitle")}</DialogTitle>
              <DialogDescription>
                <span className="font-semibold">{eventToDelete?.name}</span> {t("events.deleteDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                variant="destructive"
                onClick={handleDeleteEvent}
              >
                {t("common.delete")}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setIsDeleteEventOpen(false)
                  setEventToDelete(null)
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Map Picker Modal */}
        <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
          <DialogContent
            className="max-w-4xl max-h-[95vh] overflow-y-auto"
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement;
              // Prevent closing when clicking on Google Maps autocomplete items
              if (target.closest('.pac-container') || target.closest('.pac-item')) {
                e.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">{t("map.title")}</DialogTitle>
              <DialogDescription className="text-sm">
                {t("map.description")}
              </DialogDescription>
            </DialogHeader>
            <MapPicker
              initialAddress={mapModalTarget === "create" ? formData.address : editFormData.address}
              onLocationSelect={handleMapSave}
              onCancel={() => setIsMapModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  )
}
