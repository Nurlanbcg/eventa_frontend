export type EventStatus = "planning" | "in-progress" | "completed"
export type GuestStatus = "pending" | "assigned" | "picked-up" | "completed"
export type DriverStatus = "available" | "on-trip"
export type VehicleType = "sedan" | "minivan" | "bus" | "suv"
export type UserRole = "admin" | "user" | "driver"

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
  eventId: string
  name: string
  phone: string
  pickupAddress: string
  dropoffAddress: string
  assignedDriverId?: string | Driver | null
  status: GuestStatus
  notes?: string
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
  currentTaskId?: string | Guest | null
}

export interface Transfer {
  id: string
  _id?: string
  guestId: string
  driverId: string
  eventId: string
  status: "pending" | "arrived" | "in-progress" | "completed"
  pickupTime?: string
  completedTime?: string
}
