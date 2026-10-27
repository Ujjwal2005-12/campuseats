import { api } from './api';
import { Booking } from '../types';
import { DEMO_BOOKINGS } from './demoData';

export const bookingService = {
  async getAllBookings(params?: { status?: string; roomId?: number }): Promise<Booking[]> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'ALL') query.append('status', params.status);
      if (params?.roomId) query.append('roomId', params.roomId.toString());

      const res = await api.get<{ bookings: any[] }>(`/bookings?${query.toString()}`);
      if (res.bookings && Array.isArray(res.bookings) && res.bookings.length > 0) {
        return res.bookings.map((b) => ({
          id: b.id,
          displayId: `REQ-2026-${String(b.id).padStart(3, '0')}`,
          user_id: b.user_id,
          user_name: b.user_name || 'Campus Student',
          user_email: b.user_email || 'student@college.edu',
          resource_id: b.resource_id,
          resource_name: b.resource_name || 'Room',
          resource_type: b.resource_type || 'Classroom',
          building: b.resource_location || 'Academic Block',
          start_time: b.start_time,
          end_time: b.end_time,
          purpose: b.purpose,
          status: b.status,
          reviewed_by: b.reviewed_by,
          reviewer_name: b.reviewer_name,
          reviewed_at: b.reviewed_at,
          rejection_reason: b.rejection_reason,
          created_at: b.created_at,
        }));
      }
      return DEMO_BOOKINGS;
    } catch {
      return DEMO_BOOKINGS;
    }
  },

  async getMyBookings(): Promise<Booking[]> {
    try {
      const res = await api.get<{ bookings: any[] }>('/bookings/my');
      if (res.bookings && Array.isArray(res.bookings) && res.bookings.length > 0) {
        return res.bookings.map((b) => ({
          id: b.id,
          displayId: `REQ-2026-${String(b.id).padStart(3, '0')}`,
          user_id: b.user_id,
          resource_id: b.resource_id,
          resource_name: b.resource_name || 'LAB-204',
          resource_type: b.resource_type || 'Laboratory',
          building: b.resource_location || 'Academic Block',
          start_time: b.start_time,
          end_time: b.end_time,
          purpose: b.purpose,
          status: b.status,
          reviewed_by: b.reviewed_by,
          reviewed_at: b.reviewed_at,
          rejection_reason: b.rejection_reason,
          created_at: b.created_at,
        }));
      }
      return DEMO_BOOKINGS.filter((b) => b.user_id === 3 || b.user_id === 4 || b.id <= 5);
    } catch {
      return DEMO_BOOKINGS.filter((b) => b.user_id === 3 || b.user_id === 4 || b.id <= 5);
    }
  },

  async createBooking(data: { roomId: number; startTime: string; endTime: string; purpose: string }): Promise<any> {
    return api.post('/bookings', data);
  },

  async updateStatus(id: number | string, status: 'APPROVED' | 'REJECTED' | 'CANCELLED', rejection_reason?: string): Promise<any> {
    return api.put(`/bookings/${id}/status`, { status, rejection_reason });
  },

  async cancelBooking(id: number | string): Promise<any> {
    return api.post(`/bookings/${id}/cancel`);
  },
};
