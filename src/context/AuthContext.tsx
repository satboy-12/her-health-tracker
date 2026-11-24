import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { ensureUserAccountAndProfile } from '../api/firebaseData';
import { auth } from '../firebase';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/api';

interface AuthContextValue {
  user: AuthUser | null;
  authReady: boolean;
  isAuthenticated: boolean;
  emailVerified: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshAuthUser: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(fbUser: FirebaseUser): AuthUser {
  return {
    id: fbUser.uid,
    fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Member',
    email: fbUser.email || '',
    accountTier: 'Firebase Cloud',
  };
}

export function mapFirebaseAuthError(err: unknown, fallback: string): string {
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email address or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 8 characters with letters, numbers, and symbols.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password).';
    case 'auth/network-request-failed':
      return 'Network error while reaching Firebase Authentication. Check your connection and retry.';
    default:
      return err instanceof Error && err.message ? err.message : fallback;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(toAuthUser(fbUser));
        setEmailVerified(fbUser.emailVerified);
        if (fbUser.emailVerified) {
          try {
            await ensureUserAccountAndProfile(fbUser);
          } catch (err) {
            console.error('Failed to ensure Firebase user profile:', err);
          }
        }
      } else {
        setUser(null);
        setEmailVerified(false);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      await setPersistence(
        auth,
        payload.rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );
      const cred = await signInWithEmailAndPassword(auth, payload.email, payload.password);
      setUser(toAuthUser(cred.user));
      setEmailVerified(cred.user.emailVerified);
      if (cred.user.emailVerified) {
        await ensureUserAccountAndProfile(cred.user);
      }
    } catch (err) {
      throw new Error(mapFirebaseAuthError(err, 'Unable to complete sign in.'));
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
      await updateProfile(cred.user, { displayName: payload.fullName });
      await cred.user.reload();
      if (!cred.user.emailVerified) {
        try {
          await sendEmailVerification(cred.user);
        } catch (verifyErr) {
          console.error('Verification email dispatch failed:', verifyErr);
        }
      } else {
        await ensureUserAccountAndProfile(cred.user);
      }
      setUser({
        id: cred.user.uid,
        fullName: payload.fullName,
        email: cred.user.email || payload.email,
        accountTier: 'Firebase Cloud',
      });
      setEmailVerified(cred.user.emailVerified);
    } catch (err) {
      throw new Error(mapFirebaseAuthError(err, 'Unable to create account.'));
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) {
      throw new Error('No active signed-in user.');
    }
    try {
      await sendEmailVerification(current);
    } catch (err) {
      throw new Error(mapFirebaseAuthError(err, 'Unable to send verification email right now.'));
    }
  }, []);

  const refreshAuthUser = useCallback(async (): Promise<boolean> => {
    const current = auth.currentUser;
    if (!current) return false;
    await current.reload();
    // Force token refresh so Firestore rules receive updated email_verified claim
    await current.getIdToken(true);
    const verified = current.emailVerified;
    setEmailVerified(verified);
    setUser(toAuthUser(current));
    if (verified) {
      await ensureUserAccountAndProfile(current);
    }
    return verified;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setEmailVerified(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authReady,
      isAuthenticated: Boolean(user),
      emailVerified,
      login,
      register,
      resendVerificationEmail,
      refreshAuthUser,
      logout,
    }),
    [user, authReady, emailVerified, login, register, resendVerificationEmail, refreshAuthUser, logout],
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
