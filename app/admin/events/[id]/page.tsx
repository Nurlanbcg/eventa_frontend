"use client"

import React from "react"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import { MapPicker } from "@/components/map-picker"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

import type { Guest, Driver, Event } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Plus,
  Pencil,
  UserPlus,
  Car,
  MessageSquare,
  Map,
  Trash2,
  Search,
  ArrowUpDown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { api } from "@/lib/api"
import { toast } from "sonner"

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [event, setEvent] = useState<Event | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const { t } = useLanguage()

  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false)
  const [isAssignDriverOpen, setIsAssignDriverOpen] = useState(false)
  const [isEditEventOpen, setIsEditEventOpen] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [isDeleteGuestOpen, setIsDeleteGuestOpen] = useState(false)
  const [isDeleteEventOpen, setIsDeleteEventOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [smsPreview, setSmsPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    date: "",
    time: "",
    address: "",
    notes: "",
  })
  const [addGuestFormData, setAddGuestFormData] = useState({
    name: "",
    phone: "",
    pickup: "",
    dropoff: "",
    notes: "",
  })
  const [activeMapField, setActiveMapField] = useState<"event" | "pickup" | "dropoff" | null>(null)

  // Guest filtering and sorting state
  const [guestSearchQuery, setGuestSearchQuery] = useState("")
  const [guestStatusFilter, setGuestStatusFilter] = useState<string>("all")
  const [guestSortBy, setGuestSortBy] = useState<"newest" | "asc" | "desc">("newest")

  const fetchEventDetails = async () => {
    try {
      const response = await api.events.getOne(id)
      if (response.success) {
        setEvent(response.data.event)
        setGuests(response.data.guests || [])
        // Initialize dropoff with event address
        setAddGuestFormData(prev => ({ ...prev, dropoff: response.data.event.address }))
      }
    } catch (error) {
      console.error("Failed to fetch event details:", error)
      toast.error(t("events.fetchError") || "Failed to fetch event details")
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await api.drivers.getAll({ status: 'available' })
      if (response.success) {
        setDrivers(response.data.drivers)
      }
    } catch (error) {
      console.error("Failed to fetch drivers:", error)
    }
  }

  React.useEffect(() => {
    if (id) {
      fetchEventDetails()
      fetchDrivers()

      // Poll for real-time updates every 5 seconds
      const pollInterval = setInterval(() => {
        fetchEventDetails()
        fetchDrivers() // Also refresh driver availability in real-time
      }, 5000)

      // Cleanup on unmount
      return () => clearInterval(pollInterval)
    }
  }, [id])

  React.useEffect(() => {
    if (event) {
      setAddGuestFormData(prev => ({ ...prev, dropoff: event.address }))
    }
  }, [event])

  const [tempAddress, setTempAddress] = useState("")

  // Filter and sort guests
  const filteredGuests = React.useMemo(() => {
    let result = guests

    // Apply search filter
    if (guestSearchQuery) {
      const query = guestSearchQuery.toLowerCase()
      result = result.filter(guest =>
        guest.name.toLowerCase().includes(query) ||
        guest.phone.toLowerCase().includes(query) ||
        guest.pickupAddress?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (guestStatusFilter !== "all") {
      result = result.filter(guest => guest.status === guestStatusFilter)
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      if (guestSortBy === "asc") return a.name.localeCompare(b.name)
      if (guestSortBy === "desc") return b.name.localeCompare(a.name)
      // newest - sort by creation date descending (most recent first)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })

    return result
  }, [guests, guestSearchQuery, guestStatusFilter, guestSortBy])

  if (!event) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <LoadingSpinner size={300} />
      </div>
    )
  }

  const handleAssignDriver = async (driver: Driver) => {
    if (!selectedGuest || !event) return

    try {
      const apiUrl = `http://${window.location.hostname}:5000/api`;

      // If guest already has an assigned driver, delete the existing transfer first
      if (selectedGuest.assignedDriverId) {
        const deleteResponse = await fetch(`${apiUrl}/transfers/guest/${selectedGuest._id || selectedGuest.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        const deleteResult = await deleteResponse.json();
        if (!deleteResult.success) {
          toast.error(deleteResult.message || "Failed to remove previous driver");
          return;
        }
      }

      // Create new transfer
      const response = await fetch(`${apiUrl}/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          guestId: selectedGuest._id || selectedGuest.id,
          driverId: driver._id || driver.id,
          eventId: event._id || event.id,
          pickupTime: event.time // or some default
        })
      });
      const result = await response.json();

      if (result.success) {
        toast.success(t("guests.assignSuccess") || "Driver assigned successfully")

        // Format SMS
        const sms = `${t("events.smsMessage.transferArranged")} ${t("events.smsMessage.pickup")} ${selectedGuest.pickupAddress}. ${t("events.smsMessage.time")} ${event.time}. ${t("events.smsMessage.driver")} ${driver.name} (${driver.phone}). ${t("events.smsMessage.vehicle")} ${driver.vehicleModel}.`
        setSmsPreview(sms)

        setIsAssignDriverOpen(false)
        fetchEventDetails() // Refresh list
        fetchDrivers() // Refresh drivers availability
      } else {
        toast.error(result.message || "Failed to assign driver")
      }
    } catch (error) {
      console.error("Assign driver error:", error)
      toast.error("Failed to assign driver")
    }
  }

  const handleUnassignDriver = async () => {
    if (!selectedGuest || !event) return

    try {
      const apiUrl = `http://${window.location.hostname}:5000/api`;
      const response = await fetch(`${apiUrl}/transfers/guest/${selectedGuest._id || selectedGuest.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const result = await response.json();

      if (result.success) {
        toast.success(t("guests.unassignSuccess") || "Driver unassigned successfully")
        setIsAssignDriverOpen(false)
        fetchEventDetails() // Refresh list
        fetchDrivers() // Refresh drivers availability
      } else {
        toast.error(result.message || "Failed to unassign driver")
      }
    } catch (error) {
      console.error("Unassign driver error:", error)
      toast.error("Failed to unassign driver")
    }
  }

  const openDeleteGuestModal = (guest: Guest) => {
    setGuestToDelete(guest)
    setIsDeleteGuestOpen(true)
  }

  const handleDeleteGuest = async () => {
    if (!guestToDelete) return

    try {
      const guestId = guestToDelete._id || guestToDelete.id
      const result = await api.guests.delete(guestId as string)

      if (result.success) {
        toast.success(t("guests.deleteSuccess") || "Guest deleted successfully")
        setIsDeleteGuestOpen(false)
        setGuestToDelete(null)
        fetchEventDetails() // Refresh list
      } else {
        toast.error(result.message || "Failed to delete guest")
      }
    } catch (error) {
      console.error("Delete guest error:", error)
      toast.error("Failed to delete guest")
    }
  }

  const openEditModal = () => {
    if (!event) return
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

    if (!event) return

    try {
      const response = await api.events.update(event._id || event.id, editFormData)
      if (response.success) {
        toast.success(t("events.updateSuccess") || "Event updated successfully")
        setEvent({ ...event, ...editFormData })
        setIsEditEventOpen(false)
      }
    } catch (error) {
      console.error("Update event error:", error)
      toast.error("Failed to update event")
    } finally {
      setIsLoading(false)
    }
  }

  const openMapModal = (field: "event" | "pickup" | "dropoff") => {
    setActiveMapField(field)
    if (field === "event") setTempAddress(editFormData.address)
    else if (field === "pickup") setTempAddress(addGuestFormData.pickup)
    else if (field === "dropoff") setTempAddress(addGuestFormData.dropoff)
    setIsMapModalOpen(true)
  }

  const handleMapSave = (address: string, lat: number, lng: number) => {
    if (activeMapField === "event") {
      setEditFormData({ ...editFormData, address })
    } else if (activeMapField === "pickup") {
      setAddGuestFormData({ ...addGuestFormData, pickup: address })
    } else if (activeMapField === "dropoff") {
      setAddGuestFormData({ ...addGuestFormData, dropoff: address })
    }
    setIsMapModalOpen(false)
    setActiveMapField(null)
  }

  const handleDeleteEvent = async () => {
    if (!event) return

    setIsDeleting(true)
    try {
      const response = await api.events.delete(id)
      if (response.success) {
        toast.success(t("events.deleteSuccess") || "Event deleted successfully")
        router.push("/admin/events")
      } else {
        toast.error(response.message || "Failed to delete event")
      }
    } catch (error) {
      console.error("Delete event error:", error)
      toast.error("Failed to delete event")
    } finally {
      setIsDeleting(false)
      setIsDeleteEventOpen(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/admin/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("events.backToEvents")}
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {event.name}
            </h1>
            <StatusBadge status={event.status} />
          </div>
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex">
            <Button variant="outline" size="sm" onClick={openEditModal} className="w-full sm:w-auto">
              <Pencil className="h-4 w-4 mr-2" />
              {t("events.editEvent")}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsDeleteEventOpen(true)} className="w-full sm:w-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              {t("events.deleteEvent") || "Delete Event"}
            </Button>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <Card className="border-border overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">{t("events.eventInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg shrink-0">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("events.date")}</p>
              <p className="text-sm font-medium">{event.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg shrink-0">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("events.time")}</p>
              <p className="text-sm font-medium">{event.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1 min-w-0">
            <div className="p-2 bg-muted rounded-lg shrink-0">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t("events.location")}</p>
              <p className="text-sm font-medium truncate">{event.address}</p>
            </div>
          </div>
          {event.notes && (
            <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">{t("events.notes")}</p>
              <p className="text-sm">{event.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guest List */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {t("guests.guest")} ({guests.length})
          </CardTitle>
          <Dialog open={isAddGuestOpen} onOpenChange={setIsAddGuestOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t("guests.addGuest")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("guests.addGuestTitle")}</DialogTitle>
                <DialogDescription>
                  {t("guests.addGuestDescription")}
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                if (!event) return;

                try {
                  const response = await api.guests.create({
                    ...addGuestFormData,
                    eventId: event._id || event.id,
                    pickupAddress: addGuestFormData.pickup,
                    dropoffAddress: addGuestFormData.dropoff
                  })
                  if (response.success) {
                    toast.success(t("guests.addSuccess") || "Guest added successfully")
                    setIsAddGuestOpen(false)
                    setAddGuestFormData({ name: "", phone: "", pickup: "", dropoff: event.address, notes: "" })
                    fetchEventDetails()
                  }
                } catch (error) {
                  console.error("Add guest error:", error)
                  toast.error("Failed to add guest")
                }
              }}>
                <div className="space-y-2">
                  <Label htmlFor="guestName">{t("guests.guestName")}</Label>
                  <Input
                    id="guestName"
                    placeholder={t("guests.guestNamePlaceholder")}
                    value={addGuestFormData.name}
                    onChange={(e) => setAddGuestFormData({ ...addGuestFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestPhone">{t("guests.phone")}</Label>
                  <Input
                    id="guestPhone"
                    type="tel"
                    placeholder={t("guests.phonePlaceholder")}
                    value={addGuestFormData.phone}
                    onChange={(e) => setAddGuestFormData({ ...addGuestFormData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup">{t("guests.pickup")}</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="pickup"
                        placeholder={t("guests.pickupPlaceholder")}
                        value={addGuestFormData.pickup}
                        onChange={(e) => setAddGuestFormData({ ...addGuestFormData, pickup: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 bg-transparent"
                      onClick={() => openMapModal("pickup")}
                      title={t("events.chooseOnMap")}
                    >
                      <Map className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dropoff">{t("guests.dropoff")}</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="dropoff"
                        value={addGuestFormData.dropoff}
                        onChange={(e) => setAddGuestFormData({ ...addGuestFormData, dropoff: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 bg-transparent"
                      onClick={() => openMapModal("dropoff")}
                      title={t("events.chooseOnMap")}
                    >
                      <Map className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestNotes">{t("guests.notesOptional")}</Label>
                  <Textarea
                    id="guestNotes"
                    placeholder={t("guests.notesPlaceholder")}
                    rows={2}
                    value={addGuestFormData.notes}
                    onChange={(e) => setAddGuestFormData({ ...addGuestFormData, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1">{t("guests.addButton")}</Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddGuestOpen(false)} className="flex-1">
                    {t("guests.cancel")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        {/* Search, Filter, and Sort Controls */}
        <div className="px-6 py-3 flex flex-col sm:flex-row gap-3 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("guests.searchPlaceholder") || "Search guests..."}
              value={guestSearchQuery}
              onChange={(e) => setGuestSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto gap-2 min-w-[120px] h-9">
                  {guestStatusFilter === "all" ? t("guests.allStatuses") :
                    guestStatusFilter === "pending" ? t("status.pending") :
                      guestStatusFilter === "assigned" ? t("status.assigned") :
                        guestStatusFilter === "accepted" ? t("status.accepted") :
                          guestStatusFilter === "arrived" ? t("status.arrived") :
                            guestStatusFilter === "picked-up" ? t("status.pickedUp") :
                              t("status.completed")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setGuestStatusFilter("all")}>
                  {t("guests.allStatuses")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGuestStatusFilter("pending")}>
                  {t("status.pending")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGuestStatusFilter("assigned")}>
                  {t("status.assigned")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGuestStatusFilter("accepted")}>
                  {t("status.accepted")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGuestStatusFilter("arrived")}>
                  {t("status.arrived")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGuestStatusFilter("picked-up")}>
                  {t("status.pickedUp")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGuestStatusFilter("completed")}>
                  {t("status.completed")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto gap-2 h-9">
                  <ArrowUpDown className="h-4 w-4" />
                  {guestSortBy === "newest" ? t("events.sortNewest") :
                    guestSortBy === "asc" ? t("events.sortAZ") :
                      t("events.sortZA")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setGuestSortBy("newest")}>
                  {t("events.sortNewest")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGuestSortBy("asc")}>
                  {t("events.sortAZ")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGuestSortBy("desc")}>
                  {t("events.sortZA")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent>
          {filteredGuests.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("guests.guest")}</TableHead>
                      <TableHead>{t("guests.pickup")}</TableHead>
                      <TableHead>{t("guests.driver")}</TableHead>
                      <TableHead>{t("guests.status")}</TableHead>
                      <TableHead className="w-[100px]">{t("guests.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuests.map((guest) => {
                      const driver = (typeof guest.assignedDriverId === 'object' && guest.assignedDriverId !== null)
                        ? guest.assignedDriverId as Driver
                        : null
                      return (
                        <TableRow key={guest._id || guest.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{guest.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {guest.phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm truncate max-w-[200px]">
                              {guest.pickupAddress}
                            </p>
                          </TableCell>
                          <TableCell>
                            {driver ? (
                              <div className="flex items-center gap-2 text-left">
                                <Car className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{driver.name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">{t("guests.notAssigned")}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={guest.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              {guest.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedGuest(guest)
                                    setIsAssignDriverOpen(true)
                                  }}
                                >
                                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                                  {guest.assignedDriverId ? t("guests.changeDriver") : t("guests.assign")}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => openDeleteGuestModal(guest)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="grid gap-3 md:hidden">
                {filteredGuests.map((guest) => {
                  const driver = (typeof guest.assignedDriverId === 'object' && guest.assignedDriverId !== null)
                    ? guest.assignedDriverId as Driver
                    : null
                  return (
                    <div
                      key={guest._id || guest.id}
                      className="p-4 rounded-lg border border-border bg-card overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{guest.name}</p>
                          <p className="text-xs text-muted-foreground">{guest.phone}</p>
                        </div>
                        <div className="shrink-0">
                          <StatusBadge status={guest.status} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 truncate">
                        <span className="font-medium text-foreground">{t("guests.pickup")}:</span> {guest.pickupAddress}
                      </p>
                      {driver ? (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 text-left w-full">
                          <Car className="h-3 w-3 shrink-0" />
                          <span className="font-medium text-foreground">{t("guests.driver")}:</span> <span className="truncate">{driver.name}</span>
                        </div>
                      ) : null}
                      <div className="flex gap-2 mt-2">
                        {guest.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => {
                              setSelectedGuest(guest)
                              setIsAssignDriverOpen(true)
                            }}
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            {driver ? t("guests.changeDriver") : t("guests.assignDriver")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => openDeleteGuestModal(guest)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          {t("common.delete")}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("events.noGuestsYet")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Assign Driver Dialog */}
      <Dialog open={isAssignDriverOpen} onOpenChange={setIsAssignDriverOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedGuest?.assignedDriverId ? t("guests.changeDriver") : t("guests.assignDriver")}
            </DialogTitle>
            <DialogDescription>
              {selectedGuest?.name} {t("guests.selectDriverFor")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {/* Show currently assigned driver first */}
            {selectedGuest?.assignedDriverId && (() => {
              const currentDriver = (typeof selectedGuest.assignedDriverId === 'object' && selectedGuest.assignedDriverId !== null)
                ? selectedGuest.assignedDriverId as Driver
                : null
              return currentDriver ? (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                    {t("guests.currentDriver")}
                  </p>
                  <div
                    className="w-full p-4 rounded-lg border-2 border-accent bg-accent/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <Car className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{currentDriver.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {currentDriver.vehicleModel} ({currentDriver.vehicleType})
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleUnassignDriver}
                      >
                        {t("guests.unassign")}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null
            })()}

            {/* Available drivers section */}
            {drivers.length > 0 && (
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                {t("guests.availableDrivers")}
              </p>
            )}
            {drivers.length > 0 ? (
              drivers.map((driver) => {
                const currentDriverId = selectedGuest?.assignedDriverId && typeof selectedGuest.assignedDriverId === 'object'
                  ? (selectedGuest.assignedDriverId as Driver)._id || (selectedGuest.assignedDriverId as Driver).id
                  : null
                const isCurrentDriver = currentDriverId === (driver._id || driver.id)

                // Skip current driver as it's shown above
                if (isCurrentDriver) return null

                return (
                  <div
                    key={driver._id || driver.id}
                    role="button"
                    tabIndex={0}
                    className="w-full p-4 rounded-lg border border-border hover:bg-muted/50 active:bg-muted transition-colors text-left cursor-pointer select-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    onClick={() => handleAssignDriver(driver)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleAssignDriver(driver)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <Car className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{driver.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {driver.vehicleModel} ({driver.vehicleType})
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={driver.status} />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("drivers.noDriversAvailable")}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Guest Confirmation Dialog */}
      <Dialog open={isDeleteGuestOpen} onOpenChange={setIsDeleteGuestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("guests.deleteTitle")}</DialogTitle>
            <DialogDescription>
              <span className="font-semibold">{guestToDelete?.name}</span> {t("guests.deleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              variant="destructive"
              onClick={handleDeleteGuest}
            >
              {t("common.delete")}
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => {
                setIsDeleteGuestOpen(false)
                setGuestToDelete(null)
              }}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS Preview Dialog */}
      <Dialog open={!!smsPreview} onOpenChange={() => setSmsPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              {t("events.smsPreview")}
            </DialogTitle>
            <DialogDescription>
              {t("events.smsDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-lg bg-muted border border-border">
            <p className="text-sm">{smsPreview}</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={() => setSmsPreview(null)}>
              {t("events.sendNotification")}
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => setSmsPreview(null)}>
              {t("events.close")}
            </Button>
          </div>
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
                    pattern="(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}"
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
                  onClick={() => openMapModal("event")}
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
            initialAddress={tempAddress}
            onLocationSelect={handleMapSave}
            onCancel={() => setIsMapModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteEventOpen} onOpenChange={setIsDeleteEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("events.deleteTitle")}</DialogTitle>
            <DialogDescription className="pt-2">
              <span className="font-bold text-foreground">{event?.name} </span>
              {t("events.deleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="destructive" onClick={handleDeleteEvent} disabled={isDeleting} className="flex-1">
              {isDeleting ? (t("common.deleting") || "Deleting...") : (t("common.delete") || "Delete")}
            </Button>
            <Button variant="outline" onClick={() => setIsDeleteEventOpen(false)} className="flex-1">
              {t("common.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
