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
  if (codeOrMessage.includes('auth/network-request-failed')) {
    return 'Network connection error. Please verify your internet connection.';
  }
  return codeOrMessage;
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

    // Update Firebase Auth display name
    await updateProfile(user, { displayName: fullName.trim() });

    // Store user profile in Realtime Database under users/{uid}/profile
    const nowIso = new Date().toISOString();
    const userProfileRef = ref(database, `users/${user.uid}/profile`);
    await set(userProfileRef, {
      fullName: fullName.trim(),
      email: email.trim(),
      createdAt: nowIso,
      updatedAt: nowIso,
      profileImage: null,
      accountTier: 'Firebase Cloud',
      memberSince: nowIso.slice(0, 10),
    });

    const token = await user.getIdToken();
    const authUser: AuthUser = {
      id: user.uid,
      fullName: fullName.trim(),
      email: email.trim(),
      memberSince: nowIso.slice(0, 10),
      accountTier: 'Firebase Cloud',
    };

    return { token, tokenType: 'Bearer', user: authUser };
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { email, password } = payload;
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = cred.user;

    // Fetch profile data from Realtime Database
    let profileData: Partial<UserProfile> | undefined;
    try {
      const snap = await get(child(ref(database), `users/${user.uid}/profile`));
      if (snap.exists()) {
        profileData = snap.val();
      }
    } catch (e) {
      console.warn('Could not read user profile from Realtime Database:', e);
    }

    const token = await user.getIdToken();
    const authUser = mapFirebaseUserToAuthUser(user, profileData);

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
    const snap = await get(child(ref(database), `users/${uid}/profile`));
    if (snap.exists()) {
      const data = snap.val();
      return {
        id: uid,
        fullName: data.fullName || '',
        email: data.email || '',
        dateOfBirth: data.dateOfBirth || '',
        phoneNumber: data.phoneNumber || '',
        memberSince: data.memberSince || '',
        accountTier: data.accountTier || 'Firebase Cloud',
        preferences: data.preferences || {
          cycleReminders: true,
          medicationAlerts: true,
          hydrationNudges: true,
        },
      };
    }
    return null;
  },
};
