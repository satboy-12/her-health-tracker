import { ref, push, get, set, update, remove } from 'firebase/database';
import { auth, database } from '../firebase/firebase';
import type { JournalEntry } from '../types/api';

function requireUid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required for Health Journal.');
  return user.uid;
}

export const journalService = {
  async list(): Promise<JournalEntry[]> {
    const uid = requireUid();
    const journalRef = ref(database, `users/${uid}/journal`);
    const snap = await get(journalRef);
    if (!snap.exists()) return [];

    const raw = snap.val();
    const records: JournalEntry[] = Object.keys(raw).map((key) => {
      const item = raw[key];
      return {
        id: key,
        title: item.title || 'Untitled Entry',
        content: item.content || '',
        category: item.category || (item.mood ? `${item.mood} Reflection` : 'General Reflection'),
        entryDate: item.date || item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || item.createdAt,
      };
    });

    return records.sort((a, b) => (b.entryDate > a.entryDate ? 1 : -1));
  },

  async create(payload: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
    const uid = requireUid();
    const journalRef = ref(database, `users/${uid}/journal`);
    const newRef = push(journalRef);
    const id = newRef.key!;
    const nowIso = new Date().toISOString();

    const recordData = {
      title: payload.title,
      content: payload.content,
      mood: payload.category || 'General',
      category: payload.category,
      date: payload.entryDate || nowIso.slice(0, 10),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await set(newRef, recordData);
    return { id, ...payload, updatedAt: nowIso };
  },

  async update(id: string, payload: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
    const uid = requireUid();
    const itemRef = ref(database, `users/${uid}/journal/${id}`);
    const nowIso = new Date().toISOString();

    const recordData = {
      title: payload.title,
      content: payload.content,
      mood: payload.category || 'General',
      category: payload.category,
      date: payload.entryDate || nowIso.slice(0, 10),
      updatedAt: nowIso,
    };

    await update(itemRef, recordData);
    return { id, ...payload, updatedAt: nowIso };
  },

  async remove(id: string): Promise<void> {
    const uid = requireUid();
    const itemRef = ref(database, `users/${uid}/journal/${id}`);
    await remove(itemRef);
  },
};
