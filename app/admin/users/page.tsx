
"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import { StatusBadge } from "@/components/status-badge"
import type { User, UserRole } from "@/lib/types"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCog,
  Shield,
  ShieldOff,
  Eye,
  EyeOff,
  ArrowUpDown,
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"

import { api } from "@/lib/api"
import { toast } from "sonner"

export default function UsersPage() {
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const { user: currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "asc" | "desc">("newest")
  const [users, setUsers] = useState<User[]>([])
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formError, setFormError] = useState("")
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    repeatPassword: "",
  })
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", // Added password field for creation
    repeatPassword: "",
    phone: "",
    role: "user" as UserRole,
    isActive: true,
    moduleAccess: {
      dashboard: true,
      events: false,
      drivers: false,
      reports: false,
      users: false,
    },
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)

  // Fetch users on mount
  // Fetch users on mount
  const fetchUsers = async () => {
    // isLoading is true initially or set before calling
    try {
      const response = await api.users.getAll()
      if (response.success) {
        setUsers(response.data.users)
      }
    } catch (error) {
      console.error("Fetch users error:", error)
      toast.error("Failed to fetch users")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Auto-select all modules when Admin role is selected
  const handleRoleChange = (value: UserRole) => {
    if (value === "admin") {
      setFormData({
        ...formData,
        role: value,
        moduleAccess: {
          dashboard: true,
          events: true,
          drivers: true,
          reports: true,
          users: true,
        },
      })
    } else {
      setFormData({
        ...formData,
        role: value,
        moduleAccess: {
          dashboard: true,
          events: false,
          drivers: false,
          reports: false,
          users: false,
        },
      })
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      repeatPassword: "",
      phone: user.phone || "",
      role: user.role,
      isActive: user.isActive ?? true,
      moduleAccess: user.moduleAccess || {
        dashboard: true,
        events: true,
        drivers: true,
        reports: true,
        users: true,
      },
    })
    setIsEditOpen(true)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    if (formData.password !== formData.repeatPassword) {
      setFormError(t("users.passwordMismatch"))
      return
    }

    setIsLoading(true)
    try {
      const response = await api.users.create(formData)
      if (response.success) {
        toast.success(t("users.createSuccess"))
        setIsAddUserOpen(false)
        setFormData({
          name: "",
          email: "",
          password: "",
          repeatPassword: "",
          phone: "",
          role: "user",
          isActive: true,
          moduleAccess: {
            dashboard: true,
            events: false,
            drivers: false,
            reports: false,
            users: false,
          },
        })
        fetchUsers()
      }
    } catch (error: any) {
      console.error("Create user error:", error)
      // Check if error message indicates email already exists
      if (error.message?.toLowerCase().includes("already exists") ||
        error.message?.toLowerCase().includes("artıq") ||
        error.message?.toLowerCase().includes("уже") ||
        error.message?.toLowerCase().includes("zaten")) {
        setFormError(t("users.emailExists"))
      } else {
        setFormError(t("users.createError"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setIsLoading(true)
    try {
      const response = await api.users.update(selectedUser._id || selectedUser.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        isActive: formData.isActive,
        moduleAccess: formData.moduleAccess
      })
      if (response.success) {
        toast.success(t("users.updateSuccess") || "User updated successfully")
        setIsEditOpen(false)
        setSelectedUser(null)
        fetchUsers()
      }
    } catch (error) {
      console.error("Update user error:", error)
      toast.error("Failed to update user")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUserStatus = async (user: User) => {
    try {
      const newStatus = !user.isActive
      // Assuming api.users.update can handle partial updates or there is a specific status endpoint
      // The backend has put /:id, so full update or partial if generic. 
      // Backend also has /:id/status but api.users.update uses /:id with body data.
      // Let's use generic update but normally status toggle is separate.
      // The routes show router.put('/:id/status'...)
      // We should probably add that to api.ts or just use fetchClient manually if not there.
      // api.users.update calls /users/:id. Let's force full update for now or add endpoint.
      // Wait, backend has router.put('/:id/status', ...). api.ts does NOT expose it explicitly in 'users' object.
      // I'll just use api.users.update for now as it's cleaner than editing api.ts right now, 
      // BUT wait, does /:id route support isActive update?
      // router.put('/:id') allows req.body.isActive check? No, looking at routes/users.js lines 138+, 
      // it takes ...req.body and runs findByIdAndUpdate. So yes it should work.
      // But wait, lines 168 checks 'isActive'. Yes it seems to support it.

      const response = await api.users.update(user._id || user.id, { isActive: newStatus })
      if (response.success) {
        toast.success("User status updated")
        fetchUsers() // Refresh list
      }
    } catch (error) {
      console.error("Toggle status error", error)
      toast.error("Failed to update status")
    }
  }

  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setIsDeleteOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setIsLoading(true)
    try {
      const response = await api.users.delete(selectedUser._id || selectedUser.id)
      if (response.success) {
        toast.success(t("users.deleteSuccess") || "User deleted successfully")
        setIsDeleteOpen(false)
        setSelectedUser(null)
        fetchUsers()
      }
    } catch (error) {
      console.error("Delete user error", error)
      toast.error("Failed to delete user")
    } finally {
      setIsLoading(false)
    }
  }

  const openChangePasswordModal = (user: User) => {
    setSelectedUser(user)
    setIsChangePasswordOpen(true)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.repeatPassword) {
      alert("Passwords do not match!")
      return
    }
    // Backend doesn't seem to have a specific admin-change-user-password endpoint in the viewed routes.
    // routes/users.js: router.put('/:id') explicitly DELETES password from body if present (lines 187-189).
    // So admin cannot change user password via simple update? 
    // Let's re-read routes/users.js carefully.
    // Lines 187-189: if (req.body.password) { delete req.body.password; }
    // So typical Update User endpoint does NOT allow password change.
    // There is no /password endpoint for admin to change OTHER user's password in the snippet.
    // There is /auth/me for self.
    // Maybe I missed something.
    // If not supported, I should probably mock it or disable it.
    // I can stick to "Not implemented backend support yet" or just hide it.
    // Actually, I should probably implement it in backend if needed.
    // But my task is connecting frontend to EXISTING backend.
    // If backend doesn't support it, I will comment it out or handle gracefully.

    // Waiting... looking at code... 
    // I will just toast "Not supported by backend yet" to be safe.

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    toast.error("Password change not supported by backend yet")
    setIsChangePasswordOpen(false)
    setPasswordData({ newPassword: "", repeatPassword: "" })
    setSelectedUser(null)
    setIsLoading(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("users.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("users.subtitle")}
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              name: "",
              email: "",
              password: "",
              repeatPassword: "",
              phone: "",
              role: "user",
              isActive: true,
              moduleAccess: {
                dashboard: true,
                events: false,
                drivers: false,
                reports: false,
                users: false,
              },
            })
            setIsAddUserOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("users.addUser")}
        </Button>
      </div>

      {/* Search and Sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("users.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 h-9">
              <ArrowUpDown className="h-4 w-4" />
              {sortBy === "newest" ? t("users.sortNewest") : sortBy === "asc" ? t("users.sortAZ") : t("users.sortZA")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy("newest")}>
              {t("users.sortNewest")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("asc")}>
              {t("users.sortAZ")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("desc")}>
              {t("users.sortZA")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <LoadingSpinner size={300} />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="overflow-x-auto hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("users.tableName")}</TableHead>
                    <TableHead>{t("users.tableEmail")}</TableHead>
                    <TableHead>{t("users.tableRole")}</TableHead>
                    <TableHead>{t("users.tablePhone")}</TableHead>
                    <TableHead>{t("users.tableStatus")}</TableHead>
                    <TableHead className="text-right">{t("users.tableActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const sortedUsers = [...filteredUsers].sort((a, b) => {
                      if (sortBy === "asc") return a.name.localeCompare(b.name)
                      if (sortBy === "desc") return b.name.localeCompare(a.name)
                      return 0 // newest - maintain original order
                    })
                    return sortedUsers.map((user) => (
                      <TableRow key={user._id || user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.role === "admin" ? (
                              <Shield className="h-4 w-4 text-accent" />
                            ) : (
                              <ShieldOff className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="capitalize">{user.role}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.phone || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.isActive ?? true}
                              onCheckedChange={() => toggleUserStatus(user)}
                              disabled={(currentUser?._id || currentUser?.id) === (user._id || user.id)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {user.isActive ? t("users.active") : t("users.disabled")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(user)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {t("users.editUser")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openChangePasswordModal(user)}>
                                <Shield className="h-4 w-4 mr-2" />
                                {t("users.changePassword")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteModal(user)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("users.deleteUser")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  })()}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="grid gap-3 p-4 md:hidden">
              {(() => {
                const sortedUsers = [...filteredUsers].sort((a, b) => {
                  if (sortBy === "asc") return a.name.localeCompare(b.name)
                  if (sortBy === "desc") return b.name.localeCompare(a.name)
                  return 0 // newest - maintain original order
                })
                return sortedUsers.map((user) => (
                  <div
                    key={user._id || user.id}
                    className="p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {user.role === "admin" ? (
                          <Shield className="h-4 w-4 text-accent" />
                        ) : (
                          <ShieldOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={user.isActive ?? true}
                          onCheckedChange={() => toggleUserStatus(user)}
                          disabled={(currentUser?._id || currentUser?.id) === (user._id || user.id)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">{t("users.tableEmail")}:</span> {user.email}
                    </p>
                    {user.phone && (
                      <p className="text-xs text-muted-foreground mb-3">
                        <span className="font-medium text-foreground">{t("users.tablePhone")}:</span> {user.phone}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditModal(user)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        {t("users.editUser")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => openDeleteModal(user)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        {t("users.deleteUser")}
                      </Button>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Create User Modal */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("users.addUserTitle")}</DialogTitle>
            <DialogDescription>
              {t("users.addUserDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("users.fullName")}</Label>
                <Input
                  id="name"
                  placeholder={t("users.fullNamePlaceholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("users.emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("users.emailPlaceholder")}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">{t("users.passwordLabel")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("users.passwordPlaceholder")}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeatPassword">{t("users.repeatPasswordLabel")}</Label>
                <div className="relative">
                  <Input
                    id="repeatPassword"
                    type={showRepeatPassword ? "text" : "password"}
                    placeholder={t("users.repeatPasswordPlaceholder")}
                    value={formData.repeatPassword}
                    onChange={(e) => setFormData({ ...formData, repeatPassword: e.target.value })}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showRepeatPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">{t("users.phoneLabel")}</Label>
                <Input
                  id="phone"
                  placeholder={t("users.phonePlaceholder")}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9+]/g, "") })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t("users.roleLabel")}</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t("users.admin")}</SelectItem>
                    <SelectItem value="user">{t("users.user")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("users.moduleAccess")}</Label>
              <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="access-dashboard"
                    checked={formData.moduleAccess.dashboard}
                    disabled={true}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        moduleAccess: { ...formData.moduleAccess, dashboard: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="access-dashboard" className="text-sm font-normal cursor-pointer">
                    {t("users.moduleAccessDashboard")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="access-events"
                    checked={formData.moduleAccess.events}
                    disabled={formData.role === "admin"}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        moduleAccess: { ...formData.moduleAccess, events: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="access-events" className="text-sm font-normal cursor-pointer">
                    {t("users.moduleAccessEvents")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="access-drivers"
                    checked={formData.moduleAccess.drivers}
                    disabled={formData.role === "admin"}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        moduleAccess: { ...formData.moduleAccess, drivers: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="access-drivers" className="text-sm font-normal cursor-pointer">
                    {t("users.moduleAccessDrivers")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="access-reports"
                    checked={formData.moduleAccess.reports}
                    disabled={formData.role === "admin"}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        moduleAccess: { ...formData.moduleAccess, reports: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="access-reports" className="text-sm font-normal cursor-pointer">
                    {t("users.moduleAccessReports")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="access-users"
                    checked={formData.moduleAccess.users}
                    disabled={formData.role === "admin"}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        moduleAccess: { ...formData.moduleAccess, users: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="access-users" className="text-sm font-normal cursor-pointer">
                    {t("users.moduleAccessUsers")}
                  </Label>
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {formError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? t("users.creating") : t("users.createButton")}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setFormError(""); setIsAddUserOpen(false) }} className="flex-1">
                {t("users.cancel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("users.editUserTitle")}</DialogTitle>
            <DialogDescription>
              {t("users.editUserDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("users.fullName")}</Label>
                <Input
                  id="edit-name"
                  placeholder={t("users.fullNamePlaceholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">{t("users.emailLabel")}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder={t("users.emailPlaceholder")}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">{t("users.phoneLabel")}</Label>
                <Input
                  id="edit-phone"
                  placeholder="+1 234 567 890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9+]/g, "") })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">{t("users.roleLabel")}</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}
                  disabled={Boolean(selectedUser && currentUser && ((selectedUser._id || selectedUser.id) === (currentUser._id || currentUser.id)))}
                >
                  <SelectTrigger id="edit-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t("users.admin")}</SelectItem>
                    <SelectItem value="user">{t("users.user")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!(selectedUser && currentUser && ((selectedUser._id || selectedUser.id) === (currentUser._id || currentUser.id))) && (
              <div className="space-y-2">
                <Label>{t("users.accountStatus")}</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.isActive ? t("users.active") : t("users.disabled")}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label>{t("users.moduleAccess")}</Label>
              <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-access-dashboard"
                    checked={formData.moduleAccess.dashboard}
                    disabled={true}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        moduleAccess: { ...formData.moduleAccess, dashboard: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="edit-access-dashboard" className="text-sm font-normal cursor-pointer">
                    {t("sidebar.dashboard")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-access-events"
                    checked={formData.moduleAccess.events}
                    disabled={formData.role === "admin"}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        moduleAccess: { ...formData.moduleAccess, events: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="edit-access-events" className="text-sm font-normal cursor-pointer">
                    {t("sidebar.events")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-access-drivers"
                    checked={formData.moduleAccess.drivers}
                    disabled={formData.role === "admin"}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        moduleAccess: { ...formData.moduleAccess, drivers: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="edit-access-drivers" className="text-sm font-normal cursor-pointer">
                    {t("sidebar.drivers")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-access-reports"
                    checked={formData.moduleAccess.reports}
                    disabled={formData.role === "admin"}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        moduleAccess: { ...formData.moduleAccess, reports: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="edit-access-reports" className="text-sm font-normal cursor-pointer">
                    {t("sidebar.reports")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-access-users"
                    checked={formData.moduleAccess.users}
                    disabled={formData.role === "admin"}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        moduleAccess: { ...formData.moduleAccess, users: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="edit-access-users" className="text-sm font-normal cursor-pointer">
                    {t("sidebar.users")}
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? t("users.saving") : t("users.saveChanges")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
                {t("users.cancel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("users.changePasswordTitle")}</DialogTitle>
            <DialogDescription>
              <strong>{selectedUser?.name}</strong> {t("users.changePasswordDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t("users.newPassword")}</Label>
              <Input
                id="new-password"
                type="password"
                placeholder={t("users.newPasswordPlaceholder")}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repeat-password">{t("users.repeatPasswordLabel")}</Label>
              <Input
                id="repeat-password"
                type="password"
                placeholder={t("users.repeatPasswordPlaceholder")}
                value={passwordData.repeatPassword}
                onChange={(e) => setPasswordData({ ...passwordData, repeatPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? t("users.updating") : t("users.changePasswordButton")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsChangePasswordOpen(false)
                  setPasswordData({ newPassword: "", repeatPassword: "" })
                }}
              >
                {t("users.cancel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("users.deleteUserTitle")}</DialogTitle>
            <DialogDescription>
              <strong>{selectedUser?.name}</strong> {t("users.deleteUserDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? t("users.deleting") : t("users.deleteUserButton")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)} className="flex-1">
              {t("users.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
