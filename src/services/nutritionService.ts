import { ref, push, get, set, remove } from 'firebase/database';
import { auth, database } from '../firebase/firebase';
import type { NutritionMealItem, NutritionSummaryResponse, NutritionTargets } from '../types/api';

function requireUid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required for Nutrition & Diet.');
  return user.uid;
}

const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2000,
  proteinGrams: 75,
  carbsGrams: 220,
  fatGrams: 60,
  fiberGrams: 30,
};

export const nutritionService = {
  async list(date?: string): Promise<NutritionMealItem[]> {
    const uid = requireUid();
    const nutritionRef = ref(database, `users/${uid}/nutrition`);
    const snap = await get(nutritionRef);
    if (!snap.exists()) return [];

    const raw = snap.val();
    const records: NutritionMealItem[] = Object.keys(raw).map((key) => {
      const item = raw[key];
      return {
        id: key,
        date: item.date || '',
        mealType: item.meals || item.mealType || 'Breakfast',
        foodName: item.foodItems || item.foodName || 'Meal',
        portion: item.portion || '1 serving',
        calories: Number(item.calories) || 0,
        proteinGrams: Number(item.proteinGrams) || 0,
        carbsGrams: Number(item.carbsGrams) || 0,
        fatGrams: Number(item.fatGrams) || 0,
        fiberGrams: Number(item.fiberGrams) || 0,
        loggedTime: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      };
    });

    if (date) {
      return records.filter((r) => r.date === date);
    }
    return records.sort((a, b) => (b.date > a.date ? 1 : -1));
  },

  async getSummary(date?: string): Promise<NutritionSummaryResponse> {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const meals = await this.list(targetDate);

    // Calculate weekly history for past 7 days
    const weeklyTotals: Array<{ date: string; label: string; calories: number; status: string }> = [];
    const anchor = new Date(`${targetDate}T00:00:00Z`);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchor);
      d.setUTCDate(anchor.getUTCDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      const dayMeals = await this.list(iso);
      const cal = dayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
      weeklyTotals.push({
        date: iso,
        label,
        calories: cal,
        status: cal > DEFAULT_TARGETS.calories ? 'Over Target' : cal > 0 ? 'On Track' : 'Unlogged',
      });
    }

    return {
      date: targetDate,
      targets: DEFAULT_TARGETS,
      meals,
      weeklyTotals,
    };
  },

  async create(payload: Omit<NutritionMealItem, 'id'>): Promise<NutritionMealItem> {
    const uid = requireUid();
    const nutritionRef = ref(database, `users/${uid}/nutrition`);
    const newRef = push(nutritionRef);
    const id = newRef.key!;
    const nowIso = new Date().toISOString();

    const recordData = {
      date: payload.date,
      meals: payload.mealType,
      mealType: payload.mealType,
      foodItems: payload.foodName,
      foodName: payload.foodName,
      portion: payload.portion,
      calories: Number(payload.calories) || 0,
      proteinGrams: Number(payload.proteinGrams) || 0,
      carbsGrams: Number(payload.carbsGrams) || 0,
      fatGrams: Number(payload.fatGrams) || 0,
      fiberGrams: Number(payload.fiberGrams) || 0,
      notes: `${payload.foodName} (${payload.portion})`,
      createdAt: nowIso,
    };

    await set(newRef, recordData);
    return { id, ...payload, loggedTime: new Date(nowIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
  },

  async createMeal(payload: Omit<NutritionMealItem, 'id'>): Promise<NutritionMealItem> {
    return this.create(payload);
  },

  async remove(id: string): Promise<void> {
    const uid = requireUid();
    const itemRef = ref(database, `users/${uid}/nutrition/${id}`);
    await remove(itemRef);
  },

  async removeMeal(id: string): Promise<void> {
    return this.remove(id);
  },
};
