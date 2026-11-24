import { ref, get, update, remove, child } from 'firebase/database';
import { deleteUser, updateProfile } from 'firebase/auth';
import { auth, database } from '../firebase/firebase';
import type { UserProfile } from '../types/api';
import { ensureUserAccountAndProfile, mapRtdbProfileToUserProfile } from './authService';
import { requireAuthenticatedUser, wrapRtdbError } from './rtdbErrors';

export const profileService = {
  async get(): Promise<UserProfile> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · profile', 'GET');
    try {
      await ensureUserAccountAndProfile(user);
      const snap = await get(child(ref(database), `users/${user.uid}/profile`));
      const data = (snap.exists() ? snap.val() : {}) as Record<string, unknown>;
      return mapRtdbProfileToUserProfile(user.uid, data, user);
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · profile',
        'GET',
        'Failed to load your profile.',
        user.uid,
      );
    }
  },

  async update(payload: Partial<UserProfile>): Promise<UserProfile> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · profile', 'PATCH');
    try {
      const existing = await ensureUserAccountAndProfile(user);
      const userRef = ref(database, `users/${user.uid}/profile`);
      const nowIso = new Date().toISOString();

      const updates: Record<string, unknown> = {
        updatedAt: nowIso,
      };

      if (payload.fullName !== undefined && payload.fullName.trim()) {
        const cleanName = payload.fullName.trim().slice(0, 150);
        updates.fullName = cleanName;
        await updateProfile(user, { displayName: cleanName }).catch(() => {});
      }
      if (payload.email !== undefined && payload.email.trim()) {
        updates.email = payload.email.trim().slice(0, 254);
      }
      if (payload.phoneNumber !== undefined) {
        updates.phoneNumber = payload.phoneNumber.trim().slice(0, 30);
      }
      if (payload.dateOfBirth !== undefined) {
        updates.dateOfBirth = payload.dateOfBirth.trim().slice(0, 10);
      }
      if (payload.preferences) {
        const currentPrefs = existing.preferences || {
          cycleReminders: true,
          medicationAlerts: true,
          hydrationNudges: true,
          dailyCalorieTarget: 2000,
          dailyWaterTargetMl: 2500,
        };
        updates.preferences = {
          cycleReminders:
            payload.preferences.cycleReminders !== undefined
              ? Boolean(payload.preferences.cycleReminders)
              : Boolean(currentPrefs.cycleReminders),
          medicationAlerts:
            payload.preferences.medicationAlerts !== undefined
              ? Boolean(payload.preferences.medicationAlerts)
              : Boolean(currentPrefs.medicationAlerts),
          hydrationNudges:
            payload.preferences.hydrationNudges !== undefined
              ? Boolean(payload.preferences.hydrationNudges)
              : Boolean(currentPrefs.hydrationNudges),
          dailyCalorieTarget:
            payload.preferences.dailyCalorieTarget !== undefined
              ? Math.max(500, Math.min(10000, Math.round(Number(payload.preferences.dailyCalorieTarget))))
              : Number(currentPrefs.dailyCalorieTarget ?? 2000),
          dailyWaterTargetMl:
            payload.preferences.dailyWaterTargetMl !== undefined
              ? Math.max(500, Math.min(10000, Math.round(Number(payload.preferences.dailyWaterTargetMl))))
              : Number(currentPrefs.dailyWaterTargetMl ?? 2500),
        };
      }

      await update(userRef, updates);
      return this.get();
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · profile',
        'PATCH',
        'Failed to save profile changes.',
        user.uid,
      );
    }
  },

  async deleteAccount(): Promise<void> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · profile', 'DELETE');
    try {
      const userRootRef = ref(database, `users/${user.uid}`);
      await remove(userRootRef);
      await deleteUser(user);
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · profile',
        'DELETE',
        'Failed to delete account.',
        user.uid,
      );
    }
  },
};
