import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { ref, get, set, update, child } from 'firebase/database';
import { auth, database } from '../firebase/firebase';
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload, UserProfile } from '../types/api';
import {
  buildInitialProfileRecord,
  DEFAULT_CALORIE_TARGET,
  DEFAULT_WATER_TARGET_ML,
  mapRtdbProfileToUserProfile,
} from './profileBuilder';
import { wrapRtdbError } from './rtdbErrors';

export { buildInitialProfileRecord, mapRtdbProfileToUserProfile };

export function getFirebaseErrorMessage(codeOrMessage: string): string {
  if (codeOrMessage.includes('auth/email-already-in-use')) {
    return 'This email address is already registered. Please sign in instead.';
  }
  if (codeOrMessage.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (codeOrMessage.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 8 characters with letters and numbers.';
  }
  if (codeOrMessage.includes('auth/wrong-password') || codeOrMessage.includes('auth/invalid-credential')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (codeOrMessage.includes('auth/user-not-found')) {
    return 'No account exists with this email address. Please register first.';
  }
  if (codeOrMessage.includes('auth/too-many-requests')) {
    return 'Too many unsuccessful attempts. Access temporarily blocked for security. Please try again later or reset password.';
  }
  if (codeOrMessage.includes('auth/operation-not-allowed')) {
    return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password).';
  }
  if (codeOrMessage.includes('auth/network-request-failed')) {
    return 'Network connection error. Please verify your internet connection.';
  }
  return codeOrMessage;
}

/**
 * Ensures `users/{uid}/profile` exists in Firebase Realtime Database for the authenticated user.
 * Never overwrites existing profile data or touches any other UID.
 */
export async function ensureUserAccountAndProfile(
  fbUser: FirebaseUser,
  preferredFullName?: string,
): Promise<UserProfile> {
  const uid = fbUser.uid;
  const profileRef = ref(database, `users/${uid}/profile`);
  try {
    const snap = await get(profileRef);
    const nowIso = new Date().toISOString();

    if (!snap.exists()) {
      const initialRecord = buildInitialProfileRecord(fbUser, preferredFullName, nowIso);
      await set(profileRef, initialRecord);
      return mapRtdbProfileToUserProfile(uid, initialRecord, fbUser);
    }

    const existing = snap.val() as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (!existing.fullName || typeof existing.fullName !== 'string' || !existing.fullName.trim()) {
      patch.fullName =
        preferredFullName?.trim() ||
        fbUser.displayName?.trim() ||
        fbUser.email?.split('@')[0] ||
        'Member';
    }
    if (!existing.email && fbUser.email) {
      patch.email = fbUser.email.slice(0, 254);
    }
    if (!existing.preferences || typeof existing.preferences !== 'object') {
      patch.preferences = {
        cycleReminders: true,
        medicationAlerts: true,
        hydrationNudges: true,
        dailyCalorieTarget: DEFAULT_CALORIE_TARGET,
        dailyWaterTargetMl: DEFAULT_WATER_TARGET_ML,
      };
    }

    if (Object.keys(patch).length > 0) {
      patch.updatedAt = nowIso;
      await update(profileRef, patch);
      return mapRtdbProfileToUserProfile(uid, { ...existing, ...patch }, fbUser);
    }

    return mapRtdbProfileToUserProfile(uid, existing, fbUser);
  } catch (err) {
    throw wrapRtdbError(
      err,
      'Firebase Realtime Database · profile',
      'POST',
      'Failed to load or initialize your user profile.',
      uid,
    );
  }
}

export function mapFirebaseUserToAuthUser(fbUser: FirebaseUser, profileData?: Partial<UserProfile>): AuthUser {
  return {
    id: fbUser.uid,
    fullName: profileData?.fullName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Member',
    email: fbUser.email || '',
    memberSince: profileData?.memberSince || new Date().toISOString().slice(0, 10),
    accountTier: profileData?.accountTier || 'Firebase Cloud',
  };
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { fullName, email, password } = payload;
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = cred.user;

    await updateProfile(user, { displayName: fullName.trim() });
    const profile = await ensureUserAccountAndProfile(user, fullName.trim());

    const token = await user.getIdToken();
    const authUser = mapFirebaseUserToAuthUser(user, profile);
    return { token, tokenType: 'Bearer', user: authUser };
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { email, password } = payload;
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = cred.user;

    const profile = await ensureUserAccountAndProfile(user);
    const token = await user.getIdToken();
    const authUser = mapFirebaseUserToAuthUser(user, profile);

    return { token, tokenType: 'Bearer', user: authUser };
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  },

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  onAuthChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await get(child(ref(database), `users/${uid}/profile`));
      if (snap.exists()) {
        return mapRtdbProfileToUserProfile(uid, snap.val() as Record<string, unknown>);
      }
      return null;
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · profile',
        'GET',
        'Failed to read user profile.',
        uid,
      );
    }
  },
};
