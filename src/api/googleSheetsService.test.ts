import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHealthSheetValueRanges } from './googleSheetsService';

test('buildHealthSheetValueRanges produces all 6 structured tracker tabs with headers and rows', () => {
  const ranges = buildHealthSheetValueRanges({
    periods: [
      {
        id: 'p1',
        startDate: '2026-11-01',
        endDate: '2026-11-05',
        flowIntensity: 'Moderate',
        symptoms: ['Cramps', 'Fatigue'],
        notes: 'Calm week',
      },
    ],
    symptoms: [
      {
        id: 's1',
        date: '2026-11-10',
        symptoms: ['Bloating'],
        severity: 2,
        painLevel: 3,
        energyLevel: 4,
        observations: 'Mild',
      },
    ],
    wellness: [
      {
        id: 'w1',
        date: '2026-11-10',
        mood: 'Calm',
        sleepHours: 7.5,
        sleepQuality: 'Good/Restful',
        stressLevel: 3,
        notes: 'Restful night',
      },
    ],
    meals: [
      {
        id: 'm1',
        date: '2026-11-10',
        mealType: 'Breakfast',
        foodName: 'Oats with berries',
        portion: '1 bowl',
        calories: 360,
        proteinGrams: 12,
        carbsGrams: 54,
        fatGrams: 9,
        fiberGrams: 8,
      },
    ],
    waterEntries: [
      {
        id: 'wt1',
        date: '2026-11-10',
        amountMl: 500,
        loggedAt: '2026-11-10T09:00:00Z',
      },
    ],
    journal: [
      {
        id: 'j1',
        entryDate: '2026-11-10',
        category: 'General Reflection',
        title: 'Morning notes',
        content: 'Feeling balanced.',
      },
    ],
  });

  assert.equal(ranges.length, 6);
  assert.deepEqual(
    ranges.map((r) => r.range),
    [
      'Periods!A1',
      'PCOS_Symptoms!A1',
      'Mood_Sleep!A1',
      'Nutrition!A1',
      'Water!A1',
      'Journal!A1',
    ],
  );
  assert.equal(ranges[0].values[1][4], 'Cramps, Fatigue');
  assert.equal(ranges[3].values[1][3], 'Oats with berries');
  assert.equal(ranges[4].values[1][2], 500);
});
