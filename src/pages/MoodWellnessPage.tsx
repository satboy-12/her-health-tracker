import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BedDouble, CheckCircle2, Smile } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ApiIntegrationBanner } from '../components/ApiIntegrationBanner';
import { EmptyStateCard } from '../components/EmptyStateCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { SafeImage } from '../components/SafeImage';
import { ToastBanner } from '../components/ToastBanner';
import { ApiError } from '../api/client';
import { wellnessService } from '../api/services';
import type { MoodOption, SleepQualityOption, WellnessEntry } from '../types/api';

const MOOD_OPTIONS: Array<{ value: MoodOption; subtitle: string }> = [
  { value: 'Radiant', subtitle: 'Uplifted' },
  { value: 'Calm', subtitle: 'Balanced' },
  { value: 'Fatigued', subtitle: 'Tired' },
  { value: 'Anxious', subtitle: 'Tense' },
  { value: 'Low', subtitle: 'Withdrawn' },
];

const SLEEP_QUALITIES: SleepQualityOption[] = ['Restless', 'Good/Restful', 'Deep/Healing'];

const WELLNESS_BANNER_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDAx9dlJi4CnQzp2WfQAKaEgj74VXYTKO5SfIunB3I1PNKlyEj4pZjiGLQYKh0aUsQaeu6gh4Oa0oLIVSm3qlyq7Wnk-ryfeyrVTXHi8DvI8G4nfG30Tvv-LRdiUbHn1a4Oh_7PPdbLtcMb84Thhu7iYp47UzgUN9V2kS5HJqFykg-EkGHaRu8AzhJQrPiRYFvZGeSR1_PtFVnMXhrPdXhy7EeUIvhu0TlVQLvhWlk';

