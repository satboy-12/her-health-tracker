export const INTRO_SEEN_KEY = 'hhj_intro_seen';

export interface StorageReader {
  getItem(key: string): string | null;
}

export interface StorageWriter extends StorageReader {
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function hasCompletedIntro(storage?: StorageReader | null): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markIntroCompleted(storage?: StorageWriter | null): void {
  if (!storage) return;
  try {
    storage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // Ignore storage access errors in restricted frames
  }
}

export function clearIntroCompleted(storage?: StorageWriter | null): void {
  if (!storage) return;
  try {
    storage.removeItem(INTRO_SEEN_KEY);
  } catch {
    // Ignore storage access errors
  }
}

export function shouldShowCinematicIntro(options: {
  storage?: StorageReader | null;
  replayRequested?: boolean;
}): boolean {
  if (options.replayRequested) return true;
  return !hasCompletedIntro(options.storage);
}
