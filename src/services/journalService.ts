import { ref, push, get, set, update, remove } from 'firebase/database';
import { database } from '../firebase/firebase';
import type { JournalEntry } from '../types/api';
import { ensureUserAccountAndProfile } from './authService';
import { requireAuthenticatedUser, wrapRtdbError } from './rtdbErrors';

export const journalService = {
  async list(searchQuery?: string): Promise<JournalEntry[]> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · journal', 'GET');
    try {
      const journalRef = ref(database, `users/${user.uid}/journal`);
      const snap = await get(journalRef);
      if (!snap.exists()) return [];

      const raw = snap.val() as Record<string, Record<string, unknown>>;
      const records: JournalEntry[] = Object.keys(raw).map((key) => {
        const item = raw[key] || {};
        return {
          id: key,
          title: String(item.title || 'Untitled Entry'),
          content: String(item.content || ''),
          category: (item.category ||
            (item.mood ? `${String(item.mood)} Reflection` : 'General Reflection')) as JournalEntry['category'],
          entryDate: String(item.entryDate || item.date || item.createdAt || new Date().toISOString()),
          updatedAt: item.updatedAt
            ? String(item.updatedAt)
            : item.createdAt
            ? String(item.createdAt)
            : undefined,
        };
      });

      const sorted = records.sort((a, b) => b.entryDate.localeCompare(a.entryDate));
      if (!searchQuery?.trim()) return sorted;

      const q = searchQuery.trim().toLowerCase();
      return sorted.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q),
      );
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · journal',
        'GET',
        'Failed to load journal entries.',
        user.uid,
      );
    }
  },

  async create(payload: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · journal', 'POST');
    try {
      await ensureUserAccountAndProfile(user);
      const journalRef = ref(database, `users/${user.uid}/journal`);
      const newRef = push(journalRef);
      const id = newRef.key!;
      const nowIso = new Date().toISOString();
      const entryDate = payload.entryDate || nowIso;
      const title = (payload.title || 'Untitled Entry').trim().slice(0, 250) || 'Untitled Entry';
      const content = (payload.content || '').trim().slice(0, 50000);

      const recordData = {
        title,
        content,
        mood: payload.category || 'General Reflection',
        category: payload.category || 'General Reflection',
        entryDate,
        date: entryDate.slice(0, 10),
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await set(newRef, recordData);
      return { id, ...payload, title, content, entryDate, updatedAt: nowIso };
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · journal',
        'POST',
        'Failed to create journal entry.',
        user.uid,
      );
    }
  },

  async update(id: string, payload: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · journal', 'PATCH');
    try {
      const itemRef = ref(database, `users/${user.uid}/journal/${id}`);
      const nowIso = new Date().toISOString();
      const entryDate = payload.entryDate || nowIso;
      const title = (payload.title || 'Untitled Entry').trim().slice(0, 250) || 'Untitled Entry';
      const content = (payload.content || '').trim().slice(0, 50000);

      const recordData = {
        title,
        content,
        mood: payload.category || 'General Reflection',
        category: payload.category || 'General Reflection',
        entryDate,
        date: entryDate.slice(0, 10),
        updatedAt: nowIso,
      };

      await update(itemRef, recordData);
      return { id, ...payload, title, content, entryDate, updatedAt: nowIso };
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · journal',
        'PATCH',
        'Failed to update journal entry.',
        user.uid,
      );
    }
  },

  async remove(id: string): Promise<void> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · journal', 'DELETE');
    try {
      const itemRef = ref(database, `users/${user.uid}/journal/${id}`);
      await remove(itemRef);
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · journal',
        'DELETE',
        'Failed to delete journal entry.',
        user.uid,
      );
    }
  },
};
