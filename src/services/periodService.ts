import { ref, push, get, set, update, remove, child } from 'firebase/database';
import { auth, database } from '../firebase/firebase';
import type { PeriodRecord } from '../types/api';

function requireUid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required for period tracker.');
  return user.uid;
}

export const periodsService = {
  async list(): Promise<PeriodRecord[]> {
    const uid = requireUid();
    const periodRef = ref(database, `users/${uid}/periods`);
    const snap = await get(periodRef);
    if (!snap.exists()) return [];

    const raw = snap.val();
    const records: PeriodRecord[] = Object.keys(raw).map((key) => {
      const item = raw[key];
      return {
        id: key,
        startDate: item.startDate || '',
        endDate: item.endDate || '',
        cycleLengthDays: item.cycleLengthDays ?? item.cycleLength ?? 28,
        flowIntensity: item.flowIntensity || 'Moderate',
        symptoms: Array.isArray(item.symptoms) ? item.symptoms : [],
        notes: item.notes || '',
      };
    });

    // Sort descending by startDate
    return records.sort((a, b) => (b.startDate > a.startDate ? 1 : -1));
  },

  async create(payload: Omit<PeriodRecord, 'id'>): Promise<PeriodRecord> {
    const uid = requireUid();
    const periodRef = ref(database, `users/${uid}/periods`);
    const newEntryRef = push(periodRef);
    const id = newEntryRef.key!;
    const nowIso = new Date().toISOString();

    const recordData = {
      startDate: payload.startDate,
      endDate: payload.endDate,
      cycleLength: payload.cycleLengthDays ?? 28,
      cycleLengthDays: payload.cycleLengthDays ?? 28,
      flowIntensity: payload.flowIntensity,
      symptoms: payload.symptoms || [],
      notes: payload.notes || '',
      createdAt: nowIso,
    };

    await set(newEntryRef, recordData);
    return { id, ...payload };
  },

  async update(id: string, payload: Omit<PeriodRecord, 'id'>): Promise<PeriodRecord> {
    const uid = requireUid();
    const itemRef = ref(database, `users/${uid}/periods/${id}`);
    const recordData = {
      startDate: payload.startDate,
      endDate: payload.endDate,
      cycleLength: payload.cycleLengthDays ?? 28,
      cycleLengthDays: payload.cycleLengthDays ?? 28,
      flowIntensity: payload.flowIntensity,
      symptoms: payload.symptoms || [],
      notes: payload.notes || '',
      updatedAt: new Date().toISOString(),
    };
    await update(itemRef, recordData);
    return { id, ...payload };
  },

  async remove(id: string): Promise<void> {
    const uid = requireUid();
    const itemRef = ref(database, `users/${uid}/periods/${id}`);
    await remove(itemRef);
  },
};
