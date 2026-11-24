import { ref, push, get, set, remove } from 'firebase/database';
import { auth, database } from '../firebase/firebase';
import type { WellnessEntry } from '../types/api';

function requireUid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required for Mood & Wellness tracker.');
  return user.uid;
}

export const wellnessService = {
  async list(): Promise<WellnessEntry[]> {
    const uid = requireUid();
    const wellnessRef = ref(database, `users/${uid}/wellness`);
    const snap = await get(wellnessRef);
    if (!snap.exists()) return [];

    const raw = snap.val();
    const records: WellnessEntry[] = Object.keys(raw).map((key) => {
      const item = raw[key];
      return {
        id: key,
        date: item.date || '',
        mood: item.mood || 'Calm',
        sleepHours: Number(item.sleepHours) || 7,
        sleepQuality: item.sleepQuality || 'Good/Restful',
        stressLevel: Number(item.stressLevel) || 3,
        notes: item.notes || '',
        createdAt: item.createdAt || '',
      };
    });

    return records.sort((a, b) => (b.date > a.date ? 1 : -1));
  },

  async create(payload: Omit<WellnessEntry, 'id'>): Promise<WellnessEntry> {
    const uid = requireUid();
    const wellnessRef = ref(database, `users/${uid}/wellness`);
    const newRef = push(wellnessRef);
    const id = newRef.key!;
    const nowIso = new Date().toISOString();

    const recordData = {
      date: payload.date,
      mood: payload.mood,
      sleepHours: Number(payload.sleepHours) || 7,
      sleepQuality: payload.sleepQuality || 'Good/Restful',
      stressLevel: Number(payload.stressLevel) || 3,
      energyLevel: Number(payload.stressLevel) ? 10 - Number(payload.stressLevel) : 3,
      notes: payload.notes || '',
      createdAt: nowIso,
    };

    await set(newRef, recordData);
    return { id, ...payload, createdAt: nowIso };
  },

  async remove(id: string): Promise<void> {
    const uid = requireUid();
    const itemRef = ref(database, `users/${uid}/wellness/${id}`);
    await remove(itemRef);
  },
};
