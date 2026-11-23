import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Coffee,
  Cookie,
  Flame,
  Plus,
  Sun,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ApiIntegrationBanner } from '../components/ApiIntegrationBanner';
import { EmptyStateCard } from '../components/EmptyStateCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ToastBanner } from '../components/ToastBanner';
import { ApiError } from '../api/client';
import { nutritionService } from '../api/services';
import type { MealCategory, NutritionSummaryResponse } from '../types/api';
import { sumNutritionMacros } from '../utils/healthCalculations';
import { validateMealInput } from '../utils/validation';

const MEAL_SECTIONS: Array<{
  category: MealCategory;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { category: 'Breakfast', icon: Sun },
  { category: 'Lunch', icon: Utensils },
  { category: 'Dinner', icon: Coffee },
  { category: 'Snacks', icon: Cookie },
];

export function NutritionPage() {
  const todayIso = new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [summary, setSummary] = useState<NutritionSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<ApiError | string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [mealType, setMealType] = useState<MealCategory>('Breakfast');
  const [foodName, setFoodName] = useState('');
  const [portion, setPortion] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinGrams, setProteinGrams] = useState('');
  const [carbsGrams, setCarbsGrams] = useState('');
  const [fatGrams, setFatGrams] = useState('');
  const [fiberGrams, setFiberGrams] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const loadNutrition = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await nutritionService.getSummary(selectedDate);
      setSummary(data);
    } catch (err) {
      setSummary(null);
      setApiError(err instanceof ApiError ? err : 'Failed to load nutrition diary.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void loadNutrition();
  }, [loadNutrition]);

  const meals = summary?.meals ?? [];
  const totals = useMemo(() => sumNutritionMacros(meals), [meals]);
  const targets = summary?.targets ?? {
    calories: 0,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 0,
    fiberGrams: 0,
  };

  const openModalFor = (category: MealCategory) => {
    setMealType(category);
    setFoodName('');
    setPortion('');
    setCalories('');
    setProteinGrams('');
    setCarbsGrams('');
    setFatGrams('');
    setFiberGrams('');
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCreateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCal = Number(calories);
    const errors = validateMealInput({
      foodName,
      portion,
      calories: calories === '' ? -1 : parsedCal,
    });
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await nutritionService.createMeal({
        date: selectedDate,
        mealType,
        foodName: foodName.trim(),
        portion: portion.trim(),
        calories: parsedCal,
        proteinGrams: Number(proteinGrams) || 0,
        carbsGrams: Number(carbsGrams) || 0,
        fatGrams: Number(fatGrams) || 0,
        fiberGrams: Number(fiberGrams) || 0,
      });
      setModalOpen(false);
      setToast({ message: `Added "${foodName.trim()}" to ${mealType}.`, variant: 'success' });
      await loadNutrition();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Unable to save meal item.';
      setFormErrors({ submit: msg });
      setToast({ message: msg, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await nutritionService.removeMeal(id);
      setToast({ message: 'Meal item removed.', variant: 'success' });
      await loadNutrition();
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : 'Failed to remove meal item.',
        variant: 'error',
      });
    }
  };

  const macroCards = [
    {
      label: 'Protein',
      current: totals.proteinGrams,
      target: targets.proteinGrams,
      barColor: 'bg-primary',
    },
    {
      label: 'Complex Carbs',
      current: totals.carbsGrams,
      target: targets.carbsGrams,
      barColor: 'bg-tertiary',
    },
    {
      label: 'Healthy Fats',
      current: totals.fatGrams,
      target: targets.fatGrams,
      barColor: 'bg-secondary',
    },
    {
      label: 'Fiber',
      current: totals.fiberGrams,
      target: targets.fiberGrams,
      barColor: 'bg-tertiary-container',
    },
  ];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-surface-tint">
              Daily Fuel &amp; Balance
            </p>
            <h1 className="font-display text-3xl font-semibold text-on-surface mt-1">
              Nutrition &amp; Diet
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              aria-label="Food diary date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-surface-container-low border border-outline-variant px-3 py-2 rounded-xl text-sm text-on-surface"
            />
            <div className="flex items-center gap-2.5 bg-surface-container-low border border-outline-variant px-4 py-2 rounded-xl">
              <Flame className="w-4 h-4 text-primary" aria-hidden="true" />
              <div className="text-xs">
                <span className="text-on-surface-variant block">Daily Calorie Target</span>
                <span className="font-semibold text-on-surface tabular-nums">
                  {totals.calories.toLocaleString()} /{' '}
                  {targets.calories > 0 ? `${targets.calories.toLocaleString()} kcal` : '— kcal'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <ApiIntegrationBanner
          error={apiError}
          expectedEndpoint={`GET /api/nutrition?date=${selectedDate}`}
          onRetry={loadNutrition}
          retrying={loading}
        />

        {/* Macro Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {macroCards.map((macro) => {
            const pct = macro.target > 0 ? Math.min(100, Math.round((macro.current / macro.target) * 100)) : 0;
            return (
              <div
                key={macro.label}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface-variant">{macro.label}</span>
                  <span className="text-xs text-on-surface-variant tabular-nums">{pct}%</span>
                </div>
                <div className="font-display text-2xl font-semibold text-on-surface tabular-nums">
                  {macro.current}g{' '}
                  <span className="text-sm font-normal text-on-surface-variant">
                    / {macro.target > 0 ? `${macro.target}g` : '— g'}
                  </span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div
                    className={`${macro.barColor} h-full rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Food Diary & Guidance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-on-surface">Food Diary</h2>
              <button
                type="button"
                onClick={() => openModalFor('Breakfast')}
                className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Log Meal Item
              </button>
            </div>

            {loading ? (
              <LoadingSkeleton rows={4} />
            ) : (
              <div className="space-y-4">
                {MEAL_SECTIONS.map(({ category, icon: Icon }) => {
                  const items = meals.filter((m) => m.mealType === category);
                  const categoryKcal = items.reduce((sum, item) => sum + item.calories, 0);
                  return (
                    <section
                      key={category}
                      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                          <h3 className="font-display text-base font-semibold text-on-surface">
                            {category}
                          </h3>
                        </div>
                        <span className="text-xs text-on-surface-variant tabular-nums">
                          {categoryKcal} kcal
                        </span>
                      </div>

                      {items.length === 0 ? (
                        <div className="p-4 border border-dashed border-outline-variant rounded-lg text-center">
                          <p className="text-xs text-on-surface-variant mb-1">
                            No {category.toLowerCase()} logged for {selectedDate}
                          </p>
                          <button
                            type="button"
                            onClick={() => openModalFor(category)}
                            className="text-xs font-medium text-primary hover:underline cursor-pointer"
                          >
                            + Add {category} Item
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-3 p-3 bg-surface-container-low rounded-lg"
                            >
                              <div>
                                <div className="text-sm font-medium text-on-surface">
                                  {item.foodName}
                                </div>
                                <div className="text-xs text-on-surface-variant">
                                  {item.portion} · {item.calories} kcal
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="hidden sm:inline text-xs text-on-surface-variant tabular-nums">
                                  P: {item.proteinGrams}g | C: {item.carbsGrams}g | F: {item.fatGrams}g
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Remove ${item.foodName}`}
                                  onClick={() => void handleDeleteMeal(item.id)}
                                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Guidance & Meal History */}
          <div className="space-y-5">
            <section className="bg-secondary-fixed/40 border border-outline-variant rounded-xl p-5 space-y-3">
              <h3 className="font-display text-base font-semibold text-on-surface">
                Hormone-Supportive Nutrition
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Balanced protein, fiber-rich complex carbohydrates, and omega-3 fats help stabilize blood glucose and support cycle regularity.
              </p>
              <ul className="space-y-1.5 text-xs text-on-surface">
                <li>· Leafy greens (spinach, kale, arugula)</li>
                <li>· Healthy fats (salmon, walnuts, flax seeds)</li>
                <li>· Slow-digesting grains (quinoa, oats, lentils)</li>
              </ul>
            </section>

            <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-on-surface">
                  Meal History
                </h3>
                <span className="text-xs text-surface-tint">Recent Days</span>
              </div>

              {summary?.weeklyTotals && summary.weeklyTotals.length > 0 ? (
                <div className="space-y-2">
                  {summary.weeklyTotals.map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between py-2 border-b border-outline-variant/60 last:border-b-0 text-xs"
                    >
                      <span className="text-on-surface-variant">{day.label}</span>
                      <span className="font-medium text-on-surface tabular-nums">
                        {day.calories.toLocaleString()} kcal · {day.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateCard
                  title="No Meal History Yet"
                  description="Past daily totals from GET /api/nutrition will appear here once logged."
                  endpoint="GET /api/nutrition"
                />
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Log Food Item Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="log-meal-title"
        >
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 id="log-meal-title" className="font-display text-xl font-semibold text-on-surface">
                Log Food Item
              </h2>
              <button
                type="button"
                aria-label="Close food log modal"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateMeal} className="space-y-4">
              <div>
                <label htmlFor="meal-type" className="block text-xs font-medium text-on-surface-variant mb-1">
                  Meal Timing
                </label>
                <select
                  id="meal-type"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealCategory)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snacks">Snacks</option>
                </select>
              </div>

              <div>
                <label htmlFor="meal-name" className="block text-xs font-medium text-on-surface-variant mb-1">
                  Food Name
                </label>
                <input
                  id="meal-name"
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. Avocado Toast with Poached Egg"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface"
                />
                {formErrors.foodName && (
                  <p className="text-xs text-error mt-1">{formErrors.foodName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="meal-portion" className="block text-xs font-medium text-on-surface-variant mb-1">
                    Portion
                  </label>
                  <input
                    id="meal-portion"
                    type="text"
                    value={portion}
                    onChange={(e) => setPortion(e.target.value)}
                    placeholder="1 serving"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface"
                  />
                  {formErrors.portion && (
                    <p className="text-xs text-error mt-1">{formErrors.portion}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="meal-calories" className="block text-xs font-medium text-on-surface-variant mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    id="meal-calories"
                    type="number"
                    min={0}
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="350"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface"
                  />
                  {formErrors.calories && (
                    <p className="text-xs text-error mt-1">{formErrors.calories}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label htmlFor="meal-protein" className="block text-xs text-on-surface-variant mb-1">
                    Protein (g)
                  </label>
                  <input
                    id="meal-protein"
                    type="number"
                    min={0}
                    value={proteinGrams}
                    onChange={(e) => setProteinGrams(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="meal-carbs" className="block text-xs text-on-surface-variant mb-1">
                    Carbs (g)
                  </label>
                  <input
                    id="meal-carbs"
                    type="number"
                    min={0}
                    value={carbsGrams}
                    onChange={(e) => setCarbsGrams(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="meal-fat" className="block text-xs text-on-surface-variant mb-1">
                    Fat (g)
                  </label>
                  <input
                    id="meal-fat"
                    type="number"
                    min={0}
                    value={fatGrams}
                    onChange={(e) => setFatGrams(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="meal-fiber" className="block text-xs text-on-surface-variant mb-1">
                    Fiber (g)
                  </label>
                  <input
                    id="meal-fiber"
                    type="number"
                    min={0}
                    value={fiberGrams}
                    onChange={(e) => setFiberGrams(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
              </div>

              {formErrors.submit && (
                <p className="text-xs text-error" role="alert">
                  {formErrors.submit}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary-container text-on-primary px-5 py-2 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastBanner
        message={toast?.message ?? null}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </AppShell>
  );
}
