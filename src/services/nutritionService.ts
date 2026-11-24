import { ref, push, get, set, remove } from 'firebase/database';
import { database } from '../firebase/firebase';
import type { NutritionMealItem, NutritionSummaryResponse, NutritionTargets } from '../types/api';
import { ensureUserAccountAndProfile } from './authService';
import { requireAuthenticatedUser, wrapRtdbError } from './rtdbErrors';

const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2000,
  proteinGrams: 75,
  carbsGrams: 220,
  fatGrams: 60,
  fiberGrams: 30,
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapNutritionMap(raw: Record<string, Record<string, unknown>>): NutritionMealItem[] {
  return Object.keys(raw).map((key) => {
    const item = raw[key] || {};
    return {
      id: key,
      date: String(item.date || ''),
      mealType: (item.meals || item.mealType || 'Breakfast') as NutritionMealItem['mealType'],
      foodName: String(item.foodItems || item.foodName || 'Meal'),
      portion: String(item.portion || '1 serving'),
      calories: Number(item.calories) || 0,
      proteinGrams: Number(item.proteinGrams) || 0,
      carbsGrams: Number(item.carbsGrams) || 0,
      fatGrams: Number(item.fatGrams) || 0,
      fiberGrams: Number(item.fiberGrams) || 0,
      loggedTime: item.loggedTime
        ? String(item.loggedTime)
        : item.createdAt
        ? new Date(String(item.createdAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : undefined,
    };
  });
}

export const nutritionService = {
  async list(date?: string): Promise<NutritionMealItem[]> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · nutrition', 'GET');
    try {
      const nutritionRef = ref(database, `users/${user.uid}/nutrition`);
      const snap = await get(nutritionRef);
      if (!snap.exists()) return [];

      const records = mapNutritionMap(snap.val() as Record<string, Record<string, unknown>>);
      if (date) {
        return records.filter((r) => r.date === date);
      }
      return records.sort((a, b) => b.date.localeCompare(a.date));
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · nutrition',
        'GET',
        'Failed to load meal logs.',
        user.uid,
      );
    }
  },

  async getSummary(date?: string): Promise<NutritionSummaryResponse> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · nutrition', 'GET');
    const targetDate = date || todayIso();
    try {
      const [nutritionSnap, calPrefSnap] = await Promise.all([
        get(ref(database, `users/${user.uid}/nutrition`)),
        get(ref(database, `users/${user.uid}/profile/preferences/dailyCalorieTarget`)),
      ]);

      const calTarget =
        calPrefSnap.exists() && Number(calPrefSnap.val()) > 0
          ? Number(calPrefSnap.val())
          : DEFAULT_TARGETS.calories;

      const targets: NutritionTargets = {
        ...DEFAULT_TARGETS,
        calories: calTarget,
      };

      const allMeals = nutritionSnap.exists()
        ? mapNutritionMap(nutritionSnap.val() as Record<string, Record<string, unknown>>)
        : [];

      const meals = allMeals.filter((m) => m.date === targetDate);

      const weeklyTotals: Array<{ date: string; label: string; calories: number; status: string }> = [];
      const anchor = new Date(`${targetDate}T00:00:00Z`);
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(anchor);
        d.setUTCDate(anchor.getUTCDate() - i);
        const iso = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
        const cal = allMeals
          .filter((m) => m.date === iso)
          .reduce((acc, m) => acc + (m.calories || 0), 0);
        weeklyTotals.push({
          date: iso,
          label,
          calories: cal,
          status: cal > targets.calories ? 'Over Target' : cal > 0 ? 'On Track' : 'Unlogged',
        });
      }

      return {
        date: targetDate,
        targets,
        meals,
        weeklyTotals,
      };
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · nutrition',
        'GET',
        'Failed to load nutrition summary.',
        user.uid,
      );
    }
  },

  async create(payload: Omit<NutritionMealItem, 'id'>): Promise<NutritionMealItem> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · nutrition', 'POST');
    try {
      await ensureUserAccountAndProfile(user);
      const nutritionRef = ref(database, `users/${user.uid}/nutrition`);
      const newRef = push(nutritionRef);
      const id = newRef.key!;
      const nowIso = new Date().toISOString();
      const loggedTime =
        payload.loggedTime ||
        new Date(nowIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const recordData = {
        date: payload.date,
        meals: payload.mealType,
        mealType: payload.mealType,
        foodItems: payload.foodName.trim().slice(0, 120),
        foodName: payload.foodName.trim().slice(0, 120),
        portion: (payload.portion || '1 serving').slice(0, 60),
        calories: Math.max(0, Number(payload.calories) || 0),
        proteinGrams: Math.max(0, Number(payload.proteinGrams) || 0),
        carbsGrams: Math.max(0, Number(payload.carbsGrams) || 0),
        fatGrams: Math.max(0, Number(payload.fatGrams) || 0),
        fiberGrams: Math.max(0, Number(payload.fiberGrams) || 0),
        loggedTime: loggedTime.slice(0, 40),
        notes: `${payload.foodName.trim()} (${payload.portion || '1 serving'})`.slice(0, 240),
        createdAt: nowIso,
      };

      await set(newRef, recordData);
      return { id, ...payload, loggedTime };
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · nutrition',
        'POST',
        'Failed to save meal entry.',
        user.uid,
      );
    }
  },

  async createMeal(payload: Omit<NutritionMealItem, 'id'>): Promise<NutritionMealItem> {
    return this.create(payload);
  },

  async remove(id: string): Promise<void> {
    const user = requireAuthenticatedUser('Firebase Realtime Database · nutrition', 'DELETE');
    try {
      const itemRef = ref(database, `users/${user.uid}/nutrition/${id}`);
      await remove(itemRef);
    } catch (err) {
      throw wrapRtdbError(
        err,
        'Firebase Realtime Database · nutrition',
        'DELETE',
        'Failed to delete meal entry.',
        user.uid,
      );
    }
  },

  async removeMeal(id: string): Promise<void> {
    return this.remove(id);
  },
};
