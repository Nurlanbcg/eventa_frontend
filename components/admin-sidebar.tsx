"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Car,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCog,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { SettingsModal } from "@/components/settings-modal"
import { Settings } from "lucide-react"

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [collapsed, setCollapsed] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const navItems = [
    { href: "/admin", label: t("sidebar.dashboard"), icon: LayoutDashboard, module: "dashboard" as const },
    { href: "/admin/events", label: t("sidebar.events"), icon: Calendar, module: "events" as const },
    { href: "/admin/drivers", label: t("sidebar.drivers"), icon: Car, module: "drivers" as const },
    { href: "/admin/reports", label: t("sidebar.reports"), icon: FileText, module: "reports" as const },
    { href: "/admin/users", label: t("sidebar.users"), icon: UserCog, module: "users" as const },
  ]

  // Filter nav items based on user's module access
  const accessibleNavItems = navItems.filter((item) => {
    if (!user?.moduleAccess) return true // Default to showing all if no access defined
    return user.moduleAccess[item.module] === true
  })

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2">
            <img src="/branding-logo.png" alt="Logo" className="h-8 w-auto object-contain" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {accessibleNavItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="mb-3 flex items-center justify-between group">
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={cn(
            "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            !collapsed && "w-full justify-start"
          )}
          onClick={() => {
            logout()
            window.location.href = "/"
          }}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">{t("sidebar.logout")}</span>}
        </Button>
      </div>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </aside>
  )
}
