import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearIntroCompleted,
  hasCompletedIntro,
  INTRO_SEEN_KEY,
  markIntroCompleted,
  shouldShowCinematicIntro,
  type StorageWriter,
} from './introStorage';

function createMemoryStorage(): StorageWriter {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
}

test('intro plays on first visit and stays suppressed after completion', () => {
  const store = createMemoryStorage();
  assert.equal(shouldShowCinematicIntro({ storage: store }), true);
  assert.equal(hasCompletedIntro(store), false);

  markIntroCompleted(store);
  assert.equal(store.getItem(INTRO_SEEN_KEY), '1');
  assert.equal(hasCompletedIntro(store), true);
  assert.equal(shouldShowCinematicIntro({ storage: store }), false);
});

test('replayRequested forces cinematic intro even after completion and clear resets flag', () => {
  const store = createMemoryStorage();
  markIntroCompleted(store);
  assert.equal(shouldShowCinematicIntro({ storage: store, replayRequested: true }), true);

  clearIntroCompleted(store);
  assert.equal(shouldShowCinematicIntro({ storage: store }), true);
});
