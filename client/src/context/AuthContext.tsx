import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, type LoginPayload } from '../api/auth';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = useCallback((next: User | null) => {
    setUserState(next);
    if (next) {
      localStorage.setItem('ssm_user', JSON.stringify(next));
    } else {
      localStorage.removeItem('ssm_user');
    }
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.data);
    } catch {
      setUser(null);
      localStorage.removeItem('ssm_token');
    }
  }, [setUser]);

  useEffect(() => {
    const token = localStorage.getItem('ssm_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    refreshMe().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const { data } = await authApi.login(payload);
      localStorage.setItem('ssm_token', data.data.token);
      setUser(data.data.user);
      return data.data.user;
    },
    [setUser]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout - we clear local state regardless
    }
    localStorage.removeItem('ssm_token');
    setUser(null);
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshMe, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
