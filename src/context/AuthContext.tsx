import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { registerUnauthorizedHandler, setAuthToken } from '../api/client';
import { authService } from '../api/services';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/api';

export type AuthProviderKind = 'spring' | null;

const SESSION_STORAGE_KEY = 'hhj_auth_session';

interface StoredSession {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  authProvider: AuthProviderKind;
  authReady: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authProvider, setAuthProvider] = useState<AuthProviderKind>(null);
  const [authReady, setAuthReady] = useState(false);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage access errors in restricted frames
    }
    setAuthToken(null);
    setUser(null);
    setAuthProvider(null);
  }, []);

  // Handle 401 unauthorized responses globally
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearSession();
    });
  }, [clearSession]);

  // Restore persistent active session on fresh page loads / browser refresh
  useEffect(() => {
    try {
      const raw =
        (typeof localStorage !== 'undefined' && localStorage.getItem(SESSION_STORAGE_KEY)) ||
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_STORAGE_KEY));

      if (raw) {
        const session: StoredSession = JSON.parse(raw);
        if (session?.token && session?.user) {
          setAuthToken(session.token);
          setUser(session.user);
          setAuthProvider('spring');
        }
      }
    } catch (err) {
      console.warn('Could not restore previous auth session:', err);
    } finally {
      setAuthReady(true);
    }
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await authService.login(payload);
      setAuthToken(response.token);
      setUser(response.user);
      setAuthProvider('spring');

      const sessionData: StoredSession = {
        token: response.token,
        user: response.user,
      };

      try {
        if (payload.rememberMe) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        } else {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch {
        // Ignore quota/private-browsing exceptions
      }
    },
    [],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await authService.register(payload);
      setAuthToken(response.token);
      setUser(response.user);
      setAuthProvider('spring');

      const sessionData: StoredSession = {
        token: response.token,
        user: response.user,
      };

      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      } catch {
        // Ignore quota exceptions
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      if (user) {
        await authService.logout().catch(() => {});
      }
    } finally {
      clearSession();
    }
  }, [clearSession, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authProvider,
      authReady,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, authProvider, authReady, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
