import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ApiIntegrationBanner } from '../components/ApiIntegrationBanner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyStateCard } from '../components/EmptyStateCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ToastBanner } from '../components/ToastBanner';
import { ApiError } from '../api/client';
import { periodsService } from '../api/services';
import type { PeriodRecord } from '../types/api';
import { calculatePeriodEstimate, diffDaysInclusive } from '../utils/healthCalculations';
import { validatePeriodDates } from '../utils/validation';

const PERIOD_SYMPTOMS = ['Cramps', 'Headaches', 'Fatigue', 'Bloating', 'Tender Breasts'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toIsoDate(year: number, monthZeroIdx: number, day: number): string {
  const m = String(monthZeroIdx + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function PeriodTrackerPage() {
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);

  const [periods, setPeriods] = useState<PeriodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<ApiError | string | null>(null);

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // Form state (create or edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(todayIso);
  const [flowIntensity, setFlowIntensity] = useState<PeriodRecord['flowIntensity']>('Moderate');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PeriodRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const loadPeriods = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await periodsService.list();
      setPeriods(Array.isArray(data) ? data : []);
    } catch (err) {
      setPeriods([]);
      setApiError(err instanceof ApiError ? err : 'Failed to load period records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPeriods();
  }, [loadPeriods]);

  const estimate = useMemo(
    () => calculatePeriodEstimate(periods, todayIso),
    [periods, todayIso],
  );

  const calendarCells = useMemo(() => {
    const firstDay = new Date(Date.UTC(viewYear, viewMonth, 1));
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
    // Monday-indexed offset (0 = Mon ... 6 = Sun)
    const offset = (firstDay.getUTCDay() + 6) % 7;

    const cells: Array<{ day: number | null; iso: string | null }> = [];
    for (let i = 0; i < offset; i += 1) {
      cells.push({ day: null, iso: null });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push({ day: d, iso: toIsoDate(viewYear, viewMonth, d) });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, iso: null });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(viewYear, viewMonth, 1)));

  const changeMonth = (delta: number) => {
    const next = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    setViewYear(next.getUTCFullYear());
    setViewMonth(next.getUTCMonth());
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom],
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setStartDate(todayIso);
    setEndDate(todayIso);
    setFlowIntensity('Moderate');
    setSelectedSymptoms([]);
    setNotes('');
    setFormError(null);
  };

  const handleEdit = (record: PeriodRecord) => {
    setEditingId(record.id);
    setStartDate(record.startDate);
    setEndDate(record.endDate);
    setFlowIntensity(record.flowIntensity);
    setSelectedSymptoms(record.symptoms ?? []);
    setNotes(record.notes ?? '');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErr = validatePeriodDates(startDate, endDate);
    setFormError(validationErr);
    if (validationErr) return;

    setSubmitting(true);
    try {
      const payload = {
        startDate,
        endDate,
        flowIntensity,
        symptoms: selectedSymptoms,
        notes: notes.trim() || undefined,
      };
      if (editingId) {
        await periodsService.update(editingId, payload);
        setToast({ message: 'Period record updated.', variant: 'success' });
      } else {
        await periodsService.create(payload);
        setToast({ message: 'Period dates saved.', variant: 'success' });
      }
      resetForm();
      await loadPeriods();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Unable to save period entry. Verify Spring Boot backend connection.';
      setFormError(msg);
      setToast({ message: msg, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await periodsService.remove(deleteTarget.id);
      setToast({ message: 'Period entry deleted.', variant: 'success' });
      setDeleteTarget(null);
      await loadPeriods();
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : 'Unable to delete period entry.',
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-surface-tint flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" aria-hidden="true" />
              <span>Cycle Intelligence</span>
            </p>
            <h1 className="font-display text-3xl font-semibold text-on-surface mt-1">
              Period &amp; Cycle Tracker
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Record period start and end dates, inspect cycle history, and view approximate estimates derived from your logged cycles.
            </p>
          </div>
        </div>

        <ApiIntegrationBanner
          error={apiError}
          expectedEndpoint="GET /api/periods"
          onRetry={loadPeriods}
          retrying={loading}
        />

        {/* Cycle Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Avg. Cycle Length
            </span>
            <div className="mt-2 flex items-baseline gap-1.5 tabular-nums">
              <span className="font-display text-2xl font-semibold text-on-surface">
                {estimate?.averageCycleLength ?? '—'}
              </span>
              {estimate?.averageCycleLength != null && (
                <span className="text-sm text-on-surface-variant">days</span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              {periods.length >= 2
                ? `Computed across ${periods.length} logged cycles`
                : 'Needs at least 2 logged cycles'}
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Regularity Score
            </span>
            <div className="mt-2 flex items-baseline gap-1.5 tabular-nums">
              <span className="font-display text-2xl font-semibold text-on-surface">
                {estimate?.regularityScore ?? '—'}
              </span>
              {estimate?.regularityScore != null && (
                <span className="text-sm text-on-surface-variant">/ 100</span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              Derived from cycle length consistency
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Current Phase
            </span>
            <div className="mt-2 font-display text-2xl font-semibold text-on-surface">
              {estimate?.currentPhase ?? '—'}
            </div>
            <p className="text-xs text-on-surface-variant mt-2 tabular-nums">
              {estimate?.currentCycleDay ? `Cycle Day ${estimate.currentCycleDay}` : 'No active cycle logged'}
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Approx. Next Period
            </span>
            <div className="mt-2 font-display text-2xl font-semibold text-primary tabular-nums">
              {estimate?.nextPeriodStart ?? '—'}
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              {estimate
                ? `Fertile window approx. ${estimate.fertileWindowStart}`
                : 'Awaiting historical records'}
            </p>
          </div>
        </div>

        {/* Calendar + Quick Entry Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Calendar (2 cols) */}
          <section className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl font-semibold text-on-surface">{monthLabel}</h2>
                <div className="flex items-center bg-surface-container-low rounded-lg p-1">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => changeMonth(-1)}
                    className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => changeMonth(1)}
                    className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary-container" />
                  Logged Period
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-tertiary-fixed-dim" />
                  Approx. Fertile
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-secondary-fixed" />
                  Approx. Next Period
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-medium text-on-surface-variant uppercase">
              {WEEKDAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((cell, idx) => {
                if (!cell.day || !cell.iso) {
                  return <div key={`empty-${idx}`} className="h-20 rounded-xl bg-surface-container-low/40" />;
                }

                const isLoggedPeriod = periods.some(
                  (p) => cell.iso! >= p.startDate && cell.iso! <= p.endDate,
                );
                const isEstimatedPeriod =
                  !isLoggedPeriod &&
                  estimate &&
                  cell.iso >= estimate.nextPeriodStart &&
                  cell.iso <= estimate.nextPeriodEnd;
                const isFertile =
                  !isLoggedPeriod &&
                  estimate &&
                  cell.iso >= estimate.fertileWindowStart &&
                  cell.iso <= estimate.fertileWindowEnd;
                const isToday = cell.iso === todayIso;

                let cellStyle = 'bg-surface-container-low text-on-surface hover:bg-surface-container';
                let tagText = '';
                if (isLoggedPeriod) {
                  cellStyle = 'bg-primary-container text-on-primary-container';
                  tagText = 'Period';
                } else if (isFertile) {
                  cellStyle = 'bg-tertiary-fixed text-on-tertiary-fixed';
                  tagText = cell.iso === estimate?.ovulationDate ? 'Ovulation' : 'Fertile';
                } else if (isEstimatedPeriod) {
                  cellStyle = 'bg-secondary-fixed text-on-secondary-fixed';
                  tagText = 'Est.';
                }

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => {
                      setStartDate(cell.iso!);
                      setEndDate(cell.iso!);
                    }}
                    className={`h-20 p-2 rounded-xl flex flex-col justify-between text-left transition-colors cursor-pointer ${cellStyle} ${
                      isToday ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <span className="text-xs font-semibold tabular-nums">{cell.day}</span>
                    {tagText && <span className="text-[10px] font-medium truncate">{tagText}</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Log / Edit Form */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-lg font-semibold text-on-surface">
                  {editingId ? 'Edit Cycle Entry' : 'Log Period Dates'}
                </h2>
                <PlusCircle className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <p className="text-xs text-on-surface-variant mb-5">
                Click any date on the calendar or enter dates manually to save via{' '}
                <code className="font-mono">{editingId ? 'PUT /api/periods/:id' : 'POST /api/periods'}</code>.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="period-start" className="block text-xs font-medium text-on-surface-variant mb-1">
                    Period Start Date
                  </label>
                  <input
                    id="period-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label htmlFor="period-end" className="block text-xs font-medium text-on-surface-variant mb-1">
                    Period End Date
                  </label>
                  <input
                    id="period-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label htmlFor="period-flow" className="block text-xs font-medium text-on-surface-variant mb-1">
                    Flow Intensity
                  </label>
                  <select
                    id="period-flow"
                    value={flowIntensity}
                    onChange={(e) => setFlowIntensity(e.target.value as PeriodRecord['flowIntensity'])}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="Spotting">Spotting</option>
                    <option value="Light">Light</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Heavy">Heavy</option>
                  </select>
                </div>

                <div>
                  <span className="block text-xs font-medium text-on-surface-variant mb-2">
                    Associated Symptoms
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PERIOD_SYMPTOMS.map((symptom) => {
                      const active = selectedSymptoms.includes(symptom);
                      return (
                        <button
                          key={symptom}
                          type="button"
                          onClick={() => toggleSymptom(symptom)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            active
                              ? 'bg-primary text-on-primary border-primary'
                              : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container'
                          }`}
                        >
                          {symptom}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="period-notes" className="block text-xs font-medium text-on-surface-variant mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    id="period-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional cycle observations..."
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                {formError && (
                  <p className="text-xs text-error" role="alert">
                    {formError}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-2.5 px-4 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? 'Saving...' : editingId ? 'Update Entry' : 'Save Period Entry'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>
        </div>

        {/* Cycle History Table */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-on-surface">Cycle History</h2>
            <p className="text-xs text-on-surface-variant">
              Create, edit, or delete logged menstrual cycles synced with your Spring Boot database.
            </p>
          </div>

          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : periods.length === 0 ? (
            <EmptyStateCard
              title="No Cycle Records Logged"
              description="Logged period start and end dates from GET /api/periods will appear here with calculated durations and actions."
              endpoint="GET /api/periods"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-medium text-on-surface-variant border-b border-outline-variant">
                    <th className="py-3 px-3">Start Date</th>
                    <th className="py-3 px-3">End Date</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Flow</th>
                    <th className="py-3 px-3">Symptoms</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-outline-variant/60">
                  {periods.map((record) => {
                    const duration = diffDaysInclusive(record.startDate, record.endDate);
                    return (
                      <tr key={record.id} className="hover:bg-surface-container-low/60">
                        <td className="py-3 px-3 font-medium tabular-nums">{record.startDate}</td>
                        <td className="py-3 px-3 tabular-nums">{record.endDate}</td>
                        <td className="py-3 px-3 tabular-nums">{duration} days</td>
                        <td className="py-3 px-3">{record.flowIntensity}</td>
                        <td className="py-3 px-3 text-on-surface-variant">
                          {record.symptoms.length > 0 ? record.symptoms.join(', ') : '—'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              aria-label={`Edit cycle starting ${record.startDate}`}
                              onClick={() => handleEdit(record)}
                              className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete cycle starting ${record.startDate}`}
                              onClick={() => setDeleteTarget(record)}
                              className="p-1.5 rounded-lg hover:bg-error-container text-error cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Period Entry"
        description={
          deleteTarget
            ? `Are you sure you want to delete the cycle from ${deleteTarget.startDate} to ${deleteTarget.endDate}?`
            : ''
        }
        confirmLabel="Delete"
        destructive
        busy={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      <ToastBanner
        message={toast?.message ?? null}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </AppShell>
  );
}
