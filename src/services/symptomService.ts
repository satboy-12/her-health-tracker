import { ref, push, get, set, remove } from 'firebase/database';
import { auth, database } from '../firebase/firebase';
import type { PcosSymptomLog } from '../types/api';

function requireUid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required for PCOS symptom tracker.');
  return user.uid;
}

export const symptomsService = {
  async list(): Promise<PcosSymptomLog[]> {
    const uid = requireUid();
    const symptomRef = ref(database, `users/${uid}/symptoms`);
    const snap = await get(symptomRef);
    if (!snap.exists()) return [];

    const raw = snap.val();
    const records: PcosSymptomLog[] = Object.keys(raw).map((key) => {
      const item = raw[key];
      return {
        id: key,
        date: item.date || '',
        symptoms: Array.isArray(item.symptoms) ? item.symptoms : [],
        severity: Number(item.severity) || 1,
        painLevel: Number(item.painLevel) || 0,
        energyLevel: Number(item.energyLevel) || 3,
        observations: item.observations || item.notes || '',
        createdAt: item.createdAt || '',
      };
    });

    return records.sort((a, b) => (b.date > a.date ? 1 : -1));
  },

  async create(payload: Omit<PcosSymptomLog, 'id'>): Promise<PcosSymptomLog> {
    const uid = requireUid();
    const symptomRef = ref(database, `users/${uid}/symptoms`);
    const newRef = push(symptomRef);
    const id = newRef.key!;
    const nowIso = new Date().toISOString();

    const recordData = {
      date: payload.date,
      symptoms: payload.symptoms || [],
      severity: payload.severity || 1,
      painLevel: payload.painLevel ?? 0,
      energyLevel: payload.energyLevel ?? 3,
      observations: payload.observations || '',
      notes: payload.observations || '',
      createdAt: nowIso,
    };

    await set(newRef, recordData);
    return { id, ...payload, createdAt: nowIso };
  },

  async remove(id: string): Promise<void> {
    const uid = requireUid();
    const itemRef = ref(database, `users/${uid}/symptoms/${id}`);
    await remove(itemRef);
  },
};
