import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/auth.service';
import { api } from '../services/api';
import { DEMO_USERS } from '../services/demoData';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  isBackendConnected: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  refreshUser: () => Promise<void>;
  checkConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smartly_user');
    return saved ? JSON.parse(saved) : DEMO_USERS.STUDENT;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('smartly_token'));
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkConnection = async () => {
    const alive = await api.checkHealth();
    setIsBackendConnected(alive);
  };

  useEffect(() => {
    const init = async () => {
      await checkConnection();
      const savedToken = localStorage.getItem('smartly_token');
      if (savedToken) {
        try {
          const profile = await authService.getMe();
          if (profile) {
            setUser(profile);
          }
        } catch {
          // Keep current fallback
        }
      }
      setIsLoading(false);
    };
    init();

    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setUser(res.user);
    setToken(res.token);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const switchRole = (newRole: UserRole) => {
    const demoUser = DEMO_USERS[newRole];
    setUser(demoUser);
    localStorage.setItem('smartly_user', JSON.stringify(demoUser));
  };

  const refreshUser = async () => {
    try {
      const u = await authService.getMe();
      if (u) setUser(u);
    } catch {
      // keep
    }
  };

  const currentRole: UserRole = user?.role || 'STUDENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        token,
        isAuthenticated: !!user,
        isBackendConnected,
        isLoading,
        login,
        logout,
        switchRole,
        refreshUser,
        checkConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
