export type UserRole = "STUDENT" | "FACULTY" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active?: number | boolean;
  department?: string;
}

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "UNAVAILABLE" | "RESERVED";

export interface RoomScheduleItem {
  time: string;
  title: string;
  status: "Available" | "Occupied" | "Reserved";
}

export interface Room {
  id: number;
  name: string;
  building?: string;
  type: string;
  capacity: number;
  location?: string;
  description?: string;
  equipment?: string[];
  status: RoomStatus;
  is_active?: number | boolean;
  nextFree?: string;
  schedule?: RoomScheduleItem[];
  imageUrl?: string;
}

export type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Booking {
  id: number;
  displayId?: string;
  user_id: number;
  user_name?: string;
  user_email?: string;
  user_role?: UserRole;
  resource_id: number;
  resource_name?: string;
  resource_type?: string;
  resource_location?: string;
  building?: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: BookingStatus;
  reviewed_by?: number | null;
  reviewer_name?: string;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
}

export interface DashboardStats {
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalFacilities: number;
    availableFacilities: number;
    totalBookings: number;
    pendingBookings: number;
  };
  users: {
    students: number;
    faculty: number;
    admins: number;
  };
  facilities: {
    rooms: number;
    labs: number;
    halls: number;
    available: number;
    maintenance: number;
    occupied: number;
  };
  bookings: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
  recentActivity: any[];
}
