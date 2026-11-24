import { ref, push, get, set, remove } from 'firebase/database';
import { database } from '../firebase/firebase';
import type { WellnessEntry } from '../types/api';
import { ensureUserAccountAndProfile } from './authService';
import { requireAuthenticatedUser, wrapRtdbError } from './rtdbErrors';

export const wellnessService = {
  async list(): Promise<WellnessEntry[]> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · wellness', 'GET');
    try {
      const wellnessRef = ref(database, `users/${user.uid}/wellness`);
      const snap = await get(wellnessRef);
      if (!snap.exists()) return [];

      const raw = snap.val() as Record<string, Record<string, unknown>>;
      const records: WellnessEntry[] = Object.keys(raw).map((key) => {
        const item = raw[key] || {};
        return {
          id: key,
          date: String(item.date || ''),
          mood: (item.mood as WellnessEntry['mood']) || 'Calm',
          sleepHours: item.sleepHours !== undefined ? Number(item.sleepHours) : 0,
          sleepQuality: (item.sleepQuality as WellnessEntry['sleepQuality']) || 'Good/Restful',
          stressLevel: item.stressLevel !== undefined ? Number(item.stressLevel) : 3,
          notes: String(item.notes || ''),
          createdAt: item.createdAt ? String(item.createdAt) : '',
        };
      });

      return records.sort((a, b) => b.date.localeCompare(a.date));
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · wellness',
        'GET',
        'Failed to load wellness logs.',
        user.uid,
      );
    }
  },

  async create(payload: Omit<WellnessEntry, 'id'>): Promise<WellnessEntry> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · wellness', 'POST');
    try {
      await ensureUserAccountAndProfile(user);
      const wellnessRef = ref(database, `users/${user.uid}/wellness`);
      const newRef = push(wellnessRef);
      const id = newRef.key!;
      const nowIso = new Date().toISOString();
      const sleepHours = Math.max(0, Math.min(24, Number(payload.sleepHours) || 0));
      const stressLevel = Math.max(1, Math.min(10, Math.round(Number(payload.stressLevel) || 1)));

      const recordData = {
        date: payload.date,
        mood: payload.mood,
        sleepHours,
        sleepQuality: payload.sleepQuality || 'Good/Restful',
        stressLevel,
        notes: (payload.notes || '').slice(0, 2000),
        createdAt: nowIso,
      };

      await set(newRef, recordData);
      return { id, ...payload, sleepHours, stressLevel, createdAt: nowIso };
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · wellness',
        'POST',
        'Failed to save wellness log.',
        user.uid,
      );
    }
  },

  async remove(id: string): Promise<void> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · wellness', 'DELETE');
    try {
      const itemRef = ref(database, `users/${user.uid}/wellness/${id}`);
      await remove(itemRef);
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · wellness',
        'DELETE',
        'Failed to delete wellness log.',
        user.uid,
      );
    }
  },
};
