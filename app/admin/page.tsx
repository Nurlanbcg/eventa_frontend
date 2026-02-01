"use client"


import React, { useMemo } from "react"
import Link from "next/link"
import { useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { useLanguage } from "@/lib/language-context"
import {
  Calendar,
  Users,
  Car,
  Route,
  Plus,
  ArrowRight,
  Clock,
  MapPin,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"



export default function AdminDashboard() {
  const { t, language } = useLanguage()
  const [stats, setStats] = useState({
    todayEvents: 0,
    upcomingEvents: 0,
    inProgressEvents: 0,
    activeTransfers: 0,
    driversOnRoute: 0,
    availableDrivers: 0,
    totalGuests: 0,
    weeklyData: [], // Add this to state
    trends: { guests: { value: 0, positive: true } }
  })
  const [todayEventsList, setTodayEventsList] = useState<any[]>([])
  const [activeDriversList, setActiveDriversList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const statsResponse = await api.events.getStats()
        if (statsResponse.success) {
          setStats(prev => ({ ...prev, ...statsResponse.data }))
        }

        // Fetch today's events for the list
        const today = new Date().toISOString().split('T')[0]
        const eventsResponse = await api.events.getAll({ date: today })
        if (eventsResponse.success) {
          setTodayEventsList(eventsResponse.data.events)
        }

        // Fetch active drivers
        const driversResponse = await api.drivers.getAll({ status: 'on-trip' })
        if (driversResponse.success) {
          setActiveDriversList(driversResponse.data.drivers || []) // Adjust based on API structure
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Translate weekly data when language changes
  const translatedWeeklyData = useMemo(() => {
    return (stats.weeklyData || []).map((d: any) => ({
      ...d,
      day: t(`days.${d.day}`) || d.day
    }))
  }, [stats.weeklyData, t, language])

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex">
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/admin/events?create=true">
              <Plus className="h-4 w-4 mr-1" />
              {t("dashboard.createEvent")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/admin/drivers?add=true">
              <Plus className="h-4 w-4 mr-1" />
              {t("drivers.addDriver")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("dashboard.todayEvents")}
          value={stats.todayEvents}
          description={`${stats.upcomingEvents} ${t("dashboard.upcoming")}`}
          icon={Calendar}
        />
        <StatCard
          title={t("dashboard.activeTransfers")}
          value={stats.activeTransfers}
          description={t("dashboard.inProgress")}
          icon={Route}
        />
        <StatCard
          title={t("dashboard.driversOnRoute")}
          value={stats.driversOnRoute}
          description={`${stats.availableDrivers} ${t("dashboard.available")}`}
          icon={Car}
        />
        <StatCard
          title={t("dashboard.totalGuests")}
          value={stats.totalGuests}
          description={t("dashboard.acrossAllEvents")}
          icon={Users}
          trend={stats.trends?.guests}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Chart */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{t("dashboard.weeklyTransfers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={translatedWeeklyData}>
                  <XAxis
                    dataKey="day"
                    stroke="currentColor"
                    className="text-muted-foreground"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-muted-foreground"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Bar
                    dataKey="transfers"
                    name="Transfers"
                    fill="oklch(0.75 0.12 85)"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Today's Events */}
        <Card className="border-border flex flex-col">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">{t("dashboard.todayEvents")}</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-8">
              <Link href="/admin/events">
                {t("dashboard.viewAll")}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {todayEventsList.length > 0 ? (
              <div className="space-y-3">
                {todayEventsList.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event._id}`} // Use _id for MongoDB
                    className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{event.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{event.time}</span>
                        </div>
                      </div>
                      <StatusBadge status={event.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 truncate">
                      {/* Guest count might need to be fetched separately or included in event object */}
                      {/* {event.guestCount} {t("dashboard.guests")} */}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-[120px]">
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.noEvents")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Drivers */}
      <Card className="border-border">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">{t("dashboard.driversOnRouteTitle")}</CardTitle>
          <Button asChild variant="ghost" size="sm" className="h-8">
            <Link href="/admin/drivers">
              {t("dashboard.manageDrivers")}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeDriversList.length > 0 ? (
              activeDriversList.map((driver) => (
                <div key={driver._id} className="p-3 bg-muted/30 rounded-lg border border-border flex items-center gap-3">
                  <div className="p-2 bg-background rounded-full border border-border">
                    <Car className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{driver.name}</p>
                    <p className="text-xs text-muted-foreground">{driver.vehicleModel}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4 col-span-full text-center">
                {t("dashboard.noDriversOnRoute")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
