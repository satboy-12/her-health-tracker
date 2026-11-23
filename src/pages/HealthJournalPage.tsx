import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Lock,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ApiIntegrationBanner } from '../components/ApiIntegrationBanner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyStateCard } from '../components/EmptyStateCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ToastBanner } from '../components/ToastBanner';
import { ApiError } from '../api/client';
import { journalService } from '../api/services';
import type { JournalCategory, JournalEntry } from '../types/api';
import { filterJournalEntries } from '../utils/healthCalculations';
import { validateJournalInput } from '../utils/validation';

const CATEGORIES: Array<'All' | JournalCategory> = [
  'All',
  'General Reflection',
  'PCOS Symptom Log',
  'Cycle Tracking',
  'Nutrition & Diet',
  'Mental Wellness',
];

const DAILY_PROMPT =
  'How has your energy level shifted across different phases of your cycle this month, and what self-care adjustments felt most supportive?';

export function HealthJournalPage() {
  const defaultDateTime = new Date().toISOString().slice(0, 16);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<ApiError | string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [entryDate, setEntryDate] = useState(defaultDateTime);
  const [category, setCategory] = useState<JournalCategory>('General Reflection');
  const [content, setContent] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | JournalCategory>('All');
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await journalService.list();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setEntries([]);
      setApiError(err instanceof ApiError ? err : 'Failed to load journal entries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const filteredEntries = useMemo(
    () => filterJournalEntries(entries, searchQuery, categoryFilter),
    [entries, searchQuery, categoryFilter],
  );

  const resetEditor = () => {
    setEditingId(null);
    setTitle('');
    setEntryDate(new Date().toISOString().slice(0, 16));
    setCategory('General Reflection');
    setContent('');
    setFormErrors({});
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setEntryDate(entry.entryDate.slice(0, 16));
    setCategory(entry.category);
    setContent(entry.content);
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateJournalInput({ title, content, entryDate });
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        category,
        entryDate,
      };
      if (editingId) {
        await journalService.update(editingId, payload);
        setToast({ message: 'Journal entry updated.', variant: 'success' });
      } else {
        await journalService.create(payload);
        setToast({ message: 'Journal entry published.', variant: 'success' });
      }
      resetEditor();
      await loadEntries();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Unable to save journal entry.';
      setFormErrors({ submit: msg });
      setToast({ message: msg, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await journalService.remove(deleteTarget.id);
      setToast({ message: 'Journal entry deleted.', variant: 'success' });
      setDeleteTarget(null);
      if (editingId === deleteTarget.id) resetEditor();
      await loadEntries();
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : 'Unable to delete journal entry.',
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
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Private Personal Record</span>
            </p>
            <h1 className="font-display text-3xl font-semibold text-on-surface">Health Journal</h1>
            <p className="text-sm text-on-surface-variant max-w-2xl">
              Create, edit, search, and review date-based entries for symptoms, cycle observations, and reflections.
            </p>
          </div>
          <button
            type="button"
            onClick={resetEditor}
            className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            New Entry
          </button>
        </div>

        <ApiIntegrationBanner
          error={apiError}
          expectedEndpoint="GET /api/journal"
          onRetry={loadEntries}
          retrying={loading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Journal Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <form
              onSubmit={handleSubmit}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />
                  <h2 className="font-display text-lg font-semibold text-on-surface">
                    {editingId ? 'Edit Journal Entry' : 'New Journal Entry'}
                  </h2>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetEditor}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div>
                <label htmlFor="journal-title" className="block text-xs font-medium text-on-surface-variant mb-1">
                  Journal Title
                </label>
                <input
                  id="journal-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Morning check-in & mild cramp observation"
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {formErrors.title && (
                  <p className="text-xs text-error mt-1">{formErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="journal-date" className="block text-xs font-medium text-on-surface-variant mb-1">
                    Date &amp; Time
                  </label>
                  <input
                    id="journal-date"
                    type="datetime-local"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface"
                  />
                  {formErrors.entryDate && (
                    <p className="text-xs text-error mt-1">{formErrors.entryDate}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="journal-category" className="block text-xs font-medium text-on-surface-variant mb-1">
                    Category
                  </label>
                  <select
                    id="journal-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as JournalCategory)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="journal-content" className="block text-xs font-medium text-on-surface-variant mb-1">
                  Reflections &amp; Notes
                </label>
                <textarea
                  id="journal-content"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your clinical notes, reflections, or symptom details here..."
                  className="w-full p-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                {formErrors.content && (
                  <p className="text-xs text-error mt-1">{formErrors.content}</p>
                )}
              </div>

              {formErrors.submit && (
                <p className="text-xs text-error" role="alert">
                  {formErrors.submit}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-on-surface-variant">
                  Saved via {editingId ? 'PUT /api/journal/:id' : 'POST /api/journal'}
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary-container text-on-primary px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Entry' : 'Publish Entry'}
                </button>
              </div>
            </form>

            {/* Reflection Prompt */}
            <div className="bg-secondary-fixed/40 border border-outline-variant rounded-xl p-5 space-y-3">
              <h3 className="font-display text-base font-semibold text-on-surface">
                Reflection Prompt
              </h3>
              <p className="text-sm text-on-surface-variant italic">&ldquo;{DAILY_PROMPT}&rdquo;</p>
              <button
                type="button"
                onClick={() => {
                  if (!title.trim()) setTitle('Cycle & Energy Reflection');
                  setContent((prev) => (prev ? `${prev}\n\n${DAILY_PROMPT}` : `${DAILY_PROMPT}\n\n`));
                }}
                className="text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                Insert prompt into editor
              </button>
            </div>
          </div>

          {/* Right: Search, Filter & Date-Based History (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-outline absolute left-3.5 top-3" aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Search journal entries"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries by title, keyword, or date..."
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => {
                  const active = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                        active
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton rows={3} />
            ) : filteredEntries.length === 0 ? (
              <EmptyStateCard
                title={
                  entries.length === 0
                    ? 'No Journal Entries Yet'
                    : 'No Matching Entries'
                }
                description={
                  entries.length === 0
                    ? 'Entries loaded from GET /api/journal will appear here in chronological order.'
                    : 'Try clearing your search query or switching category filters.'
                }
                endpoint={entries.length === 0 ? 'GET /api/journal' : undefined}
              />
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-primary tabular-nums">
                        {entry.entryDate.replace('T', ' · ')}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Edit journal entry ${entry.title}`}
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete journal entry ${entry.title}`}
                          onClick={() => setDeleteTarget(entry)}
                          className="p-1.5 rounded-lg hover:bg-error-container text-error cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-display text-base font-semibold text-on-surface">
                      {entry.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant line-clamp-3">{entry.content}</p>
                    <div className="pt-1 text-xs text-outline">{entry.category}</div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Journal Entry"
        description={
          deleteTarget
            ? `Permanently delete "${deleteTarget.title}"? This action cannot be undone.`
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
