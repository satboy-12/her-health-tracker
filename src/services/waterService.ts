import { ref, push, get, set, update } from 'firebase/database';
import { auth, database } from '../firebase/firebase';
import type { WaterIntakeRecord, WaterTrackerResponse } from '../types/api';

function requireUid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required for Water Tracker.');
  return user.uid;
}

const DEFAULT_WATER_GOAL_ML = 2500;

export const waterService = {
  async getDaily(date?: string): Promise<WaterTrackerResponse> {
    const uid = requireUid();
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const waterRef = ref(database, `users/${uid}/water`);
    const snap = await get(waterRef);
    const raw = snap.exists() ? snap.val() : {};

    let dailyTargetMl = DEFAULT_WATER_GOAL_ML;
    let remindersEnabled = true;

    // Check user preferences if saved
    try {
      const prefSnap = await get(ref(database, `users/${uid}/profile/preferences`));
      if (prefSnap.exists()) {
        const p = prefSnap.val();
        if (p.dailyWaterTargetMl) dailyTargetMl = Number(p.dailyWaterTargetMl);
        if (p.hydrationNudges !== undefined) remindersEnabled = Boolean(p.hydrationNudges);
      }
    } catch {
      // Use defaults
    }

    let totalIntakeMl = 0;
    const entries: WaterIntakeRecord[] = [];

    Object.keys(raw).forEach((k) => {
      const item = raw[k];
      if (item && item.date === targetDate) {
        if (item.goalMl) dailyTargetMl = item.goalMl;
        if (item.amountMl) {
          totalIntakeMl += Number(item.amountMl) || 0;
          entries.push({
            id: k,
            date: item.date,
            amountMl: Number(item.amountMl),
            loggedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
          });
        }
      }
    });

    const weeklyHistory: Array<{ date: string; dayLabel: string; totalMl: number }> = [];
    const anchor = new Date(`${targetDate}T00:00:00Z`);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchor);
      d.setUTCDate(anchor.getUTCDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

      let dayTotal = 0;
      Object.keys(raw).forEach((k) => {
        const item = raw[k];
        if (item && item.date === iso && item.amountMl) {
          dayTotal += Number(item.amountMl) || 0;
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
  },

  async getStatus(date?: string): Promise<WaterTrackerResponse> {
    return this.getDaily(date);
  },

  async logIntake(payload: { date: string; amountMl: number }): Promise<WaterTrackerResponse> {
    const uid = requireUid();
    const waterRef = ref(database, `users/${uid}/water`);
    const newRef = push(waterRef);
    const nowIso = new Date().toISOString();

    await set(newRef, {
      date: payload.date,
      amountMl: payload.amountMl,
      goalMl: DEFAULT_WATER_GOAL_ML,
      updatedAt: nowIso,
    });

    return this.getDaily(payload.date);
  },

  async updateGoal(goalMl: number): Promise<void> {
    const uid = requireUid();
    const profileRef = ref(database, `users/${uid}/profile/preferences/dailyWaterTargetMl`);
    await set(profileRef, goalMl);
  },

  async updateReminders(enabled: boolean): Promise<void> {
    const uid = requireUid();
    const prefRef = ref(database, `users/${uid}/profile/preferences/hydrationNudges`);
    await set(prefRef, enabled);
  },

  async updatePreferences(prefs: { dailyTargetMl?: number; remindersEnabled?: boolean }): Promise<void> {
    const uid = requireUid();
    const updates: Record<string, any> = {};
    if (prefs.dailyTargetMl !== undefined) {
      updates['dailyWaterTargetMl'] = prefs.dailyTargetMl;
    }
    if (prefs.remindersEnabled !== undefined) {
      updates['hydrationNudges'] = prefs.remindersEnabled;
    }
    await update(ref(database, `users/${uid}/profile/preferences`), updates);
  },
};
