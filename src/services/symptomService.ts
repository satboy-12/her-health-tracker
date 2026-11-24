import { ref, push, get, set, remove } from 'firebase/database';
import { database } from '../firebase/firebase';
import type { PcosSymptomLog } from '../types/api';
import { ensureUserAccountAndProfile } from './authService';
import { requireAuthenticatedUser, wrapRtdbError } from './rtdbErrors';

export const symptomsService = {
  async list(): Promise<PcosSymptomLog[]> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · symptoms', 'GET');
    try {
      const symptomRef = ref(database, `users/${user.uid}/symptoms`);
      const snap = await get(symptomRef);
      if (!snap.exists()) return [];

      const raw = snap.val() as Record<string, Record<string, unknown>>;
      const records: PcosSymptomLog[] = Object.keys(raw).map((key) => {
        const item = raw[key] || {};
        return {
          id: key,
          date: String(item.date || ''),
          symptoms: Array.isArray(item.symptoms) ? item.symptoms.map(String) : [],
          severity: Number(item.severity) || 1,
          painLevel: Number(item.painLevel) || 0,
          energyLevel: Number(item.energyLevel) || 3,
          observations: String(item.observations || item.notes || ''),
          createdAt: item.createdAt ? String(item.createdAt) : '',
        };
      });

      return records.sort((a, b) => b.date.localeCompare(a.date));
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · symptoms',
        'GET',
        'Failed to load symptom logs.',
        user.uid,
      );
    }
  },

  async create(payload: Omit<PcosSymptomLog, 'id'>): Promise<PcosSymptomLog> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · symptoms', 'POST');
    try {
      await ensureUserAccountAndProfile(user);
      const symptomRef = ref(database, `users/${user.uid}/symptoms`);
      const newRef = push(symptomRef);
      const id = newRef.key!;
      const nowIso = new Date().toISOString();
      const severity = Math.max(1, Math.min(10, Math.round(Number(payload.severity) || 1)));

      const recordData = {
        date: payload.date,
        symptoms: payload.symptoms || [],
        severity,
        painLevel: Math.max(0, Math.min(10, Math.round(Number(payload.painLevel ?? 0)))),
        energyLevel: Math.max(1, Math.min(10, Math.round(Number(payload.energyLevel ?? 3)))),
        observations: (payload.observations || '').slice(0, 2000),
        notes: (payload.observations || '').slice(0, 2000),
        createdAt: nowIso,
      };

      await set(newRef, recordData);
      return { id, ...payload, severity, createdAt: nowIso };
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · symptoms',
        'POST',
        'Failed to save symptom log.',
        user.uid,
      );
    }
  },

  async remove(id: string): Promise<void> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · symptoms', 'DELETE');
    try {
      const itemRef = ref(database, `users/${user.uid}/symptoms/${id}`);
      await remove(itemRef);
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · symptoms',
        'DELETE',
        'Failed to delete symptom log.',
        user.uid,
      );
    }
  },
};
