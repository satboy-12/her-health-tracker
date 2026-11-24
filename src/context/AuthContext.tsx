import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { authService, mapFirebaseUserToAuthUser } from '../services/authService';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/api';

export type AuthProviderKind = 'firebase' | null;

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  authProvider: AuthProviderKind;
  authReady: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Synchronize Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await authService.getUserProfile(fbUser.uid);
          setUser(mapFirebaseUserToAuthUser(fbUser, profile || undefined));
        } catch {
          setUser(mapFirebaseUserToAuthUser(fbUser));
        }
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    setUser(res.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await authService.register(payload);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setFirebaseUser(null);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await authService.sendPasswordReset(email);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      firebaseUser,
      authProvider: user ? 'firebase' : null,
      authReady,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      sendPasswordReset,
    }),
    [user, firebaseUser, authReady, login, register, logout, sendPasswordReset],
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
