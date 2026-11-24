import { ref, get, child } from 'firebase/database';
import { auth, database } from '../firebase/firebase';
import type { DashboardSummary, PeriodRecord, PcosSymptomLog, WellnessEntry, JournalEntry } from '../types/api';
import { calculatePeriodEstimate } from '../utils/healthCalculations';
import { periodsService } from './periodService';
import { symptomsService } from './symptomService';
import { wellnessService } from './wellnessService';
import { nutritionService } from './nutritionService';
import { waterService } from './waterService';
import { journalService } from './journalService';

function requireUid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required for Dashboard.');
  return user.uid;
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const uid = requireUid();
    const todayIso = new Date().toISOString().slice(0, 10);

    let userName = auth.currentUser?.displayName || 'Member';
    try {
      const profSnap = await get(child(ref(database), `users/${uid}/profile`));
      if (profSnap.exists() && profSnap.val()?.fullName) {
        userName = profSnap.val().fullName;
      }
    } catch {
      // Fallback to displayName
    }

    const [periods, symptoms, wellnessList, nutritionSummary, waterData, journalEntries] = await Promise.all([
      periodsService.list().catch(() => [] as PeriodRecord[]),
      symptomsService.list().catch(() => [] as PcosSymptomLog[]),
      wellnessService.list().catch(() => [] as WellnessEntry[]),
      nutritionService.getSummary(todayIso).catch(() => null),
      waterService.getDaily(todayIso).catch(() => null),
      journalService.list().catch(() => [] as JournalEntry[]),
    ]);

    const estimate = calculatePeriodEstimate(periods, todayIso);

    const latestWellness = wellnessList[0] || null;
    let wellnessInsight = 'Maintain regular sleep and gentle hydration today.';
    if (latestWellness) {
      if (latestWellness.mood === 'Radiant') wellnessInsight = 'Energy levels are peaked — an ideal window for movement and focus.';
      else if (latestWellness.mood === 'Fatigued') wellnessInsight = 'Restorative rest and magnesium-rich nourishment are suggested.';
      else if (latestWellness.stressLevel >= 7) wellnessInsight = 'Elevated stress observed. Consider deep diaphragmatic breathing and quiet rest.';
    }

    const latestSymptom = symptoms[0] || null;
    const caloriesConsumed = nutritionSummary
      ? nutritionSummary.meals.reduce((sum, m) => sum + (m.calories || 0), 0)
      : 0;

    const daysUntilNextPeriod = estimate?.nextPeriodStart
      ? Math.max(0, Math.ceil((new Date(estimate.nextPeriodStart).getTime() - new Date(todayIso).getTime()) / (1000 * 3600 * 24)))
      : null;

    return {
      userName,
      cycleSummary: {
        currentDay: estimate?.currentCycleDay ?? null,
        phase: estimate?.currentPhase ?? 'Uncharted',
        daysUntilNextPeriod,
        nextPeriodDate: estimate?.nextPeriodStart ?? null,
        fertilityStatus: estimate?.currentPhase === 'Ovulation' ? 'Peak Fertile' : estimate?.currentPhase === 'Follicular' ? 'Opening Window' : 'Low',
        averageCycleLength: estimate?.averageCycleLength ?? 28,
        cycleHistory: periods.slice(0, 6).map((p) => ({
          month: new Date(p.startDate).toLocaleDateString('en-US', { month: 'short' }),
          lengthDays: p.cycleLengthDays || 28,
        })),
      },
      wellnessSummary: {
        mood: latestWellness?.mood || 'Calm',
        sleepHours: latestWellness?.sleepHours || 7.5,
        energyLevel: latestWellness ? (latestWellness.stressLevel <= 3 ? 'High' : latestWellness.stressLevel <= 6 ? 'Steady' : 'Low') : 'Steady',
        insight: wellnessInsight,
      },
      waterSummary: {
        intakeMl: waterData?.totalIntakeMl || 0,
        targetMl: waterData?.dailyTargetMl || 2500,
      },
      latestSymptom,
      nutritionSummary: {
        caloriesConsumed,
        caloriesTarget: 2000,
        antiInflammatoryScore: 85,
        sugarStatus: 'Balanced',
      },
      recentJournalEntries: journalEntries.slice(0, 3),
    };
  },
};
