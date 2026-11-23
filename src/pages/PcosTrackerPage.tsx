import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BatteryCharging,
  Calendar,
  CheckCircle2,
  HeartPulse,
  Trash2,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ApiIntegrationBanner } from '../components/ApiIntegrationBanner';
import { EmptyStateCard } from '../components/EmptyStateCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ToastBanner } from '../components/ToastBanner';
import { ApiError } from '../api/client';
import { symptomsService } from '../api/services';
import type { PcosSymptomLog } from '../types/api';

const PCOS_SYMPTOMS = [
  'Acne / Skin',
  'Fatigue',
  'Cramping',
  'Hair Growth',
  'Mood Swings',
  'Bloating',
];

const SEVERITY_LABELS: Record<number, string> = {
  1: '1 - Mild',
  2: '2 - Mild+',
  3: '3 - Moderate',
  4: '4 - Severe',
  5: '5 - Extreme',
};

const ENERGY_LABELS: Record<number, string> = {
  1: 'Exhausted',
  2: 'Low',
  3: 'Moderate',
  4: 'Good',
  5: 'Vibrant',
};

export function PcosTrackerPage() {
  const todayIso = new Date().toISOString().slice(0, 10);

  const [logs, setLogs] = useState<PcosSymptomLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<ApiError | string | null>(null);

  const [date, setDate] = useState(todayIso);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Fatigue']);
  const [severity, setSeverity] = useState(3);
  const [painLevel, setPainLevel] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [observations, setObservations] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const loadSymptoms = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await symptomsService.list();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setLogs([]);
      setApiError(err instanceof ApiError ? err : 'Failed to load PCOS symptom logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSymptoms();
  }, [loadSymptoms]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setFormError('Please select a log date.');
      return;
    }
    if (selectedSymptoms.length === 0 && !observations.trim()) {
      setFormError('Select at least one symptom or enter personal observations.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await symptomsService.create({
        date,
        symptoms: selectedSymptoms,
        severity,
        painLevel,
        energyLevel,
        observations: observations.trim(),
      });
      setObservations('');
      setToast({ message: 'Symptom entry saved.', variant: 'success' });
      await loadSymptoms();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Unable to save symptom log.';
      setFormError(msg);
      setToast({ message: msg, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await symptomsService.remove(id);
      setToast({ message: 'Symptom log removed.', variant: 'success' });
      await loadSymptoms();
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : 'Failed to remove symptom log.',
        variant: 'error',
      });
    }
  };

  const frequencyStats = useMemo(() => {
    if (logs.length === 0) return [];
    const counts: Record<string, number> = {};
    for (const log of logs) {
      for (const s of log.symptoms) {
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        percent: Math.round((count / logs.length) * 100),
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 4);
  }, [logs]);

  const chartPoints = useMemo(() => {
    const recent = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
    if (recent.length < 2) return null;
    const stepX = 300 / (recent.length - 1);
    const coords = recent.map((item, idx) => ({
      x: Math.round(idx * stepX),
      y: Math.round(100 - ((item.severity - 1) / 4) * 80 - 10),
      date: item.date,
      severity: item.severity,
    }));
    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    return { coords, linePath };
  }, [logs]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-surface-tint flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4" aria-hidden="true" />
            <span>Endocrine &amp; Systemic Tracking</span>
          </p>
          <h1 className="font-display text-3xl font-semibold text-on-surface mt-1">
            PCOS Symptom Tracker
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Record active symptoms, overall severity, pelvic pain level, energy score, and personal observations to track longitudinal patterns.
          </p>
        </div>

        <ApiIntegrationBanner
          error={apiError}
          expectedEndpoint="GET /api/symptoms"
          onRetry={loadSymptoms}
          retrying={loading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Daily Log Form (7 cols) */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                  <Calendar className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-on-surface">
                    Daily Symptom Entry
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Record today&apos;s status or select a past date
                  </p>
                </div>
              </div>
              <input
                type="date"
                aria-label="Symptom log date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-surface-container-low border border-outline-variant px-3 py-2 rounded-xl text-sm text-on-surface"
              />
            </div>

            {/* Symptom Selection */}
            <div>
              <span className="block text-sm font-medium text-on-surface mb-3">
                Active Symptoms Today
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PCOS_SYMPTOMS.map((symptom) => {
                  const checked = selectedSymptoms.includes(symptom);
                  return (
                    <label
                      key={symptom}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? 'bg-primary-fixed/40 border-primary text-on-surface'
                          : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSymptom(symptom)}
                        className="w-4 h-4 rounded accent-primary"
                      />
                      <span className="text-sm font-medium">{symptom}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Severity Scale 1-5 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-on-surface">
                  Overall Symptom Severity Scale
                </span>
                <span className="text-sm font-semibold text-primary">
                  {SEVERITY_LABELS[severity]}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeverity(level)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      severity === level
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-low text-on-surface hover:bg-primary-fixed/50'
                    }`}
                  >
                    {SEVERITY_LABELS[level]}
                  </button>
                ))}
              </div>
            </div>

            {/* Pain & Energy Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pcos-pain" className="block text-sm font-medium text-on-surface mb-2">
                  Pelvic / Abdominal Pain Level
                </label>
                <div className="flex items-center gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant">
                  <Activity className="w-4 h-4 text-error shrink-0" aria-hidden="true" />
                  <input
                    id="pcos-pain"
                    type="range"
                    min={0}
                    max={10}
                    value={painLevel}
                    onChange={(e) => setPainLevel(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-on-surface w-12 text-right tabular-nums">
                    {painLevel}/10
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="pcos-energy" className="block text-sm font-medium text-on-surface mb-2">
                  Energy Level Score
                </label>
                <div className="flex items-center gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant">
                  <BatteryCharging className="w-4 h-4 text-tertiary shrink-0" aria-hidden="true" />
                  <input
                    id="pcos-energy"
                    type="range"
                    min={1}
                    max={5}
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(Number(e.target.value))}
                    className="w-full accent-tertiary cursor-pointer"
                  />
                  <span className="text-sm font-medium text-on-surface whitespace-nowrap">
                    {ENERGY_LABELS[energyLevel]}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="pcos-notes" className="block text-sm font-medium text-on-surface mb-2">
                Personal Observations &amp; Clinical Notes
              </label>
              <textarea
                id="pcos-notes"
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Note triggers, dietary influences, sleep quality, or medications taken..."
                className="w-full bg-surface-container-low border border-outline-variant p-3 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            {formError && (
              <p className="text-xs text-error" role="alert">
                {formError}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary-container text-on-primary text-sm font-medium px-6 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>{submitting ? 'Saving...' : 'Save Symptom Entry'}</span>
              </button>
            </div>
          </form>

          {/* Right: Trends & History (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-on-surface">
                  Severity Trend
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Plotted strictly from your logged /api/symptoms records
                </p>
              </div>

              {loading ? (
                <LoadingSkeleton rows={2} />
              ) : chartPoints ? (
                <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
                  <svg viewBox="0 0 300 100" className="w-full h-28 overflow-visible">
                    <path
                      d={chartPoints.linePath}
                      fill="none"
                      stroke="#88485e"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {chartPoints.coords.map((pt, idx) => (
                      <circle key={idx} cx={pt.x} cy={pt.y} r="4" fill="#88485e" />
                    ))}
                  </svg>
                  <div className="flex justify-between text-[11px] text-on-surface-variant tabular-nums">
                    <span>{chartPoints.coords[0].date}</span>
                    <span>{chartPoints.coords[chartPoints.coords.length - 1].date}</span>
                  </div>
                </div>
              ) : (
                <EmptyStateCard
                  title="Awaiting Trend History"
                  description="At least 2 symptom logs from GET /api/symptoms are needed to render your severity trend chart."
                  endpoint="GET /api/symptoms"
                />
              )}

              {frequencyStats.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-medium text-on-surface">Most Frequent Symptoms</h3>
                  {frequencyStats.map((stat) => (
                    <div key={stat.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-on-surface">{stat.name}</span>
                        <span className="text-on-surface-variant tabular-nums">
                          {stat.percent}% of logs
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${stat.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Logged Records */}
            <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-3">
              <h2 className="font-display text-lg font-semibold text-on-surface">
                Logged Entries
              </h2>
              {logs.length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  No symptom entries returned from the backend yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {logs.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-surface-container-low rounded-xl p-4 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="text-xs text-primary font-medium tabular-nums">
                          {entry.date} · Severity {entry.severity}/5 · Pain {entry.painLevel}/10
                        </div>
                        <div className="text-sm font-medium text-on-surface">
                          {entry.symptoms.join(', ') || 'Observation Only'}
                        </div>
                        {entry.observations && (
                          <p className="text-xs text-on-surface-variant">{entry.observations}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label={`Delete symptom log from ${entry.date}`}
                        onClick={() => void handleDelete(entry.id)}
                        className="p-1.5 rounded-lg hover:bg-error-container text-error cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
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
