"use client"

import { useState, useEffect, useMemo } from "react"
import { useLanguage } from "@/lib/language-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"

import {
  Car,
  Users,
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Calendar,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export default function ReportsPage() {
  const { t, language } = useLanguage()
  const [stats, setStats] = useState({
    driversWorkingToday: 0,
    availableDrivers: 0,
    completedTransfers: 0,
    totalGuestsServed: 0,
    activeEvents: 0,
    completedEvents: 0,
    inProgressEvents: 0,
    planningEvents: 0,
    weeklyData: [],
    trends: { guests: { value: 0, positive: true } }
  })
  const [vehicleTypeData, setVehicleTypeData] = useState([
    { type: "", value: 0, color: "" },
  ])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [eventsResponse, driversResponse, guestsResponse] = await Promise.all([
          api.events.getStats(),
          api.drivers.getStats(),
          api.guests.getAll({ limit: 5, sort: '-updatedAt' })
        ])

        const fullStats = { ...stats }

        if (eventsResponse.success) {
          const data = eventsResponse.data
          const completedTransfersThisWeek = data.weeklyData.reduce((acc: number, day: any) => acc + (day.transfers || 0), 0)

          fullStats.completedTransfers = completedTransfersThisWeek
          fullStats.totalGuestsServed = data.totalGuests || 0
          fullStats.activeEvents = (data.inProgressEvents || 0) + (data.todayEvents || 0)
          fullStats.completedEvents = data.completedEvents || 0
          fullStats.inProgressEvents = data.inProgressEvents || 0
          fullStats.planningEvents = data.upcomingEvents || 0
          fullStats.weeklyData = data.weeklyData || []
          fullStats.trends = data.trends || { guests: { value: 0, positive: true } }
        }

        // Store raw vehicle types
        const rawVehicleData = [
          { type: "sedan", value: 0, color: "oklch(0.75 0.12 85)" },
          { type: "suv", value: 0, color: "oklch(0.15 0 0)" },
          { type: "minivan", value: 0, color: "oklch(0.55 0.08 85)" },
          { type: "bus", value: 0, color: "oklch(0.65 0.15 145)" },
        ]

        if (driversResponse.success) {
          const data = driversResponse.data
          fullStats.driversWorkingToday = data.driversOnRoute || 0
          fullStats.availableDrivers = data.availableDrivers || 0

          if (data.vehicleDistribution) {
            data.vehicleDistribution.forEach((v: any) => {
              const key = v.type?.toLowerCase()
              // Match by index since order is fixed: 0=sedan, 1=suv, 2=minivan, 3=bus
              if (key === "sedan") rawVehicleData[0].value = v.count
              if (key === "suv") rawVehicleData[1].value = v.count
              if (key === "minivan") rawVehicleData[2].value = v.count
              if (key === "bus") rawVehicleData[3].value = v.count
            })
          }
        }

        setStats(prev => ({ ...prev, ...fullStats }))
        setVehicleTypeData(rawVehicleData)

        if (guestsResponse.success) {
          setRecentActivity(guestsResponse.data.guests || [])
        }
      } catch (error) {
        console.error("Failed to fetch report stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  // Translate weekly data when language changes
  const translatedWeeklyData = useMemo(() => {
    return stats.weeklyData.map((d: any) => ({
      ...d,
      day: t(`days.${d.day}`) || d.day
    }))
  }, [stats.weeklyData, t, language])

  // Translate vehicle type names when language changes
  const translatedVehicleData = useMemo(() => {
    return vehicleTypeData.map((v: any) => ({
      ...v,
      name: t(`drivers.${v.type}`) || v.type
    }))
  }, [vehicleTypeData, t, language])

  const eventStatusData = [
    { status: t("reports.statusCompleted"), count: stats.completedEvents },
    { status: t("reports.statusInProgress"), count: stats.inProgressEvents },
    { status: t("reports.statusPlanning"), count: stats.planningEvents },
  ]

  const handleExport = (type: string) => {
    // In a real app, this would trigger a download
    alert(`Exporting ${type} report... (Demo)`)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("reports.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("reports.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("CSV")}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t("reports.exportCSV")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("PDF")}>
            <FileText className="h-4 w-4 mr-2" />
            {t("reports.exportPDF")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("reports.driversWorkingToday")}
          value={stats.driversWorkingToday}
          description={`${stats.availableDrivers} ${t("drivers.available")}`}
          icon={Car}
        />
        <StatCard
          title={t("reports.completedTransfers")}
          value={stats.completedTransfers}
          description={t("reports.thisWeek")}
          icon={CheckCircle}
          trend={stats.trends.guests}
        />
        <StatCard
          title={t("reports.guestsServed")}
          value={stats.totalGuestsServed}
          description={t("reports.totalCompleted")}
          icon={Users}
        />
        <StatCard
          title={t("reports.totalEvents")}
          value={stats.activeEvents}
          description={`${stats.inProgressEvents} ${t("reports.active")}`}
          icon={Calendar}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Transfers Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              {t("reports.weeklyPerformance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
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
                  />
                  <Bar
                    dataKey="guests"
                    name="Guests"
                    fill="oklch(0.15 0 0)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Car className="h-4 w-4 text-accent" />
              {t("reports.fleetDistribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    animationDuration={2000}
                    animationEasing="ease-in-out"
                    stroke="none"
                    className="outline-none focus:outline-none"
                  >
                    {translatedVehicleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="outline-none focus:outline-none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {translatedVehicleData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Status Summary */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">{t("reports.eventStatusSummary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {eventStatusData.map((item) => (
              <div
                key={item.status}
                className="p-4 rounded-lg border border-border text-center"
              >
                <p className="text-3xl font-semibold">{item.count}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">{t("reports.recentTransfers")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reports.tableGuest")}</TableHead>
                <TableHead>{t("reports.tableDriver")}</TableHead>
                <TableHead>{t("reports.tableEvent")}</TableHead>
                <TableHead>{t("reports.tableStatus")}</TableHead>
                <TableHead>{t("reports.tableTime")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((guest: any) => {
                const driver = guest.assignedDriverId
                const event = guest.eventId
                return (
                  <TableRow key={guest._id || guest.id}>
                    <TableCell className="font-medium">
                      {guest.name || "Unknown"}
                    </TableCell>
                    <TableCell>{driver?.name || "—"}</TableCell>
                    <TableCell>{event?.name || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={guest.status}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {guest.pickupTime || "-"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card className="border-border bg-muted/30">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-medium">{t("reports.downloadFullReport")}</p>
              <p className="text-sm text-muted-foreground">
                {t("reports.downloadDescription")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleExport("Full CSV")}>
                <Download className="h-4 w-4 mr-2" />
                {t("reports.downloadButton")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
