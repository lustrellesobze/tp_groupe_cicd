import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth } from '../api/taskflow';
import { getStoredToken, setStoredToken } from '../api/client';
import type { User } from '../types/api';

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (n: { name: string; email: string; password: string; password_confirmation: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    if (!getStoredToken()) {
      setUser(null);
      return;
    }
    const u = await auth.me();
    setUser(u);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (getStoredToken()) {
          await refreshUser();
        }
      } catch {
        setStoredToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const res = await auth.login({ email, password });
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (b: { name: string; email: string; password: string; password_confirmation: string }) => {
      setError(null);
      const res = await auth.register(b);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    setError(null);
    try {
      await auth.logoutRemote();
    } catch {
      auth.logout();
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, error, login, register, logout, refreshUser],
  );

  return <Ctx.Provider value={value as AuthState}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return c;
}
