import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarPlus,
  Droplets,
  HeartPulse,
  PlusCircle,
  Smile,
  Utensils,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ApiIntegrationBanner } from '../components/ApiIntegrationBanner';
import { EmptyStateCard } from '../components/EmptyStateCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ToastBanner } from '../components/ToastBanner';
import { ApiError } from '../api/client';
import { dashboardService, waterService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import type { DashboardSummary } from '../types/api';

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<ApiError | string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await dashboardService.getSummary();
      setSummary(data);
    } catch (err) {
      setSummary(null);
      setApiError(err instanceof ApiError ? err : 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleQuickWater = async (amountMl: number) => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await waterService.logIntake({ date: today, amountMl });
      setToast({ message: `Added ${amountMl} ml to today's hydration log.`, variant: 'success' });
      await loadDashboard();
    } catch (err) {
      setToast({
        message:
          err instanceof ApiError
            ? `Cannot log water (${err.endpoint}): Backend not connected.`
            : 'Failed to log water intake.',
        variant: 'error',
      });
    }
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const greetingName = summary?.userName || user?.fullName || 'Welcome';

  const waterIntake = summary?.waterSummary?.intakeMl ?? 0;
  const waterTarget = summary?.waterSummary?.targetMl ?? 0;
  const waterPercent = waterTarget > 0 ? Math.min(100, Math.round((waterIntake / waterTarget) * 100)) : 0;
  const cycleHistory = summary?.cycleSummary?.cycleHistory ?? [];
  const maxCycleDays = Math.max(35, ...cycleHistory.map((c) => c.lengthDays));

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-surface-tint">
              {todayFormatted}
            </p>
            <h1 className="font-display text-3xl font-semibold text-on-surface mt-1">
              {user ? `Good day, ${greetingName}` : 'Health Overview'}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/pcos-tracker"
              className="bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant px-4 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-primary" aria-hidden="true" />
              Log Symptom
            </Link>
            <Link
              to="/period-tracker"
              className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap"
            >
              <CalendarPlus className="w-4 h-4" aria-hidden="true" />
              Log Period
            </Link>
          </div>
        </div>

        <ApiIntegrationBanner
          error={apiError}
          expectedEndpoint="GET /api/dashboard"
          onRetry={loadDashboard}
          retrying={loading}
        />

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Period Overview (Span 7) */}
            <section className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-surface-tint">
                    Cycle Phase · {summary?.cycleSummary.phase ?? 'Awaiting Cycle Data'}
                  </span>
                  {summary?.cycleSummary.fertilityStatus && (
                    <span className="text-xs font-medium text-primary">
                      {summary.cycleSummary.fertilityStatus}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 my-2">
                  <div>
                    <div className="text-4xl font-display font-bold text-on-surface tabular-nums">
                      {summary?.cycleSummary.currentDay != null
                        ? `Day ${summary.cycleSummary.currentDay}`
                        : 'No Active Cycle'}
                    </div>
                    <p className="text-sm text-on-surface-variant mt-1">
                      {summary?.cycleSummary.nextPeriodDate
                        ? `Approximate next period start: ${summary.cycleSummary.nextPeriodDate}`
                        : 'Log period dates in Period Tracker to calculate estimates.'}
                    </p>
                  </div>
                  <div className="bg-surface-container-low px-4 py-3 rounded-xl text-left sm:text-right">
                    <span className="text-xs text-on-surface-variant block">Next Period In</span>
                    <span className="text-xl font-display font-semibold text-primary tabular-nums">
                      {summary?.cycleSummary.daysUntilNextPeriod != null
                        ? `${summary.cycleSummary.daysUntilNextPeriod} Days`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs text-on-surface-variant mb-2">
                  <span>Menstrual</span>
                  <span>Follicular</span>
                  <span>Ovulation</span>
                  <span>Luteal</span>
                </div>
                <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full w-1/4 rounded-l-full ${
                      summary?.cycleSummary.phase === 'Menstrual' ? 'bg-primary' : 'bg-surface-variant'
                    }`}
                  />
                  <div
                    className={`h-full w-1/4 ${
                      summary?.cycleSummary.phase === 'Follicular' ? 'bg-primary' : 'bg-surface-variant'
                    }`}
                  />
                  <div
                    className={`h-full w-1/4 ${
                      summary?.cycleSummary.phase === 'Ovulation' ? 'bg-primary' : 'bg-surface-variant'
                    }`}
                  />
                  <div
                    className={`h-full w-1/4 rounded-r-full ${
                      summary?.cycleSummary.phase === 'Luteal' ? 'bg-primary' : 'bg-surface-variant'
                    }`}
                  />
                </div>
              </div>
            </section>

            {/* Mood & Wellness Summary (Span 5) */}
            <section className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold text-on-surface">
                    Mood &amp; Wellness Summary
                  </h2>
                  <Smile className="w-5 h-5 text-surface-tint" aria-hidden="true" />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-surface-container-low p-4 rounded-xl">
                    <span className="text-xs text-on-surface-variant block mb-1">Mood / Energy</span>
                    <span className="text-lg font-display font-semibold text-on-surface">
                      {summary?.wellnessSummary.mood ?? summary?.wellnessSummary.energyLevel ?? '—'}
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl">
                    <span className="text-xs text-on-surface-variant block mb-1">Sleep Duration</span>
                    <span className="text-lg font-display font-semibold text-on-surface tabular-nums">
                      {summary?.wellnessSummary.sleepHours != null
                        ? `${summary.wellnessSummary.sleepHours} hrs`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between gap-3">
                <p className="text-xs text-on-surface-variant">
                  {summary?.wellnessSummary.insight ||
                    'Record your daily mood, sleep duration, and stress level in Mood & Wellness.'}
                </p>
                <Link
                  to="/wellness"
                  className="text-xs font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
                >
                  Open
                </Link>
              </div>
            </section>

            {/* Water Intake (Span 4) */}
            <section className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-lg font-semibold text-on-surface">Water Intake</h2>
                  <Droplets className="w-5 h-5 text-secondary" aria-hidden="true" />
                </div>
                <div className="flex items-baseline gap-1.5 my-2 tabular-nums">
                  <span className="text-3xl font-display font-bold text-on-surface">
                    {summary ? waterIntake.toLocaleString() : '0'}
                  </span>
                  <span className="text-sm text-on-surface-variant">
                    / {waterTarget > 0 ? `${waterTarget.toLocaleString()} ml` : '— ml'}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mb-4">
                  {summary
                    ? `${Math.max(0, waterTarget - waterIntake)} ml remaining for today's goal.`
                    : 'Connect backend (GET /api/water) to sync daily hydration.'}
                </p>
              </div>
              <div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{ width: `${waterPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleQuickWater(250)}
                      className="px-3 py-1.5 rounded-lg bg-secondary-fixed text-on-secondary-fixed text-xs font-medium hover:opacity-90 cursor-pointer"
                    >
                      + 250 ml
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleQuickWater(500)}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium cursor-pointer"
                    >
                      + 500 ml
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-secondary tabular-nums">
                    {waterPercent}%
                  </span>
                </div>
              </div>
            </section>

            {/* Recent Symptoms (Span 4) */}
            <section className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-lg font-semibold text-on-surface">
                    Recent PCOS Symptoms
                  </h2>
                  <HeartPulse className="w-5 h-5 text-surface-tint" aria-hidden="true" />
                </div>
                {summary?.latestSymptom ? (
                  <div className="bg-surface-container-low p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-on-surface">
                        {summary.latestSymptom.symptoms.join(', ') || 'Symptom Check-in'}
                      </span>
                      <span className="text-primary font-medium">
                        Severity {summary.latestSymptom.severity}/5
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {summary.latestSymptom.date} · Pain {summary.latestSymptom.painLevel}/10
                    </p>
                    {summary.latestSymptom.observations && (
                      <p className="text-xs text-on-surface-variant line-clamp-2">
                        {summary.latestSymptom.observations}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant py-4">
                    No PCOS symptom records loaded yet. Log symptoms via the PCOS Symptom Tracker.
                  </p>
                )}
              </div>
              <div className="pt-4 flex justify-end">
                <Link
                  to="/pcos-tracker"
                  className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>View Symptoms</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </section>

            {/* Nutrition Summary (Span 4) */}
            <section className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-lg font-semibold text-on-surface">
                    Nutrition Summary
                  </h2>
                  <Utensils className="w-5 h-5 text-tertiary" aria-hidden="true" />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-on-surface-variant">Daily Calories</span>
                      <span className="font-medium text-on-surface tabular-nums">
                        {summary
                          ? `${summary.nutritionSummary.caloriesConsumed} / ${summary.nutritionSummary.caloriesTarget} kcal`
                          : '0 / 0 kcal'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-tertiary rounded-full"
                        style={{
                          width: `${
                            summary && summary.nutritionSummary.caloriesTarget > 0
                              ? Math.min(
                                  100,
                                  Math.round(
                                    (summary.nutritionSummary.caloriesConsumed /
                                      summary.nutritionSummary.caloriesTarget) *
                                      100,
                                  ),
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {summary?.nutritionSummary.sugarStatus
                      ? `Status: ${summary.nutritionSummary.sugarStatus}`
                      : 'Log breakfast, lunch, dinner, and snacks in Nutrition & Diet.'}
                  </p>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Link
                  to="/nutrition"
                  className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Food Diary</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </section>

            {/* Real Cycle Chart (Span 7) */}
            <section className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-on-surface">
                    Historical Cycle Lengths
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Generated directly from your Spring Boot /api/dashboard cycle history
                  </p>
                </div>
                <span className="text-xs font-medium text-on-surface-variant tabular-nums">
                  Avg:{' '}
                  {summary?.cycleSummary.averageCycleLength != null
                    ? `${summary.cycleSummary.averageCycleLength} Days`
                    : '—'}
                </span>
              </div>

              {cycleHistory.length > 0 ? (
                <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2">
                  {cycleHistory.map((item) => {
                    const heightPct = Math.max(20, Math.round((item.lengthDays / maxCycleDays) * 100));
                    return (
                      <div
                        key={item.month}
                        className="flex-1 flex flex-col items-center justify-end h-full gap-1.5"
                      >
                        <span className="text-xs text-on-surface-variant tabular-nums">
                          {item.lengthDays}d
                        </span>
                        <div className="w-full flex-1 flex items-end">
                          <div
                            className="w-full bg-primary/85 rounded-t-lg transition-all"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-on-surface-variant">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyStateCard
                  title="No Cycle Chart Data Yet"
                  description="Once your Spring Boot backend returns cycle history records, your real cycle length bars will render here."
                  endpoint="GET /api/dashboard"
                />
              )}
            </section>

            {/* Recent Journal History (Span 5) */}
            <section className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold text-on-surface">
                    Journal History
                  </h2>
                  <BookOpen className="w-5 h-5 text-surface-tint" aria-hidden="true" />
                </div>

                {summary?.recentJournalEntries && summary.recentJournalEntries.length > 0 ? (
                  <div className="space-y-3">
                    {summary.recentJournalEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-surface-container-low p-3.5 rounded-xl space-y-1"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-sm font-semibold text-on-surface truncate">
                            {entry.title}
                          </span>
                          <span className="text-xs text-on-surface-variant whitespace-nowrap tabular-nums">
                            {entry.entryDate.slice(0, 10)}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant line-clamp-2">
                          {entry.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant py-6">
                    No journal entries loaded yet. Record personal reflections in Health Journal.
                  </p>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <Link
                  to="/journal"
                  className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Journal</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          </div>
        )}
      </div>

      <ToastBanner
        message={toast?.message ?? null}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </AppShell>
  );
}
