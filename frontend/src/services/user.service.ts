import { api } from './api';
import { User } from '../types';

export const userService = {
  async getAllUsers(params?: { search?: string; role?: string; isActive?: boolean }): Promise<User[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.role) query.append('role', params.role);
      if (params?.isActive !== undefined) query.append('isActive', params.isActive.toString());

      const res = await api.get<{ users: User[] }>(`/users?${query.toString()}`);
      return res.users || [];
    } catch {
      return [];
    }
  },

  async updateUser(id: number | string, data: { name?: string; role?: string; is_active?: number | boolean }): Promise<any> {
    return api.put(`/users/${id}`, data);
  },

  async deleteUser(id: number | string): Promise<any> {
    return api.delete(`/users/${id}`);
  },
};
