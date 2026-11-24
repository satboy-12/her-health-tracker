import { ref, push, get, set, update, remove } from 'firebase/database';
import { database } from '../firebase/firebase';
import type { PeriodRecord } from '../types/api';
import { calculateCycleLengths } from '../utils/healthCalculations';
import { ensureUserAccountAndProfile } from './authService';
import { requireAuthenticatedUser, wrapRtdbError } from './rtdbErrors';

export const periodsService = {
  async list(): Promise<PeriodRecord[]> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · periods', 'GET');
    try {
      const periodRef = ref(database, `users/${user.uid}/periods`);
      const snap = await get(periodRef);
      if (!snap.exists()) return [];

      const raw = snap.val() as Record<string, Record<string, unknown>>;
      const rawRecords: PeriodRecord[] = Object.keys(raw).map((key) => {
        const item = raw[key] || {};
        const storedCycle = item.cycleLengthDays ?? item.cycleLength;
        return {
          id: key,
          startDate: String(item.startDate || ''),
          endDate: String(item.endDate || ''),
          cycleLengthDays:
            typeof storedCycle === 'number' && storedCycle > 0 ? storedCycle : undefined,
          flowIntensity: (item.flowIntensity as PeriodRecord['flowIntensity']) || 'Moderate',
          symptoms: Array.isArray(item.symptoms) ? item.symptoms.map(String) : [],
          notes: item.notes ? String(item.notes) : '',
        };
      });

      const sortedAsc = [...rawRecords].sort((a, b) => a.startDate.localeCompare(b.startDate));
      const computedLengths = calculateCycleLengths(sortedAsc);
      const lengthMap = new Map<string, number>();
      for (let i = 1; i < sortedAsc.length; i += 1) {
        if (computedLengths[i - 1] != null) {
          lengthMap.set(sortedAsc[i].id, computedLengths[i - 1]);
        }
      }

      return rawRecords
        .map((record) => ({
          ...record,
          cycleLengthDays: lengthMap.get(record.id) ?? record.cycleLengthDays,
        }))
        .sort((a, b) => b.startDate.localeCompare(a.startDate));
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · periods',
        'GET',
        'Failed to load period logs.',
        user.uid,
      );
    }
  },

  async create(payload: Omit<PeriodRecord, 'id'>): Promise<PeriodRecord> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · periods', 'POST');
    try {
      await ensureUserAccountAndProfile(user);
      const periodRef = ref(database, `users/${user.uid}/periods`);
      const newEntryRef = push(periodRef);
      const id = newEntryRef.key!;
      const nowIso = new Date().toISOString();

      const recordData: Record<string, unknown> = {
        startDate: payload.startDate,
        endDate: payload.endDate,
        flowIntensity: payload.flowIntensity || 'Moderate',
        symptoms: payload.symptoms || [],
        notes: (payload.notes || '').slice(0, 2000),
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      if (typeof payload.cycleLengthDays === 'number' && payload.cycleLengthDays > 0) {
        recordData.cycleLength = payload.cycleLengthDays;
        recordData.cycleLengthDays = payload.cycleLengthDays;
      }

      await set(newEntryRef, recordData);
      return { id, ...payload };
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · periods',
        'POST',
        'Failed to save period log.',
        user.uid,
      );
    }
  },

  async update(id: string, payload: Omit<PeriodRecord, 'id'>): Promise<PeriodRecord> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · periods', 'PATCH');
    try {
      const itemRef = ref(database, `users/${user.uid}/periods/${id}`);
      const recordData: Record<string, unknown> = {
        startDate: payload.startDate,
        endDate: payload.endDate,
        flowIntensity: payload.flowIntensity || 'Moderate',
        symptoms: payload.symptoms || [],
        notes: (payload.notes || '').slice(0, 2000),
        updatedAt: new Date().toISOString(),
      };
      if (typeof payload.cycleLengthDays === 'number' && payload.cycleLengthDays > 0) {
        recordData.cycleLength = payload.cycleLengthDays;
        recordData.cycleLengthDays = payload.cycleLengthDays;
      }
      await update(itemRef, recordData);
      return { id, ...payload };
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · periods',
        'PATCH',
        'Failed to update period log.',
        user.uid,
      );
    }
  },

  async remove(id: string): Promise<void> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · periods', 'DELETE');
    try {
      const itemRef = ref(database, `users/${user.uid}/periods/${id}`);
      await remove(itemRef);
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · periods',
        'DELETE',
        'Failed to delete period log.',
        user.uid,
      );
    }
  },
};
