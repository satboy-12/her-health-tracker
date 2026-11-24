import { ref, push, get, set, update } from 'firebase/database';
import { database } from '../firebase/firebase';
import type { WaterIntakeRecord, WaterTrackerResponse } from '../types/api';
import { ensureUserAccountAndProfile } from './authService';
import { requireAuthenticatedUser, wrapRtdbError } from './rtdbErrors';

const DEFAULT_WATER_GOAL_ML = 2500;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const waterService = {
  async getDaily(date?: string): Promise<WaterTrackerResponse> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · water', 'GET');
    const targetDate = date || todayIso();
    try {
      const [waterSnap, prefSnap] = await Promise.all([
        get(ref(database, `users/${user.uid}/water`)),
        get(ref(database, `users/${user.uid}/profile/preferences`)),
      ]);

      const raw = (waterSnap.exists() ? waterSnap.val() : {}) as Record<string, Record<string, unknown>>;

      let dailyTargetMl = DEFAULT_WATER_GOAL_ML;
      let remindersEnabled = true;

      if (prefSnap.exists()) {
        const p = prefSnap.val() as Record<string, unknown>;
        if (p.dailyWaterTargetMl !== undefined && Number(p.dailyWaterTargetMl) > 0) {
          dailyTargetMl = Number(p.dailyWaterTargetMl);
        }
        if (p.hydrationNudges !== undefined) {
          remindersEnabled = Boolean(p.hydrationNudges);
        }
      }

      let totalIntakeMl = 0;
      const entries: WaterIntakeRecord[] = [];

      Object.keys(raw).forEach((k) => {
        const item = raw[k];
        if (item && item.date === targetDate && Number(item.amountMl) > 0) {
          const amountMl = Number(item.amountMl);
          totalIntakeMl += amountMl;
          entries.push({
            id: k,
            date: String(item.date),
            amountMl,
            loggedAt: item.loggedAt
              ? String(item.loggedAt)
              : item.updatedAt
              ? new Date(String(item.updatedAt)).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '',
          });
        }
      });

      const weeklyHistory: Array<{ date: string; dayLabel: string; totalMl: number }> = [];
      const anchor = new Date(`${targetDate}T00:00:00Z`);
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(anchor);
        d.setUTCDate(anchor.getUTCDate() - i);
        const iso = d.toISOString().slice(0, 10);
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

        let dayTotal = 0;
        Object.keys(raw).forEach((k) => {
          const item = raw[k];
          if (item && item.date === iso && Number(item.amountMl) > 0) {
            dayTotal += Number(item.amountMl);
          }
        });
        weeklyHistory.push({ date: iso, dayLabel, totalMl: dayTotal });
      }

      return {
        date: targetDate,
        dailyTargetMl,
        totalIntakeMl,
        remindersEnabled,
        entries,
        weeklyHistory,
      };
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · water',
        'GET',
        'Failed to load water intake.',
        user.uid,
      );
    }
  },

  async getStatus(date?: string): Promise<WaterTrackerResponse> {
    return this.getDaily(date);
  },

  async logIntake(payload: { date: string; amountMl: number }): Promise<WaterTrackerResponse> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · water', 'POST');
    const targetDate = payload.date || todayIso();
    try {
      await ensureUserAccountAndProfile(user);
      const waterRef = ref(database, `users/${user.uid}/water`);
      const newRef = push(waterRef);
      const nowIso = new Date().toISOString();
      const amount = Math.max(1, Math.min(5000, Math.round(Number(payload.amountMl) || 0)));
      const loggedAt = new Date(nowIso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      await set(newRef, {
        date: targetDate,
        amountMl: amount,
        loggedAt,
        updatedAt: nowIso,
      });

      return this.getDaily(targetDate);
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · water',
        'POST',
        'Failed to log water intake.',
        user.uid,
      );
    }
  },

  async updatePreferences(prefs: {
    dailyTargetMl?: number;
    remindersEnabled?: boolean;
  }): Promise<WaterTrackerResponse> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · water', 'PATCH');
    try {
      await ensureUserAccountAndProfile(user);
      const updates: Record<string, unknown> = {};
      if (prefs.dailyTargetMl !== undefined) {
        updates.dailyWaterTargetMl = Math.max(
          500,
          Math.min(10000, Math.round(Number(prefs.dailyTargetMl))),
        );
      }
      if (prefs.remindersEnabled !== undefined) {
        updates.hydrationNudges = Boolean(prefs.remindersEnabled);
      }
      if (Object.keys(updates).length > 0) {
        await update(ref(database, `users/${user.uid}/profile/preferences`), updates);
      }
      return this.getStatus(todayIso());
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · water',
        'PATCH',
        'Failed to update hydration settings.',
        user.uid,
      );
    }
  },
};
