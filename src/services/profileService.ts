import { ref, get, update, remove, child } from 'firebase/database';
import { deleteUser } from 'firebase/auth';
import { auth, database } from '../firebase/firebase';
import type { UserProfile } from '../types/api';

function requireUid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required for Profile.');
  return user.uid;
}

export const profileService = {
  async get(): Promise<UserProfile> {
    const uid = requireUid();
    const snap = await get(child(ref(database), `users/${uid}/profile`));
    const data = snap.exists() ? snap.val() : {};

    return {
      id: uid,
      fullName: data.fullName || auth.currentUser?.displayName || 'Member',
      email: data.email || auth.currentUser?.email || '',
      dateOfBirth: data.dateOfBirth || '',
      phoneNumber: data.phoneNumber || '',
      memberSince: data.memberSince || new Date().toISOString().slice(0, 10),
      accountTier: data.accountTier || 'Firebase Cloud',
      twoFactorEnabled: data.twoFactorEnabled || false,
      passwordLastChanged: data.passwordLastChanged || undefined,
      preferences: data.preferences || {
        cycleReminders: true,
        medicationAlerts: true,
        hydrationNudges: true,
        dailyCalorieTarget: 2000,
        dailyWaterTargetMl: 2500,
      },
    };
  },

  async update(payload: Partial<UserProfile>): Promise<UserProfile> {
    const uid = requireUid();
    const userRef = ref(database, `users/${uid}/profile`);
    const nowIso = new Date().toISOString();

    const updates: Record<string, any> = {
      updatedAt: nowIso,
    };
    if (payload.fullName) updates.fullName = payload.fullName;
    if (payload.phoneNumber) updates.phoneNumber = payload.phoneNumber;
    if (payload.dateOfBirth) updates.dateOfBirth = payload.dateOfBirth;
    if (payload.preferences) updates.preferences = payload.preferences;

    await update(userRef, updates);
    return this.get();
  },

  async deleteAccount(): Promise<void> {
    const uid = requireUid();
    const user = auth.currentUser;
    // Wipe all user records in Realtime Database under users/{uid}
    const userRootRef = ref(database, `users/${uid}`);
    await remove(userRootRef);

    // Delete user from Firebase Auth
    if (user) {
      await deleteUser(user);
    }
  },
};
