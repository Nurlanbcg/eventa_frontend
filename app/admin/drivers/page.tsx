"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
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

import { StatusBadge } from "@/components/status-badge"
import type { Driver, Guest } from "@/lib/types"
import { Search, Car, Phone, Mail, UserPlus, MapPin, MessageSquare, Plus, MoreHorizontal, Pencil, Trash2, Shield, Eye, EyeOff, ArrowUpDown } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const vehicleIcons: Record<string, string> = {
  sedan: "Sedan",
  suv: "SUV",
  minivan: "Minivan",
  bus: "Bus",
}

import { api } from "@/lib/api"
import { toast } from "sonner"

export default function DriversPage() {
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "asc" | "desc">("newest")
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([])

  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false)
  const [isEditDriverOpen, setIsEditDriverOpen] = useState(false)
  const [isDeleteDriverOpen, setIsDeleteDriverOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    repeatPassword: "",
  })
  const [isLoading, setIsLoading] = useState(true)

  const [smsPreview, setSmsPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    repeatPassword: "",
    vehicleType: "sedan",
    vehicleModel: "",
    licensePlate: ""
  })
  const [showAddPassword, setShowAddPassword] = useState(false)
  const [showAddRepeatPassword, setShowAddRepeatPassword] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showChangeRepeatPassword, setShowChangeRepeatPassword] = useState(false)

  const router = useRouter()
  const hasHandledAddParam = useRef(false)

  const fetchDrivers = async () => {
    setIsLoading(true)
    try {
      const response = await api.drivers.getAll({ limit: 100 })
      if (response.success) {
        setDrivers(response.data.drivers)
      }
    } catch (e) {
      console.error("Failed to fetch drivers", e)
      toast.error("Failed to fetch drivers")
    } finally {
      setIsLoading(false)
    }
  }

  // Silent refresh for real-time updates (no loading state)
  const refreshDrivers = async () => {
    try {
      const response = await api.drivers.getAll({ limit: 100 })
      if (response.success) {
        setDrivers(response.data.drivers)
      }
    } catch (e) {
      console.error("Failed to refresh drivers", e)
    }
  }

  useEffect(() => {
    fetchDrivers()

    // Poll for real-time updates every 5 seconds
    const pollInterval = setInterval(() => {
      refreshDrivers()
    }, 5000)

    // Cleanup on unmount
    return () => clearInterval(pollInterval)
  }, [])

  useEffect(() => {
    if (searchParams.get("add") === "true" && !hasHandledAddParam.current) {
      hasHandledAddParam.current = true
      setIsAddDriverOpen(true)
      router.replace("/admin/drivers")
    }
  }, [searchParams, router])

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.repeatPassword) {
      toast.error(t("drivers.passwordMismatch") || "Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      toast.error(t("drivers.passwordLength") || "Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    try {
      const response = await api.drivers.create({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        vehicleType: formData.vehicleType as "sedan" | "minivan" | "bus" | "suv",
        vehicleModel: formData.vehicleModel,
        licensePlate: formData.licensePlate,
        password: formData.password
      })
      if (response.success) {
        toast.success(t("drivers.addSuccess") || "Driver added successfully")
        setIsAddDriverOpen(false)
        setFormData({
          name: "",
          phone: "",
          email: "",
          password: "",
          repeatPassword: "",
          vehicleType: "sedan",
          vehicleModel: "",
          licensePlate: ""
        })
        fetchDrivers()
      }
    } catch (error: any) {
      console.error("Add driver error:", error)
      const msg = error.message || ""
      if (msg === "DRIVER_EMAIL_EXISTS") {
        toast.error(t("drivers.emailExists"))
      } else if (msg === "DRIVER_PLATE_EXISTS") {
        toast.error(t("drivers.plateExists"))
      } else {
        toast.error("Failed to add driver")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDriver) return
    setIsLoading(true)
    try {
      const response = await api.drivers.update(selectedDriver._id || selectedDriver.id, {
        email: selectedDriver.email,
        phone: selectedDriver.phone,
        vehicleType: selectedDriver.vehicleType,
        vehicleModel: selectedDriver.vehicleModel,
        licensePlate: selectedDriver.licensePlate,
        name: selectedDriver.name
      })
      if (response.success) {
        toast.success(t("drivers.updateSuccess") || "Driver updated successfully")
        setIsEditDriverOpen(false)
        setSelectedDriver(null)
        fetchDrivers()
      }
    } catch (error) {
      console.error("Update driver error:", error)
      toast.error("Failed to update driver")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDriver = async () => {
    if (!selectedDriver) return
    setIsLoading(true)
    try {
      const response = await api.drivers.delete(selectedDriver._id || selectedDriver.id)
      if (response.success) {
        toast.success(t("drivers.deleteSuccess") || "Driver deleted successfully")
        setIsDeleteDriverOpen(false)
        setSelectedDriver(null)
        fetchDrivers()
      }
    } catch (error) {
      console.error("Delete driver error:", error)
      toast.error("Failed to delete driver")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDriver) return

    if (passwordData.newPassword !== passwordData.repeatPassword) {
      toast.error(t("drivers.passwordMismatch") || "Passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(t("drivers.passwordLength") || "Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    try {
      const response = await api.drivers.changePassword(selectedDriver._id || selectedDriver.id, {
        newPassword: passwordData.newPassword
      })

      if (response.success) {
        toast.success(t("drivers.passwordUpdated") || "Password updated successfully")
        setIsChangePasswordOpen(false)
        setPasswordData({ newPassword: "", repeatPassword: "" })
        setSelectedDriver(null)
      }
    } catch (error) {
      console.error("Change password error:", error)
      toast.error("Failed to update password")
    } finally {
      setIsLoading(false)
    }
  }





  // Effect to filter drivers
  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase()
    const filtered = drivers.filter(driver =>
      (driver.name?.toLowerCase() || "").includes(lowerQuery) ||
      (driver.vehicleModel?.toLowerCase() || "").includes(lowerQuery) ||
      (driver.licensePlate?.toLowerCase() || "").includes(lowerQuery)
    )
    setFilteredDrivers(filtered)
  }, [drivers, searchQuery])

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("drivers.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("drivers.subtitle")}
          </p>
        </div>
        <Button onClick={() => setIsAddDriverOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t("drivers.addDriver")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <Car className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{drivers.filter((d) => d.status === "available").length}</p>
                <p className="text-xs text-muted-foreground">{t("drivers.available")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Car className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{drivers.filter((d) => d.status === "on-trip").length}</p>
                <p className="text-xs text-muted-foreground">{t("drivers.onTrip")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Car className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{drivers.length}</p>
                <p className="text-xs text-muted-foreground">{t("drivers.totalDrivers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("drivers.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 h-9">
              <ArrowUpDown className="h-4 w-4" />
              {sortBy === "newest" ? t("drivers.sortNewest") : sortBy === "asc" ? t("drivers.sortAZ") : t("drivers.sortZA")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy("newest")}>
              {t("drivers.sortNewest")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("asc")}>
              {t("drivers.sortAZ")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("desc")}>
              {t("drivers.sortZA")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <LoadingSpinner size={300} />
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="border-border hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("drivers.tableDriver")}</TableHead>
                  <TableHead>{t("drivers.tableContact")}</TableHead>
                  <TableHead>{t("drivers.tableVehicle")}</TableHead>
                  <TableHead>{t("drivers.tableStatus")}</TableHead>
                  <TableHead className="text-right">{t("drivers.tableActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  // Apply sorting to filtered drivers
                  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
                    if (sortBy === "asc") return a.name.localeCompare(b.name)
                    if (sortBy === "desc") return b.name.localeCompare(a.name)
                    // newest - sort by creation date descending (most recent first)
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                    return dateB - dateA
                  })
                  return sortedDrivers.map((driver) => {
                    const currentGuest = (typeof driver.currentTaskId === 'object' && driver.currentTaskId !== null)
                      ? driver.currentTaskId as Guest
                      : null;
                    return (
                      <TableRow key={driver._id || driver.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                              <Car className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{driver.name}</p>
                              <p className="text-xs text-muted-foreground">{driver.licensePlate}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <a href={`tel:${driver.phone}`} className="text-sm flex items-center gap-1.5 hover:underline decoration-muted-foreground/50">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {driver.phone}
                            </a>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              {driver.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{driver.vehicleModel}</p>
                            <p className="text-xs text-muted-foreground">{vehicleIcons[driver.vehicleType]}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <StatusBadge status={driver.status} />
                            {driver.status === 'offline' && driver.busyReason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {driver.busyReason}
                              </p>
                            )}
                            {currentGuest && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {currentGuest.name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDriver(driver)
                                    setIsEditDriverOpen(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  {t("drivers.editDriver")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDriver(driver)
                                    setIsChangePasswordOpen(true)
                                  }}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  {t("drivers.changePassword")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedDriver(driver)
                                    setIsDeleteDriverOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t("drivers.deleteDriver")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                })()}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile Cards */}
          <div className="grid gap-4 md:hidden">
            {(() => {
              // Apply sorting to filtered drivers
              const sortedDrivers = [...filteredDrivers].sort((a, b) => {
                if (sortBy === "asc") return a.name.localeCompare(b.name)
                if (sortBy === "desc") return b.name.localeCompare(a.name)
                // newest - sort by creation date descending (most recent first)
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                return dateB - dateA
              })
              return sortedDrivers.map((driver) => {
                const currentGuest = (typeof driver.currentTaskId === 'object' && driver.currentTaskId !== null)
                  ? driver.currentTaskId as Guest
                  : null;
                return (
                  <Card key={driver._id || driver.id} className="border-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                            <Car className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{driver.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{driver.licensePlate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={driver.status} />
                          {driver.status === 'offline' && driver.busyReason && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {driver.busyReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <p className="font-medium">{driver.vehicleModel}</p>
                        <p className="text-xs text-muted-foreground">{vehicleIcons[driver.vehicleType]}</p>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <a href={`tel:${driver.phone}`} className="flex items-center gap-1.5 hover:underline decoration-muted-foreground/50">
                          <Phone className="h-3 w-3" />
                          {driver.phone}
                        </a>
                        <p className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          {driver.email}
                        </p>
                      </div>
                      {currentGuest && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 pt-2 border-t border-border">
                          <MapPin className="h-3 w-3" />
                          {t("drivers.currentlyWith")}: {currentGuest.name}
                        </p>
                      )}
                      <div className="flex gap-2 pt-3 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedDriver(driver)
                            setIsEditDriverOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          {t("drivers.editDriver")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedDriver(driver)
                            setIsChangePasswordOpen(true)
                          }}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {t("drivers.changePassword")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => {
                            setSelectedDriver(driver)
                            setIsDeleteDriverOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("drivers.deleteDriver")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            })()}
          </div>

          {filteredDrivers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("drivers.noDriversFound")}</p>
            </div>
          )}
        </>
      )}

      {/* Assign Dialog */}


      {/* SMS Preview Dialog */}
      <Dialog open={!!smsPreview} onOpenChange={() => setSmsPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              {t("drivers.smsPreviewTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("drivers.smsPreviewDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-lg bg-muted border border-border">
            <p className="text-sm">{smsPreview}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setSmsPreview(null)} className="flex-1">
              {t("drivers.sendNotification")}
            </Button>
            <Button variant="outline" onClick={() => setSmsPreview(null)} className="flex-1">
              {t("drivers.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Driver Dialog */}
      <Dialog open={isAddDriverOpen} onOpenChange={setIsAddDriverOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("drivers.addDriverTitle")}</DialogTitle>
            <DialogDescription>
              {t("drivers.addDriverDescription")}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleAddDriver}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="driverName">{t("drivers.fullName")}</Label>
              <Input
                id="driverName"
                placeholder={t("drivers.fullNamePlaceholder")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverEmail">{t("drivers.email")}</Label>
              <Input
                id="driverEmail"
                type="email"
                placeholder={t("drivers.emailPlaceholder")}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driverPassword">{t("drivers.password")}</Label>
                <div className="relative">
                  <Input
                    id="driverPassword"
                    type={showAddPassword ? "text" : "password"}
                    placeholder={t("drivers.passwordPlaceholder")}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverRepeatPassword">{t("drivers.repeatPassword")}</Label>
                <div className="relative">
                  <Input
                    id="driverRepeatPassword"
                    type={showAddRepeatPassword ? "text" : "password"}
                    placeholder={t("drivers.repeatPasswordPlaceholder")}
                    value={formData.repeatPassword}
                    onChange={(e) => setFormData({ ...formData, repeatPassword: e.target.value })}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddRepeatPassword(!showAddRepeatPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAddRepeatPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driverPhone">{t("drivers.phoneLabel")}</Label>
                <Input
                  id="driverPhone"
                  type="tel"
                  placeholder={t("drivers.phonePlaceholder")}
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d+]/g, "")
                    setFormData({ ...formData, phone: value })
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleType">{t("drivers.vehicleType")}</Label>
                <Select required value={formData.vehicleType} onValueChange={(val) => setFormData({ ...formData, vehicleType: val })}>
                  <SelectTrigger id="vehicleType" className="w-full">
                    <SelectValue placeholder={t("drivers.vehicleTypePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedan">{t("drivers.sedan")}</SelectItem>
                    <SelectItem value="suv">{t("drivers.suv")}</SelectItem>
                    <SelectItem value="minivan">{t("drivers.minivan")}</SelectItem>
                    <SelectItem value="bus">{t("drivers.bus")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleModel">{t("drivers.vehicleModel")}</Label>
                <Input
                  id="vehicleModel"
                  placeholder={t("drivers.vehicleModelPlaceholder")}
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licensePlate">{t("drivers.licensePlate")}</Label>
                <Input
                  id="licensePlate"
                  placeholder={t("drivers.licensePlatePlaceholder")}
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>{t("drivers.addDriverButton")}</Button>
              <Button type="button" variant="outline" onClick={() => setIsAddDriverOpen(false)} className="flex-1">
                {t("drivers.cancel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={isEditDriverOpen} onOpenChange={setIsEditDriverOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("drivers.editDriver")}</DialogTitle>
            <DialogDescription>
              {t("drivers.editDriverDescription")}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleUpdateDriver}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="editDriverName">{t("drivers.fullName")}</Label>
              <Input
                id="editDriverName"
                value={selectedDriver?.name || ""}
                onChange={(e) => selectedDriver && setSelectedDriver({ ...selectedDriver, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDriverEmail">{t("drivers.email")}</Label>
              <Input
                id="editDriverEmail"
                type="email"
                value={selectedDriver?.email || ""}
                onChange={(e) => selectedDriver && setSelectedDriver({ ...selectedDriver, email: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editDriverPhone">{t("drivers.phoneLabel")}</Label>
                <Input
                  id="editDriverPhone"
                  type="tel"
                  value={selectedDriver?.phone || ""}
                  onChange={(e) => {
                    if (selectedDriver) {
                      const value = e.target.value.replace(/[^\d+]/g, "")
                      setSelectedDriver({ ...selectedDriver, phone: value })
                    }
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editVehicleType">{t("drivers.vehicleType")}</Label>
                <Select
                  value={selectedDriver?.vehicleType || "sedan"}
                  onValueChange={(val: any) => selectedDriver && setSelectedDriver({ ...selectedDriver, vehicleType: val })}
                  required
                >
                  <SelectTrigger id="editVehicleType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedan">{t("drivers.sedan")}</SelectItem>
                    <SelectItem value="suv">{t("drivers.suv")}</SelectItem>
                    <SelectItem value="minivan">{t("drivers.minivan")}</SelectItem>
                    <SelectItem value="bus">{t("drivers.bus")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editVehicleModel">{t("drivers.vehicleModel")}</Label>
                <Input
                  id="editVehicleModel"
                  value={selectedDriver?.vehicleModel || ""}
                  onChange={(e) => selectedDriver && setSelectedDriver({ ...selectedDriver, vehicleModel: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLicensePlate">{t("drivers.licensePlate")}</Label>
                <Input
                  id="editLicensePlate"
                  value={selectedDriver?.licensePlate || ""}
                  onChange={(e) => selectedDriver && setSelectedDriver({ ...selectedDriver, licensePlate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>{t("events.saveChanges")}</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDriverOpen(false)} className="flex-1">
                {t("drivers.cancel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Driver Dialog */}
      <Dialog open={isDeleteDriverOpen} onOpenChange={setIsDeleteDriverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("drivers.deleteDriver")}</DialogTitle>
            <DialogDescription>
              <strong>{selectedDriver?.name}</strong> {t("users.deleteUserDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="destructive"
              onClick={handleDeleteDriver}
              className="flex-1"
              disabled={isLoading}
            >
              {t("common.delete")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDriverOpen(false)}
              className="flex-1"
            >
              {t("drivers.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("drivers.changePasswordTitle")}</DialogTitle>
            <DialogDescription>
              {t("drivers.changePasswordDescription")} <strong>{selectedDriver?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t("drivers.newPassword")}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showChangePassword ? "text" : "password"}
                  placeholder={t("drivers.newPasswordPlaceholder")}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showChangePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="repeat-password">{t("drivers.repeatPassword")}</Label>
              <div className="relative">
                <Input
                  id="repeat-password"
                  type={showChangeRepeatPassword ? "text" : "password"}
                  placeholder={t("drivers.repeatPasswordPlaceholder")}
                  value={passwordData.repeatPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, repeatPassword: e.target.value })}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowChangeRepeatPassword(!showChangeRepeatPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showChangeRepeatPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? t("users.saving") : t("drivers.changePassword")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(false)} className="flex-1">
                {t("drivers.cancel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div >
  )
}
