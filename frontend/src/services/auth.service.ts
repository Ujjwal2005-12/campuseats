import { api, setToken, removeToken } from './api';
import { User } from '../types';
import { DEMO_USERS } from './demoData';

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: User; isDemo?: boolean }> {
    try {
      const res = await api.post<{ message: string; token: string; user: User }>('/auth/login', {
        email,
        password,
      });
      setToken(res.token);
      localStorage.setItem('smartly_user', JSON.stringify(res.user));
      return { token: res.token, user: res.user, isDemo: false };
    } catch (err: any) {
      // If server is unreachable or offline, allow demo access with standard credentials
      const normalizedEmail = email.toLowerCase().trim();
      let demoUser: User | null = null;

      if (normalizedEmail.includes('admin') || normalizedEmail === 'admin@smartly.local') {
        demoUser = DEMO_USERS.ADMIN;
      } else if (normalizedEmail.includes('faculty') || normalizedEmail === 'faculty@smartly.local') {
        demoUser = DEMO_USERS.FACULTY;
      } else if (normalizedEmail.includes('student') || normalizedEmail === 'student@smartly.local' || normalizedEmail === 'your@college.edu') {
        demoUser = DEMO_USERS.STUDENT;
      }

      if (demoUser && (err.status === 0 || err.message?.includes('Network') || err.message?.includes('Failed to fetch'))) {
        const dummyToken = `demo_jwt_token_${demoUser.role.toLowerCase()}`;
        setToken(dummyToken);
        localStorage.setItem('smartly_user', JSON.stringify(demoUser));
        return { token: dummyToken, user: demoUser, isDemo: true };
      }

      throw err;
    }
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      localStorage.setItem('smartly_user', JSON.stringify(res.user));
      return res.user;
    } catch {
      const cached = localStorage.getItem('smartly_user');
      return cached ? JSON.parse(cached) : null;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return api.put<{ message: string }>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  logout(): void {
    removeToken();
    localStorage.removeItem('smartly_user');
  },
};
