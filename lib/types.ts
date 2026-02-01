export type EventStatus = "planning" | "in-progress" | "completed"
export type GuestStatus = "pending" | "assigned" | "accepted" | "arrived" | "picked-up" | "completed"
export type DriverStatus = "available" | "on-trip" | "offline"
export type VehicleType = "sedan" | "minivan" | "bus" | "suv"
export type UserRole = "admin" | "user" | "driver"
export type TransferStatus = "pending" | "accepted" | "arrived" | "in-progress" | "completed" | "declined"

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    page: number
    limit: number
  }
}

// Auth Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  token: string
  user: User
}

export interface SetupData {
  name: string
  email: string
  password: string
}

// Entity Types
export interface User {
  id: string
  _id?: string
  email: string
  name: string
  role: UserRole
  phone?: string
  isActive?: boolean
  moduleAccess?: {
    dashboard: boolean
    events: boolean
    drivers: boolean
    reports: boolean
    users: boolean
  }
  createdAt?: string
}

export interface Event {
  id: string
  _id?: string
  name: string
  date: string
  time: string
  address: string
  notes?: string
  status: EventStatus
  guestCount: number
}

export interface Guest {
  id: string
  _id?: string
  eventId: string | Event
  name: string
  phone: string
  pickupAddress: string
  dropoffAddress: string
  assignedDriverId?: string | Driver | null
  status: GuestStatus
  notes?: string
  pickupTime?: string
  createdAt?: string
  updatedAt?: string
}

export interface Driver {
  id: string
  _id?: string
  name: string
  phone: string
  email: string
  vehicleType: VehicleType
  vehicleModel: string
  licensePlate: string
  status: DriverStatus
  busyReason?: string | null
  currentTaskId?: string | Guest | null
  createdAt?: string
}

export interface Transfer {
  id: string
  _id?: string
  guestId: string | Guest
  driverId: string | Driver
  eventId: string | Event
  status: TransferStatus
  acceptedTime?: string
  pickupTime?: string
  completedTime?: string
  createdAt?: string
}

// API Response Specific Types
export interface EventsResponse {
  events: Event[]
  total: number
}

export interface EventDetailResponse {
  event: Event
  guests: Guest[]
}

export interface DriversResponse {
  drivers: Driver[]
  total: number
}

export interface GuestsResponse {
  guests: Guest[]
  total: number
}

export interface TransfersResponse {
  transfers: Transfer[]
  total: number
}

export interface DashboardStats {
  totalEvents: number
  completedEvents: number
  inProgressEvents: number
  upcomingEvents: number
  totalGuests: number
  weeklyData: { day: string; transfers: number }[]
  trends: { guests: { value: number; positive: boolean } }
}

export interface DriverStats {
  totalDrivers: number
  availableDrivers: number
  driversOnRoute: number
  driversActiveToday: number
  vehicleDistribution: { type: string; count: number }[]
}

// Form Data Types
export interface EventFormData {
  name: string
  date: string
  time: string
  address: string
  notes?: string
}

export interface GuestFormData {
  name: string
  phone: string
  pickupAddress: string
  dropoffAddress: string
  notes?: string
  eventId?: string
}

export interface DriverFormData {
  name: string
  email: string
  phone: string
  password?: string
  vehicleType: VehicleType
  vehicleModel: string
  licensePlate: string
}
