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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

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
    weeklyData: [] as { day: string; transfers: number }[],
    trends: { guests: { value: 0, positive: true } }
  })
  const [vehicleTypeData, setVehicleTypeData] = useState([
    { type: "", value: 0, color: "" },
  ])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportDataType, setExportDataType] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

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
          fullStats.activeEvents = data.totalEvents || 0
          fullStats.completedEvents = data.completedEvents || 0
          fullStats.inProgressEvents = (data.inProgressEvents || 0) + (data.upcomingEvents || 0)
          fullStats.planningEvents = data.upcomingEvents || 0
          fullStats.weeklyData = data.weeklyData || []
          fullStats.trends = data.trends || { guests: { value: 0, positive: true } }
        }

        // Store raw vehicle types
        const rawVehicleData = [
          { type: "sedan", value: 0, color: "oklch(0.75 0.12 85)" },
          { type: "suv", value: 0, color: "oklch(0.65 0.15 240)" },
          { type: "minivan", value: 0, color: "oklch(0.65 0.2 300)" },
          { type: "bus", value: 0, color: "oklch(0.65 0.15 145)" },
        ]

        if (driversResponse.success) {
          const data = driversResponse.data
          // Use active drivers (completed/on-trip today) or fallback to on-route
          fullStats.driversWorkingToday = data.driversActiveToday || data.driversOnRoute || 0
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

        // Fetch recent transfers for the table
        const transfersResponse = await api.transfers.getAll({ limit: 5, sort: '-updatedAt' })
        if (transfersResponse.success) {
          setRecentActivity(transfersResponse.data.transfers || [])
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

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split("/").map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  }

  const handleDateChange = (value: string, setter: (val: string) => void, prevValue: string) => {
    let cleanValue = value.replace(/[^\d/]/g, "")
    // Prevent adding more than 10 characters
    if (cleanValue.length > 10) return

    // If deleting (length decreased), don't auto-append
    if (cleanValue.length < prevValue.length) {
      setter(cleanValue)
      return
    }

    // Auto-insert slash logic
    if (cleanValue.length === 2 && !cleanValue.includes("/")) {
      cleanValue += "/"
    } else if (cleanValue.length === 5 && cleanValue.split("/").length === 2) {
      cleanValue += "/"
    }
    setter(cleanValue)
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      // Dynamic import to avoid SSR issues with exceljs
      const ExcelJS = await import("exceljs")

      let data: any[] = []
      let filename = `report-${exportDataType}-${startDate.replace(/\//g, '-')}_${endDate.replace(/\//g, '-')}.xlsx`

      const start = parseDate(startDate)
      const end = parseDate(endDate)

      if (!exportDataType) {
        alert(t("reports.selectReportType") || "Hesabat növünü seçin")
        setExporting(false)
        return
      }

      if (!start || !end) {
        alert("Please enter valid dates")
        setExporting(false)
        return
      }
      // Set end date to end of day
      end.setHours(23, 59, 59, 999)

      const parseDataDate = (dateVal: any) => {
        if (!dateVal) return null

        // If already a Date object
        if (dateVal instanceof Date) return dateVal

        // If string, try to detect format
        if (typeof dateVal === 'string') {
          // Check for DD/MM/YYYY format (e.g. 27/01/2026)
          if (/^\d{2}\/\d{2}\/\d{4}/.test(dateVal)) {
            const [day, month, year] = dateVal.split('/').map(Number)
            return new Date(year, month - 1, day)
          }

          // Try standard parsing
          const d = new Date(dateVal)
          if (!isNaN(d.getTime())) return d
        }

        return null
      }

      // Fetch and filter data based on type
      if (exportDataType === "drivers") {
        const response = await api.drivers.getAll({ limit: 1000 })
        if (response.success) {
          data = response.data.drivers
            .filter((d: any) => {
              const date = parseDataDate(d.createdAt)
              return date && date >= start && date <= end
            })
            .map((d: any) => ({
              [t("reports.colName")]: d.name,
              [t("reports.colEmail")]: d.email,
              [t("reports.colPhone")]: d.phone,
              [t("reports.colStatus")]: t(`status.${d.status}`) || d.status,
              [t("reports.colVehicle")]: d.vehicleType || "—",
              [t("reports.colPlate")]: d.licensePlate || "—",
              [t("reports.colCreated")]: parseDataDate(d.createdAt)?.toLocaleDateString('en-GB') || d.createdAt
            }))
        }
      } else if (exportDataType === "events") {
        const [eventsResponse, guestsResponse] = await Promise.all([
          api.events.getAll({ limit: 1000 }),
          api.guests.getAll({ limit: 5000 })
        ])

        if (eventsResponse.success) {
          // Create a map of transfer counts (assigned/completed guests) per event
          const transferCounts = new Map<string, number>()
          const guestCounts = new Map<string, number>()

          if (guestsResponse.success) {
            guestsResponse.data.guests.forEach((g: any) => {
              // Handle populated eventId or string eventId
              const eventId = typeof g.eventId === 'object' ? g.eventId?._id : g.eventId
              if (eventId) {
                // Count all guests as guest count for the event
                guestCounts.set(eventId, (guestCounts.get(eventId) || 0) + 1)

                if (g.status === 'completed') {
                  transferCounts.set(eventId, (transferCounts.get(eventId) || 0) + 1)
                }
              }
            })
          }

          data = eventsResponse.data.events
            .filter((e: any) => {
              const d = parseDataDate(e.date)
              // Handle potential invalid dates
              if (!d) return false;
              return d >= start && d <= end
            })
            .map((e: any) => ({
              [t("reports.colName")]: e.name,
              [t("reports.colDate")]: parseDataDate(e.date)?.toLocaleDateString('en-GB') || e.date,
              [t("reports.colTime")]: e.time,
              [t("reports.colLocation")]: e.address || e.location,
              [t("reports.colStatus")]: t(`status.${e.status}`) || e.status,
              [t("reports.colGuestCount")]: e.guestCount || guestCounts.get(e._id || e.id) || 0,
              [t("reports.colTransferCount")]: transferCounts.get(e._id || e.id) || 0
            }))
        }
      } else if (exportDataType === "guests") {
        const response = await api.guests.getAll({ limit: 1000 })
        if (response.success) {
          data = response.data.guests
            .filter((g: any) => {
              const date = parseDataDate(g.updatedAt || g.createdAt)
              return date && date >= start && date <= end
            })
            .map((g: any) => ({
              [t("reports.colName")]: g.name,
              [t("reports.colPhone")]: g.phone || "—",
              [t("reports.colHotel")]: g.pickupAddress || "—",
              [t("reports.colEvent")]: g.eventId?.name || "—",
              [t("reports.colDriver")]: g.assignedDriverId?.name || "Unassigned",
              [t("reports.colStatus")]: t(`status.${g.status}`) || g.status,
              [t("reports.colPickupTime")]: g.pickupTime ? new Date(g.pickupTime).toLocaleString('en-GB') : "—"
            }))
        }
      } else if (exportDataType === "transfers") {
        const response = await api.transfers.getAll({ limit: 1000 })
        if (response.success) {
          data = response.data.transfers
            .filter((t: any) => {
              const date = parseDataDate(t.createdAt)
              return date && date >= start && date <= end
            })
            .map((tr: any) => ({
              [t("reports.colTransferID")]: tr._id,
              [t("reports.colGuest")]: tr.guestId?.name || "—",
              [t("reports.colDriver")]: tr.driverId?.name || "—",
              [t("reports.colFrom")]: tr.guestId?.pickupAddress || "—",
              [t("reports.colTo")]: tr.guestId?.dropoffAddress || "—",
              [t("reports.colAcceptedTime")]: tr.acceptedTime ? new Date(tr.acceptedTime).toLocaleString('en-GB') : "—",
              [t("reports.colDriverPickupTime")]: tr.pickupTime ? new Date(tr.pickupTime).toLocaleString('en-GB') : "—",
              [t("reports.colCompletedTime")]: tr.completedTime ? new Date(tr.completedTime).toLocaleString('en-GB') : "—",
              [t("reports.colStatus")]: t(`status.${tr.status}`) || tr.status
            }))
        }
      }

      if (data.length === 0) {
        alert(t("common.noData"))
        setExporting(false)
        return
      }

      // Create workbook and worksheet using ExcelJS
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Report")

      // Add headers from the first data object's keys
      if (data.length > 0) {
        const headers = Object.keys(data[0])
        worksheet.addRow(headers)

        // Style header row
        const headerRow = worksheet.getRow(1)
        headerRow.font = { bold: true }
        headerRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          }
        })

        // Add data rows
        data.forEach((row) => {
          worksheet.addRow(Object.values(row))
        })

        // Auto-fit column widths
        worksheet.columns.forEach((column) => {
          let maxLength = 10
          column.eachCell?.({ includeEmpty: true }, (cell) => {
            const cellValue = cell.value?.toString() || ''
            maxLength = Math.max(maxLength, cellValue.length)
          })
          column.width = Math.min(maxLength + 2, 50)
        })
      }

      // Generate buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error("Export failed:", error)
      alert(t("common.error"))
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size={300} />
      </div>
    )
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
          <Button onClick={() => setIsExportModalOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            {t("reports.downloadReport") || "Hesabatı Yüklə"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
                <BarChart data={translatedWeeklyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <XAxis
                    dataKey="day"
                    stroke="currentColor"
                    className="text-muted-foreground"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-muted-foreground"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Bar
                    dataKey="transfers"
                    name="Transfers"
                    fill="oklch(0.75 0.12 85)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
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
              {recentActivity.map((transfer: any) => {
                const guest = transfer.guestId
                const driver = transfer.driverId
                const event = transfer.eventId
                const timeStr = transfer.completedTime || transfer.pickupTime || transfer.createdAt
                return (
                  <TableRow key={transfer._id}>
                    <TableCell className="font-medium">
                      {guest?.name || "Unknown"}
                    </TableCell>
                    <TableCell>{driver?.name || "—"}</TableCell>
                    <TableCell>{event?.name || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={transfer.status}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {timeStr ? new Date(timeStr).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }) : "-"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("reports.exportModalTitle") || "Hesabatı Yüklə"}</DialogTitle>
            <DialogDescription>
              {t("reports.selectCriteria") || "Məlumat növünü və vaxt intervalını seçin"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("reports.dataType") || "Məlumat Növü"}</Label>
              <Select value={exportDataType} onValueChange={setExportDataType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("reports.selectReportType") || "Hesabat növünü seçin"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drivers">{t("reports.typeDrivers") || "Sürücülər"}</SelectItem>
                  <SelectItem value="transfers">{t("reports.typeTransfers") || "Transferlər"}</SelectItem>
                  <SelectItem value="events">{t("reports.typeEvents") || "Tədbirlər"}</SelectItem>
                  <SelectItem value="guests">{t("reports.typeGuests") || "Qonaqlar"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("reports.startDate")}</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="DD/MM/YYYY"
                    value={startDate}
                    onChange={(e) => handleDateChange(e.target.value, setStartDate, startDate)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("reports.endDate")}</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="DD/MM/YYYY"
                    value={endDate}
                    onChange={(e) => handleDateChange(e.target.value, setEndDate, endDate)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => {
              handleExport()
              setIsExportModalOpen(false)
            }} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {t("reports.download") || "Yüklə"}
            </Button>
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)} className="flex-1">
              {t("common.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
