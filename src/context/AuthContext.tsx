import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { registerUnauthorizedHandler, setAuthToken } from '../api/client';
import { authService } from '../api/services';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isPreviewMode: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  enterPreviewMode: () => void;
  exitPreviewMode: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearSession();
    });
  }, [clearSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    setAuthToken(response.token);
    setUser(response.user);
    setIsPreviewMode(false);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    setAuthToken(response.token);
    setUser(response.user);
    setIsPreviewMode(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (user) {
        await authService.logout();
      }
    } finally {
      clearSession();
      setIsPreviewMode(false);
    }
  }, [clearSession, user]);

  const enterPreviewMode = useCallback(() => {
    clearSession();
    setIsPreviewMode(true);
  }, [clearSession]);

  const exitPreviewMode = useCallback(() => {
    setIsPreviewMode(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isPreviewMode,
      login,
      register,
      logout,
      enterPreviewMode,
      exitPreviewMode,
    }),
    [user, isPreviewMode, login, register, logout, enterPreviewMode, exitPreviewMode],
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