export function MoodWellnessPage() {
  const todayIso = new Date().toISOString().slice(0, 10);

  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<ApiError | string | null>(null);

  const [date, setDate] = useState(todayIso);
  const [mood, setMood] = useState<MoodOption>('Calm');
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState<SleepQualityOption>('Good/Restful');
  const [stressLevel, setStressLevel] = useState(3);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const loadWellness = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await wellnessService.list();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setEntries([]);
      setApiError(err instanceof ApiError ? err : 'Failed to load wellness entries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWellness();
  }, [loadWellness]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await wellnessService.create({
        date,
        mood,
        sleepHours,
        sleepQuality,
        stressLevel,
        notes: notes.trim(),
      });
      setNotes('');
      setToast({ message: 'Daily wellness check-in saved.', variant: 'success' });
      await loadWellness();
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : 'Unable to save wellness check-in.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const recentSeven = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-7),
    [entries],
  );

  const avgSleep = useMemo(() => {
    if (entries.length === 0) return null;
    const sum = entries.reduce((acc, item) => acc + item.sleepHours, 0);
    return (sum / entries.length).toFixed(1);
  }, [entries]);

  return (
    <AppShell>
      <div className="space-y-6 pb-8">
        {/* Editorial Header */}
        <section className="bg-surface-container-low px-4 sm:px-6 lg:px-8 py-8 border-b border-outline-variant/60">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-surface-tint">
                Wellness Sanctuary
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-on-surface mt-1">
                Mind, Rest &amp; Equilibrium
              </h1>
              <p className="text-sm sm:text-base text-on-surface-variant mt-2 max-w-xl">
                Track daily emotional state, sleep duration, sleep quality, stress index, and daily notes.
              </p>
            </div>
            <div className="text-xs font-medium text-on-surface-variant tabular-nums">
              Logged Check-ins: {entries.length}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <ApiIntegrationBanner
            error={apiError}
            expectedEndpoint="GET /api/wellness"
            onRetry={loadWellness}
            retrying={loading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Logger (7 cols) */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-on-surface">
                    How are you feeling today?
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Select the mood state that mirrors your current energy.
                  </p>
                </div>
                <input
                  type="date"
                  aria-label="Wellness check-in date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant px-3 py-2 rounded-xl text-sm text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {MOOD_OPTIONS.map((opt) => {
                  const active = mood === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMood(opt.value)}
                      className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                        active
                          ? 'bg-primary-container text-on-primary-container border-primary'
                          : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-primary-fixed/30'
                      }`}
                    >
                      <div className="text-sm font-semibold">{opt.value}</div>
                      <div
                        className={`text-xs mt-0.5 ${
                          active ? 'text-on-primary-container/90' : 'text-on-surface-variant'
                        }`}
                      >
                        {opt.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sleep Duration & Quality */}
              <div className="pt-5 border-t border-outline-variant/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-base font-semibold text-on-surface">
                      Rest &amp; Sleep Cycle
                    </h3>
                    <p className="text-xs text-on-surface-variant">Last night&apos;s slumber</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary tabular-nums">
                    <BedDouble className="w-4 h-4" aria-hidden="true" />
                    {sleepHours} hrs
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-2">
                    <div className="flex justify-between text-xs">
                      <label htmlFor="sleep-hours" className="font-medium text-on-surface">
                        Sleep Duration
                      </label>
                      <span className="text-primary font-semibold tabular-nums">
                        {sleepHours} hours
                      </span>
                    </div>
                    <input
                      id="sleep-hours"
                      type="range"
                      min={3}
                      max={12}
                      step={0.5}
                      value={sleepHours}
                      onChange={(e) => setSleepHours(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-2">
                    <span className="block text-xs font-medium text-on-surface">Sleep Quality</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {SLEEP_QUALITIES.map((quality) => (
                        <button
                          key={quality}
                          type="button"
                          onClick={() => setSleepQuality(quality)}
                          className={`py-2 px-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            sleepQuality === quality
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                          }`}
                        >
                          {quality === 'Good/Restful'
                            ? 'Restful'
                            : quality === 'Deep/Healing'
                            ? 'Deep'
                            : 'Restless'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stress Slider */}
              <div className="pt-5 border-t border-outline-variant/60 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <label htmlFor="stress-level" className="font-display text-base font-semibold text-on-surface">
                      Stress Level Index
                    </label>
                    <p className="text-xs text-on-surface-variant">
                      Perceived daytime tension (1 = calm, 10 = intense)
                    </p>
                  </div>
                  <span className="text-base font-semibold text-primary tabular-nums">
                    {stressLevel} / 10
                  </span>
                </div>
                <input
                  id="stress-level"
                  type="range"
                  min={1}
                  max={10}
                  value={stressLevel}
                  onChange={(e) => setStressLevel(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Daily Notes */}
              <div className="pt-5 border-t border-outline-variant/60 space-y-2">
                <label htmlFor="wellness-notes" className="block font-display text-base font-semibold text-on-surface">
                  Daily Notes
                </label>
                <textarea
                  id="wellness-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note triggers, restorative habits, or observations..."
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>{submitting ? 'Saving...' : 'Save Check-In'}</span>
                </button>
              </div>
            </form>

            {/* Right Analytics & History (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-on-surface">
                      Weekly Sleep &amp; Mood Rhythm
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Generated from /api/wellness records
                    </p>
                  </div>
                  <Smile className="w-5 h-5 text-outline" aria-hidden="true" />
                </div>

                {loading ? (
                  <LoadingSkeleton rows={2} />
                ) : recentSeven.length > 0 ? (
                  <div className="bg-surface-container-low rounded-xl p-4 h-44 flex items-end justify-between gap-2">
                    {recentSeven.map((item) => {
                      const heightPct = Math.max(15, Math.min(100, Math.round((item.sleepHours / 10) * 100)));
                      return (
                        <div key={item.id} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                          <span className="text-[10px] font-semibold text-primary tabular-nums">
                            {item.sleepHours}h
                          </span>
                          <div className="w-full flex-1 flex items-end">
                            <div
                              className="w-full bg-primary-container rounded-t"
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-on-surface-variant tabular-nums">
                            {item.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyStateCard
                    title="No Wellness History Yet"
                    description="Submit check-ins to populate your sleep duration and mood trend chart."
                    endpoint="GET /api/wellness"
                  />
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-surface-container-low p-3.5 rounded-xl">
                    <span className="text-xs text-on-surface-variant block">Avg Sleep</span>
                    <span className="font-display text-lg font-semibold text-on-surface tabular-nums">
                      {avgSleep ? `${avgSleep} hrs` : '—'}
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-3.5 rounded-xl">
                    <span className="text-xs text-on-surface-variant block">Latest Mood</span>
                    <span className="font-display text-lg font-semibold text-primary">
                      {entries[0]?.mood ?? '—'}
                    </span>
                  </div>
                </div>
              </section>

              <div className="rounded-xl overflow-hidden border border-outline-variant relative min-h-[160px] flex items-end p-6">
                <SafeImage
                  src={WELLNESS_BANNER_IMAGE}
                  alt="Calm indoor stone and bamboo sanctuary"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="relative z-10 text-white space-y-1">
                  <p className="text-xs font-medium uppercase tracking-widest text-primary-fixed-dim">
                    Restorative Practice
                  </p>
                  <h3 className="font-display text-lg font-semibold">
                    Evening Wind-Down Routine
                  </h3>
                  <p className="text-xs text-white/90">
                    Consistent sleep timing supports hormonal balance and stress recovery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastBanner
        message={toast?.message ?? null}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </AppShell>
  );
}
