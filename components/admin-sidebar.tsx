"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
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
  Menu,
  Globe,
  Moon,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SettingsModal } from "@/components/settings-modal"
import { Settings } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"

// Sidebar content component (reusable for both desktop and mobile)
function SidebarContent({ collapsed, onCollapse, onLinkClick }: { collapsed: boolean; onCollapse: () => void; onLinkClick?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
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
    <>
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
          onClick={onCollapse}
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
              onClick={onLinkClick}
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
            router.push("/")
          }}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">{t("sidebar.logout")}</span>}
        </Button>
      </div>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  )
}

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const router = useRouter()
  const { user, logout } = useAuth()
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const langRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: "az" as const, label: "AZE" },
    { code: "en" as const, label: "ENG" },
    { code: "ru" as const, label: "RUS" },
    { code: "tr" as const, label: "TUR" },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-900 text-white border-b border-zinc-800">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <img src="/branding-logo.png" alt="Logo" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Language Switcher */}
            <div ref={langRef} className="relative flex items-center">
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: "auto" }}
                    exit={{ opacity: 0, x: 20, width: 0 }}
                    className="flex items-center gap-1 overflow-hidden mr-1 bg-white/20 backdrop-blur-md rounded-full p-1"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code)
                          setIsLangOpen(false)
                        }}
                        type="button"
                        className={`
                          px-2 py-1 rounded-full text-xs font-semibold transition-colors
                          ${language === lang.code
                            ? "bg-white text-zinc-900"
                            : "hover:bg-white/30 text-white"
                          }
                        `}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => setIsLangOpen(!isLangOpen)}
              >
                <Globe className="h-4 w-4" />
              </Button>
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs opacity-80">{user?.email}</p>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => {
                logout()
                router.push("/")
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            <SidebarContent
              collapsed={false}
              onCollapse={() => setIsMobileOpen(false)}
              onLinkClick={() => setIsMobileOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />
      </aside>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  )
}
