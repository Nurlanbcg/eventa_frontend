"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import type { Guest, Driver } from "@/lib/types"
// import { mockEvents, getEventById, getDriverById } from "@/lib/mock-data" // Keep mockEvents for the form, but remove mockGuests
import { Search, Plus, Phone, MapPin, Calendar, Car, Pencil, Trash2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Loading from "./loading"
import { useLanguage } from "@/lib/language-context"

import { api } from "@/lib/api"
import { toast } from "sonner"
import type { Event } from "@/lib/types"

export default function GuestsPage() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const [guests, setGuests] = useState<Guest[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false)

  const [addGuestFormData, setAddGuestFormData] = useState({
    eventId: "",
    name: "",
    phone: "",
    pickupAddress: "",
    dropoffAddress: "",
    notes: ""
  })

  const fetchGuests = async () => {
    try {
      const response = await api.guests.getAll({ limit: 100 })
      if (response.success) {
        setGuests(response.data.guests)
      }
    } catch (error) {
      console.error("Fetch guests error", error)
      toast.error("Failed to fetch guests")
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await api.events.getAll({ limit: 100 })
      if (response.success) {
        setEvents(response.data.events)
      }
    } catch (error) {
      console.error("Fetch events error", error)
    }
  }

  useState(() => {
    fetchGuests()
    fetchEvents()
  })

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await api.guests.create(addGuestFormData)
      if (response.success) {
        toast.success(t("guests.addSuccess") || "Guest added successfully")
        setIsAddGuestOpen(false)
        setAddGuestFormData({ eventId: "", name: "", phone: "", pickupAddress: "", dropoffAddress: "", notes: "" })
        fetchGuests()
      }
    } catch (error) {
      console.error("Add guest error", error)
      toast.error("Failed to add guest")
    }
  }

  const [isEditGuestOpen, setIsEditGuestOpen] = useState(false)
  const [isDeleteGuestOpen, setIsDeleteGuestOpen] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)

  const handleUpdateGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGuest) return
    try {
      const response = await api.guests.update(selectedGuest._id || selectedGuest.id, {
        name: selectedGuest.name,
        phone: selectedGuest.phone,
        pickupAddress: selectedGuest.pickupAddress,
        dropoffAddress: selectedGuest.dropoffAddress,
        notes: selectedGuest.notes,
        // We might want to allow changing event, but simple for now
      })
      if (response.success) {
        toast.success(t("guests.updateSuccess") || "Guest updated successfully")
        setIsEditGuestOpen(false)
        setSelectedGuest(null)
        fetchGuests()
      }
    } catch (error) {
      console.error("Update guest error", error)
      toast.error("Failed to update guest")
    }
  }

  const handleDeleteGuest = async () => {
    if (!selectedGuest) return
    try {
      const response = await api.guests.delete(selectedGuest._id || selectedGuest.id)
      if (response.success) {
        toast.success(t("guests.deleteSuccess") || "Guest deleted successfully")
        setIsDeleteGuestOpen(false)
        setSelectedGuest(null)
        fetchGuests()
      }
    } catch (error) {
      console.error("Delete guest error", error)
      toast.error("Failed to delete guest")
    }
  }

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.phone.includes(searchQuery)
    const matchesStatus = statusFilter === "all" || guest.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Guests
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all guests across events
            </p>
          </div>
          <Dialog open={isAddGuestOpen} onOpenChange={setIsAddGuestOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Guest</DialogTitle>
                <DialogDescription>
                  Add a guest to an event
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleAddGuest}>
                <div className="space-y-2">
                  <Label htmlFor="event">{t("guests.event")}</Label>
                  <Select required value={addGuestFormData.eventId} onValueChange={(val) => setAddGuestFormData({ ...addGuestFormData, eventId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("guests.eventPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event._id || event.id} value={event._id || event.id}>
                          {event.name} - {event.date}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                    onChange={(e) => setAddGuestFormData({ ...addGuestFormData, phone: e.target.value.replace(/[^0-9+]/g, "") })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup">{t("guests.pickup")}</Label>
                  <Input
                    id="pickup"
                    placeholder={t("guests.pickupPlaceholder")}
                    value={addGuestFormData.pickupAddress}
                    onChange={(e) => setAddGuestFormData({ ...addGuestFormData, pickupAddress: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dropoff">{t("guests.dropoff")}</Label>
                  <Input
                    id="dropoff"
                    placeholder={t("guests.dropoffPlaceholder")}
                    value={addGuestFormData.dropoffAddress}
                    onChange={(e) => setAddGuestFormData({ ...addGuestFormData, dropoffAddress: e.target.value })}
                    required
                  />
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
                <div className="flex gap-2 pt-2">
                  <Button type="submit">{t("guests.addButton")}</Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddGuestOpen(false)}>
                    {t("guests.cancel")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("guests.searchPlaceholder")}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t("guests.filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("guests.allStatus")}</SelectItem>
                  <SelectItem value="pending">{t("guests.pending")}</SelectItem>
                  <SelectItem value="assigned">{t("guests.assigned")}</SelectItem>
                  <SelectItem value="in_transit">{t("guests.inTransit")}</SelectItem>
                  <SelectItem value="completed">{t("guests.completed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Guest List */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">
              All Guests ({filteredGuests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredGuests.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Pickup</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGuests.map((guest) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const event = (guest as any).eventId as Event
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
                              {event ? (
                                <Link
                                  href={`/admin/events/${event._id || event.id}`}
                                  className="text-sm hover:underline text-accent"
                                >
                                  {event.name || "Event name"}
                                </Link>
                              ) : (
                                <span className="text-sm text-muted-foreground">Unknown</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm truncate max-w-[200px]">
                                {guest.pickupAddress}
                              </p>
                            </TableCell>
                            <TableCell>
                              {driver ? (
                                <div className="flex items-center gap-2">
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
                              <div className="flex items-center gap-2">
                                {event && (
                                  <Button asChild size="icon" variant="ghost">
                                    <Link href={`/admin/events/${event._id || event.id}`}>
                                      <Calendar className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedGuest(guest)
                                    setIsEditGuestOpen(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedGuest(guest)
                                    setIsDeleteGuestOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
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
                <div className="grid gap-3 lg:hidden">
                  {filteredGuests.map((guest) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const event = (guest as any).eventId as Event
                    const driver = (typeof guest.assignedDriverId === 'object' && guest.assignedDriverId !== null)
                      ? guest.assignedDriverId as Driver
                      : null
                    return (
                      <div
                        key={guest._id || guest.id}
                        className="p-4 rounded-lg border border-border bg-card"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <p className="font-medium text-sm">{guest.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {guest.phone}
                            </p>
                          </div>
                          <StatusBadge status={guest.status} />
                        </div>
                        {event && (
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <Link href={`/admin/events/${event._id || event.id}`} className="hover:underline text-accent">
                              {event.name}
                            </Link>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {guest.pickupAddress}
                        </p>
                        {driver && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {driver.name}
                          </p>
                        )}
                        <div className="flex gap-2 mt-3 justify-end">
                          {event && (
                            <Button asChild size="sm" variant="outline" className="bg-transparent">
                              <Link href={`/admin/events/${event._id || event.id}`}>View Event</Link>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedGuest(guest)
                              setIsEditGuestOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setSelectedGuest(guest)
                              setIsDeleteGuestOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No guests found matching your criteria.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Edit Guest Modal */}
        <Dialog open={isEditGuestOpen} onOpenChange={setIsEditGuestOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("guests.editGuestTitle") || "Edit Guest"}</DialogTitle>
              <DialogDescription>
                {t("guests.editGuestDescription") || "Update guest details"}
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleUpdateGuest}>
              <div className="space-y-2">
                <Label htmlFor="editGuestName">{t("guests.guestName")}</Label>
                <Input
                  id="editGuestName"
                  value={selectedGuest?.name || ""}
                  onChange={(e) => selectedGuest && setSelectedGuest({ ...selectedGuest, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editGuestPhone">{t("guests.phone")}</Label>
                <Input
                  id="editGuestPhone"
                  type="tel"
                  value={selectedGuest?.phone || ""}
                  onChange={(e) => selectedGuest && setSelectedGuest({ ...selectedGuest, phone: e.target.value.replace(/[^0-9+]/g, "") })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPickup">{t("guests.pickup")}</Label>
                <Input
                  id="editPickup"
                  value={selectedGuest?.pickupAddress || ""}
                  onChange={(e) => selectedGuest && setSelectedGuest({ ...selectedGuest, pickupAddress: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDropoff">{t("guests.dropoff")}</Label>
                <Input
                  id="editDropoff"
                  value={selectedGuest?.dropoffAddress || ""}
                  onChange={(e) => selectedGuest && setSelectedGuest({ ...selectedGuest, dropoffAddress: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editGuestNotes">{t("guests.notesOptional")}</Label>
                <Textarea
                  id="editGuestNotes"
                  rows={2}
                  value={selectedGuest?.notes || ""}
                  onChange={(e) => selectedGuest && setSelectedGuest({ ...selectedGuest, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">{t("common.save") || "Save Changes"}</Button>
                <Button type="button" variant="outline" onClick={() => setIsEditGuestOpen(false)}>
                  {t("guests.cancel")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Guest Modal */}
        <Dialog open={isDeleteGuestOpen} onOpenChange={setIsDeleteGuestOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("guests.deleteGuestTitle") || "Delete Guest"}</DialogTitle>
              <DialogDescription>
                {t("guests.deleteGuestConfirmation") || `Are you sure you want to delete ${selectedGuest?.name}? This action cannot be undone.`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 pt-4">
              <Button variant="destructive" onClick={handleDeleteGuest}>
                {t("common.delete") || "Delete"}
              </Button>
              <Button variant="outline" onClick={() => setIsDeleteGuestOpen(false)}>
                {t("common.cancel") || "Cancel"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </Suspense>
  )
}
