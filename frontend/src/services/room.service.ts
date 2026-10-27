import { api } from './api';
import { Room } from '../types';
import { DEMO_ROOMS } from './demoData';

export const roomService = {
  async getAllRooms(params?: { search?: string; status?: string; minCapacity?: number }): Promise<Room[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.status && params.status !== 'ALL') query.append('status', params.status);
      if (params?.minCapacity) query.append('minCapacity', params.minCapacity.toString());

      const res = await api.get<{ rooms: any[] }>(`/rooms?${query.toString()}`);
      if (res.rooms && Array.isArray(res.rooms) && res.rooms.length > 0) {
        return res.rooms.map((r, i) => ({
          ...DEMO_ROOMS[i % DEMO_ROOMS.length],
          id: r.id,
          name: r.name,
          capacity: r.capacity,
          location: r.location || 'Academic Block',
          description: r.description || '',
          status: r.status,
          type: r.type || 'Room',
        }));
      }
      return DEMO_ROOMS;
    } catch {
      return DEMO_ROOMS;
    }
  },

  async getRoomById(id: string | number): Promise<Room> {
    try {
      const res = await api.get<{ room: any }>(`/rooms/${id}`);
      if (res.room) {
        const demo = DEMO_ROOMS.find((r) => r.id === Number(id)) || DEMO_ROOMS[0];
        return {
          ...demo,
          id: res.room.id,
          name: res.room.name,
          capacity: res.room.capacity,
          location: res.room.location,
          description: res.room.description,
          status: res.room.status,
          type: res.room.type || demo.type,
        };
      }
    } catch {
      // Fallback
    }
    const found = DEMO_ROOMS.find((r) => r.id === Number(id) || r.name === String(id));
    return found || DEMO_ROOMS[0];
  },

  async createRoom(data: { name: string; capacity: number; location?: string; description?: string; status?: string }): Promise<any> {
    return api.post('/rooms', data);
  },

  async updateRoom(id: number | string, data: any): Promise<any> {
    return api.put(`/rooms/${id}`, data);
  },

  async deleteRoom(id: number | string): Promise<any> {
    return api.delete(`/rooms/${id}`);
  },
};
