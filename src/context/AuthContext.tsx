import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { registerUnauthorizedHandler, setAuthToken } from '../api/client';
import { ensureUserAccountAndProfile } from '../api/firebaseData';
import { authService } from '../api/services';
import { auth, googleProvider } from '../firebase';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/api';

export type AuthProviderKind = 'firebase' | 'spring' | null;

// Strictly in-memory OAuth access token cache (never stored in localStorage or sessionStorage)
let cachedWorkspaceToken: string | null = null;
let isSigningInWithGoogle = false;

interface AuthContextValue {
  user: AuthUser | null;
  authProvider: AuthProviderKind;
  authReady: boolean;
  isAuthenticated: boolean;
  isPreviewMode: boolean;
  workspaceToken: string | null;
  hasWorkspaceAccess: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  authorizeGoogleWorkspace: () => Promise<string>;
  clearWorkspaceToken: () => void;
  logout: () => Promise<void>;
  enterPreviewMode: () => void;
  exitPreviewMode: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authProvider, setAuthProvider] = useState<AuthProviderKind>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [workspaceToken, setWorkspaceToken] = useState<string | null>(cachedWorkspaceToken);

  const clearWorkspaceToken = useCallback(() => {
    cachedWorkspaceToken = null;
    setWorkspaceToken(null);
  }, []);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setAuthProvider(null);
    cachedWorkspaceToken = null;
    setWorkspaceToken(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearSession();
    });
  }, [clearSession]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setAuthToken(null);
        setUser({
          id: fbUser.uid,
          fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Member',
          email: fbUser.email || '',
          accountTier: 'Firebase Cloud',
        });
        setAuthProvider('firebase');
        setIsPreviewMode(false);
        if (cachedWorkspaceToken) {
          setWorkspaceToken(cachedWorkspaceToken);
        } else if (!isSigningInWithGoogle) {
          cachedWorkspaceToken = null;
          setWorkspaceToken(null);
        }
        try {
          await ensureUserAccountAndProfile(fbUser);
        } catch (err) {
          console.error('Failed to ensure Firebase user profile:', err);
        }
      } else {
        cachedWorkspaceToken = null;
        setWorkspaceToken(null);
        setAuthProvider((prev) => {
          if (prev === 'firebase') {
            setUser(null);
            return null;
          }
          return prev;
        });
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      if (auth.currentUser) {
        await signOut(auth);
      }
      clearWorkspaceToken();
      const response = await authService.login(payload);
      setAuthToken(response.token);
      setUser(response.user);
      setAuthProvider('spring');
      setIsPreviewMode(false);
    },
    [clearWorkspaceToken],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      if (auth.currentUser) {
        await signOut(auth);
      }
      clearWorkspaceToken();
      const response = await authService.register(payload);
      setAuthToken(response.token);
      setUser(response.user);
      setAuthProvider('spring');
      setIsPreviewMode(false);
    },
    [clearWorkspaceToken],
  );

  const performGooglePopupAuth = useCallback(async (): Promise<{
    accessToken: string | null;
  }> => {
    isSigningInWithGoogle = true;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken ?? null;
      cachedWorkspaceToken = token;
      setWorkspaceToken(token);
      setAuthToken(null);
      await ensureUserAccountAndProfile(result.user);
      setUser({
        id: result.user.uid,
        fullName: result.user.displayName || result.user.email?.split('@')[0] || 'Member',
        email: result.user.email || '',
        accountTier: 'Firebase Cloud',
      });
      setAuthProvider('firebase');
      setIsPreviewMode(false);
      return { accessToken: token };
    } finally {
      isSigningInWithGoogle = false;
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await performGooglePopupAuth();
  }, [performGooglePopupAuth]);

  const authorizeGoogleWorkspace = useCallback(async (): Promise<string> => {
    const { accessToken } = await performGooglePopupAuth();
    if (!accessToken) {
      throw new Error(
        'Google sign-in completed, but no Google Sheets/Drive access token was returned. Please grant spreadsheet access when prompted.',
      );
    }
    return accessToken;
  }, [performGooglePopupAuth]);

  const logout = useCallback(async () => {
    try {
      if (authProvider === 'firebase' || auth.currentUser) {
        await signOut(auth);
      } else if (user) {
        await authService.logout();
      }
    } finally {
      clearSession();
      setIsPreviewMode(false);
    }
  }, [authProvider, clearSession, user]);

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
      authProvider,
      authReady,
      isAuthenticated: Boolean(user),
      isPreviewMode,
      workspaceToken,
      hasWorkspaceAccess: Boolean(workspaceToken),
      login,
      register,
      loginWithGoogle,
      authorizeGoogleWorkspace,
      clearWorkspaceToken,
      logout,
      enterPreviewMode,
      exitPreviewMode,
    }),
    [
      user,
      authProvider,
      authReady,
      isPreviewMode,
      workspaceToken,
      login,
      register,
      loginWithGoogle,
      authorizeGoogleWorkspace,
      clearWorkspaceToken,
      logout,
      enterPreviewMode,
      exitPreviewMode,
    ],
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
