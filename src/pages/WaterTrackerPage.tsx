import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Droplets, GlassWater, Plus } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ApiIntegrationBanner } from '../components/ApiIntegrationBanner';
import { EmptyStateCard } from '../components/EmptyStateCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ToastBanner } from '../components/ToastBanner';
import { ApiError } from '../api/client';
import { waterService } from '../api/services';
import type { WaterTrackerResponse } from '../types/api';
import { calculateHydrationMetrics } from '../utils/healthCalculations';

export function WaterTrackerPage() {
  const todayIso = new Date().toISOString().slice(0, 10);

  const [data, setData] = useState<WaterTrackerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<ApiError | string | null>(null);

  const [targetInput, setTargetInput] = useState('2000');
  const [customMl, setCustomMl] = useState('250');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const loadWater = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await waterService.getStatus(todayIso);
      setData(res);
      setTargetInput(String(res.dailyTargetMl));
    } catch (err) {
      setData(null);
      setApiError(err instanceof ApiError ? err : 'Failed to load hydration status.');
    } finally {
      setLoading(false);
    }
  }, [todayIso]);

  useEffect(() => {
    void loadWater();
  }, [loadWater]);

  const totalMl = data?.totalIntakeMl ?? 0;
  const targetMl = data?.dailyTargetMl ?? 0;
  const remindersEnabled = data?.remindersEnabled ?? true;

  const metrics = useMemo(
    () => calculateHydrationMetrics(totalMl, targetMl, 70),
    [totalMl, targetMl],
  );

  const handleAddWater = async (amountMl: number) => {
    if (!Number.isFinite(amountMl) || amountMl <= 0) {
      setToast({ message: 'Enter a valid water amount greater than 0 ml.', variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await waterService.logIntake({ date: todayIso, amountMl });
      setToast({ message: `Logged ${amountMl} ml of water.`, variant: 'success' });
      await loadWater();
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : 'Unable to log water intake.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(targetInput);
    if (!Number.isFinite(parsed) || parsed < 500 || parsed > 6000) {
      setToast({ message: 'Daily target must be between 500 ml and 6,000 ml.', variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await waterService.updatePreferences({ dailyTargetMl: parsed });
      setToast({ message: `Daily water target updated to ${parsed} ml.`, variant: 'success' });
      await loadWater();
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : 'Unable to update daily target.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReminders = async (next: boolean) => {
    setSaving(true);
    try {
      await waterService.updatePreferences({ remindersEnabled: next });
      setToast({
        message: next ? 'Hydration reminders enabled.' : 'Hydration reminders paused.',
        variant: 'success',
      });
      await loadWater();
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : 'Unable to update reminder setting.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const history = data?.weeklyHistory ?? [];
  const maxHistoryMl = Math.max(targetMl, ...history.map((h) => h.totalMl));

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-surface-tint">
            Hydration Management
          </p>
          <h1 className="font-display text-3xl font-semibold text-on-surface mt-1">
            Daily Water Tracker
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Set your daily target, record water intake, and monitor historical hydration records.
          </p>
        </div>

        <ApiIntegrationBanner
          error={apiError}
          expectedEndpoint={`GET /api/water?date=${todayIso}`}
          onRetry={loadWater}
          retrying={loading}
        />

        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Progress Ring Card */}
            <section className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col items-center justify-between gap-6">
              <div className="w-full flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-on-surface">
                  Today&apos;s Progress
                </h2>
                <Droplets className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>

              <div className="relative w-52 h-52 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-surface-container-high"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={metrics.circumference}
                    strokeDashoffset={metrics.strokeDashoffset}
                    className="text-primary transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-display text-3xl font-bold text-on-surface tabular-nums">
                    {totalMl.toLocaleString()}
                  </span>
                  <span className="text-xs text-on-surface-variant tabular-nums">
                    {targetMl > 0 ? `of ${targetMl.toLocaleString()} ml` : 'of — ml'}
                  </span>
                  <span className="text-xs font-semibold text-primary mt-1 tabular-nums">
                    {targetMl > 0 ? `${metrics.percentage}% Completed` : 'Awaiting target'}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-3">
                <span className="block text-xs font-medium text-on-surface-variant text-center">
                  Quick Add Water
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[100, 250, 500, 750].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      disabled={saving}
                      onClick={() => void handleAddWater(amount)}
                      className="bg-surface-container-low hover:bg-surface-container-high border border-outline-variant py-2.5 px-2 rounded-xl text-xs font-medium text-on-surface flex flex-col items-center gap-1 cursor-pointer disabled:opacity-60"
                    >
                      <GlassWater className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span>+{amount} ml</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="number"
                    aria-label="Custom water amount in ml"
                    min={10}
                    max={2000}
                    value={customMl}
                    onChange={(e) => setCustomMl(e.target.value)}
                    className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleAddWater(Number(customMl))}
                    className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Add
                  </button>
                </div>
              </div>
            </section>

            {/* Right Panels */}
            <div className="lg:col-span-7 space-y-6">
              {/* Target Form & Linear Bar */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-on-surface">
                      Daily Water Target
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Customize your daily hydration goal (PUT /api/water)
                    </p>
                  </div>
                  <form onSubmit={handleUpdateTarget} className="flex items-center gap-2">
                    <input
                      type="number"
                      aria-label="Daily water target in ml"
                      min={500}
                      max={6000}
                      step={50}
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      className="w-28 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface tabular-nums"
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                    >
                      Set Target
                    </button>
                  </form>
                </div>

                <div className="w-full bg-surface-container-high h-3.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${metrics.clampedBarPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant tabular-nums">
                  <span>0 ml</span>
                  <span>Target: {targetMl > 0 ? `${targetMl.toLocaleString()} ml` : '—'}</span>
                </div>
              </section>

              {/* Smart Hydration Reminder Toggle */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                    <Bell className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-semibold text-on-surface">
                      Hydration Reminders
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Sync gentle hydration reminder preference with your account.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    aria-label="Enable hydration reminders"
                    checked={remindersEnabled}
                    onChange={(e) => void handleToggleReminders(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </section>

              {/* Historical Records */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-on-surface">
                    Historical Hydration Records
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Weekly daily totals returned from GET /api/water
                  </p>
                </div>

                {history.length > 0 ? (
                  <div className="h-40 flex items-end justify-between gap-2 pt-2">
                    {history.map((item) => {
                      const heightPct = Math.max(12, Math.round((item.totalMl / maxHistoryMl) * 100));
                      return (
                        <div key={item.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                          <span className="text-[10px] text-on-surface-variant tabular-nums">
                            {item.totalMl}
                          </span>
                          <div className="w-full flex-1 flex items-end">
                            <div
                              className="w-full bg-primary/80 rounded-t-md"
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-on-surface-variant">{item.dayLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyStateCard
                    title="No Historical Hydration Records"
                    description="Log water intake with your connected Spring Boot backend to populate your 7-day hydration chart."
                    endpoint="GET /api/water"
                  />
                )}
              </section>
            </div>
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
