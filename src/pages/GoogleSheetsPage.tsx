import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FolderPlus,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyStateCard } from '../components/EmptyStateCard';
import {
  createHealthWorkbook,
  getSpreadsheetMeta,
  listUserSpreadsheets,
  readSheetValues,
  syncHealthDataToSpreadsheet,
  WorkspaceApiError,
  type DriveSpreadsheetFile,
  type SpreadsheetMetadata,
} from '../api/googleSheetsService';
import {
  journalService,
  nutritionService,
  periodsService,
  symptomsService,
  waterService,
  wellnessService,
} from '../api/services';
import { useAuth } from '../context/AuthContext';

export function GoogleSheetsPage() {
  const { user } = useAuth();
  const [workspaceToken, setWorkspaceToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('hhj_sheets_access_token');
    } catch {
      return null;
    }
  });

  const clearWorkspaceToken = useCallback(() => {
    try {
      sessionStorage.removeItem('hhj_sheets_access_token');
    } catch {
      // Ignore storage errors
    }
    setWorkspaceToken(null);
  }, []);

  const [spreadsheets, setSpreadsheets] = useState<DriveSpreadsheetFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [meta, setMeta] = useState<SpreadsheetMetadata | null>(null);
  const [activeTabTitle, setActiveTabTitle] = useState<string>('');
  const [rows, setRows] = useState<string[][]>([]);

  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<
    | { type: 'create' }
    | { type: 'sync'; spreadsheetId: string; spreadsheetTitle: string }
    | null
  >(null);

  const handleWorkspaceError = useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof WorkspaceApiError && (err.status === 401 || err.status === 403)) {
        clearWorkspaceToken();
        setErrorMsg(
          'Your Google Sheets session expired or lacks permission. Please sign in with Google again to reconnect.',
        );
        return;
      }
      setErrorMsg(err instanceof Error ? err.message : fallback);
    },
    [clearWorkspaceToken],
  );

  const loadFiles = useCallback(async () => {
    if (!workspaceToken) return;
    setLoadingFiles(true);
    setErrorMsg(null);
    try {
      const files = await listUserSpreadsheets(workspaceToken);
      setSpreadsheets(files);
      if (files.length > 0) {
        setSelectedFileId((prev) => (prev && files.some((f) => f.id === prev) ? prev : files[0].id));
      } else {
        setSelectedFileId(null);
        setMeta(null);
        setRows([]);
      }
    } catch (err) {
      handleWorkspaceError(err, 'Unable to load Google Sheets from Google Drive.');
    } finally {
      setLoadingFiles(false);
    }
  }, [workspaceToken, handleWorkspaceError]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const loadSheetDetails = useCallback(
    async (spreadsheetId: string, preferredTab?: string) => {
      if (!workspaceToken) return;
      setLoadingSheet(true);
      setErrorMsg(null);
      try {
        const nextMeta = await getSpreadsheetMeta(workspaceToken, spreadsheetId);
        setMeta(nextMeta);
        const firstTab = nextMeta.sheets[0]?.title || '';
        const targetTab =
          preferredTab && nextMeta.sheets.some((s) => s.title === preferredTab)
            ? preferredTab
            : firstTab;
        setActiveTabTitle(targetTab);

        if (targetTab) {
          const values = await readSheetValues(workspaceToken, spreadsheetId, targetTab);
          setRows(values);
        } else {
          setRows([]);
        }
      } catch (err) {
        handleWorkspaceError(err, 'Unable to read spreadsheet tabs.');
      } finally {
        setLoadingSheet(false);
      }
    },
    [workspaceToken, handleWorkspaceError],
  );

  useEffect(() => {
    if (workspaceToken && selectedFileId) {
      void loadSheetDetails(selectedFileId);
    }
  }, [workspaceToken, selectedFileId, loadSheetDetails]);

  const handleSelectTab = async (tabTitle: string) => {
    if (!workspaceToken || !selectedFileId) return;
    setActiveTabTitle(tabTitle);
    setLoadingSheet(true);
    setErrorMsg(null);
    try {
      const values = await readSheetValues(workspaceToken, selectedFileId, tabTitle);
      setRows(values);
    } catch (err) {
      handleWorkspaceError(err, `Unable to read tab "${tabTitle}".`);
    } finally {
      setLoadingSheet(false);
    }
  };

  const handleAuthorizeGoogle = async () => {
    const enteredToken = window.prompt(
      'Enter a Google OAuth Access Token with drive.file / spreadsheets scope:',
    );
    if (!enteredToken || !enteredToken.trim()) return;
    setAuthBusy(true);
    setErrorMsg(null);
    setStatusBanner(null);
    try {
      const clean = enteredToken.trim();
      sessionStorage.setItem('hhj_sheets_access_token', clean);
      setWorkspaceToken(clean);
      setStatusBanner('Connected to Google Drive and Google Sheets.');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to store Google Sheets token.',
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const gatherHealthSyncPayload = async () => {
    const [periods, symptoms, wellness, nutrition, water, journal] = await Promise.all([
      periodsService.list(),
      symptomsService.list(),
      wellnessService.list(),
      nutritionService.getSummary(),
      waterService.getStatus(),
      journalService.list(),
    ]);
    return {
      periods,
      symptoms,
      wellness,
      meals: nutrition.meals,
      waterEntries: water.entries,
      journal,
    };
  };

  const handleConfirmExecute = async () => {
    if (!confirmAction || !workspaceToken) return;
    setActionBusy(true);
    setErrorMsg(null);
    setStatusBanner(null);
    try {
      if (confirmAction.type === 'create') {
        const created = await createHealthWorkbook(workspaceToken);
        const payload = await gatherHealthSyncPayload();
        const synced = await syncHealthDataToSpreadsheet(
          workspaceToken,
          created.spreadsheetId,
          payload,
        );
        await loadFiles();
        setSelectedFileId(created.spreadsheetId);
        await loadSheetDetails(created.spreadsheetId, 'Periods');
        setStatusBanner(
          `Created "${created.title}" and synced ${synced.updatedCells} cells across ${synced.updatedSheets} tabs.`,
        );
      } else {
        const payload = await gatherHealthSyncPayload();
        const synced = await syncHealthDataToSpreadsheet(
          workspaceToken,
          confirmAction.spreadsheetId,
          payload,
        );
        await loadSheetDetails(confirmAction.spreadsheetId, activeTabTitle || 'Periods');
        setStatusBanner(
          `Synced ${synced.updatedCells} cells across ${synced.updatedSheets} tabs into "${confirmAction.spreadsheetTitle}".`,
        );
      }
      setConfirmAction(null);
    } catch (err) {
      handleWorkspaceError(err, 'Google Sheets write operation failed.');
      setConfirmAction(null);
    } finally {
      setActionBusy(false);
    }
  };

  const headers = rows.length > 0 ? rows[0] : [];
  const bodyRows = rows.length > 1 ? rows.slice(1) : [];

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="hhj-eyebrow">Workspace Sync</p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[var(--ink)] mt-0.5">
            Google Sheets Health Workbook
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Browse your Google Sheets and export your Periods, PCOS, Mood, Nutrition, Water, and Journal logs.
          </p>
        </div>

        {workspaceToken && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void loadFiles()}
              disabled={loadingFiles || actionBusy}
              className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-[12px] border border-[var(--line)] bg-[var(--glass-strong)] hover:bg-[var(--surface)] text-sm font-semibold text-[var(--ink)] transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction({ type: 'create' })}
              disabled={actionBusy}
              className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-[12px] hhj-btn-primary text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <FolderPlus className="w-4 h-4" aria-hidden="true" />
              <span>Create Health Workbook</span>
            </button>
          </div>
        )}
      </div>

      {statusBanner && (
        <div
          role="status"
          className="hhj-glass rounded-[16px] px-4 py-3 flex items-center gap-2.5 text-sm font-medium text-[var(--good)]"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{statusBanner}</span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="rounded-[16px] border border-[var(--bad)]/40 bg-[var(--bad-soft)] px-4 py-3 text-sm text-[var(--bad)] font-medium"
        >
          {errorMsg}
        </div>
      )}

      {!workspaceToken ? (
        <section className="hhj-card p-5 sm:p-7 flex flex-col items-start gap-5 max-w-2xl">
          <div className="w-12 h-12 rounded-[14px] grid place-items-center bg-[var(--plum-soft)] text-[var(--plum)]">
            <FileSpreadsheet className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-xl text-[var(--ink)]">
              Connect Google Sheets &amp; Drive
            </h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Authorize your Google account to browse your existing spreadsheets, inspect sheet tabs, create a structured 6-tab Her Health Journey workbook, and sync your personal health logs directly to Google Sheets.
            </p>
            <p className="text-xs text-[var(--muted)] flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4 text-[var(--good)] shrink-0" aria-hidden="true" />
              <span>
                Access tokens remain strictly in browser memory for your current session and are never stored in browser storage.
              </span>
            </p>
          </div>

          <div className="w-full max-w-[280px]">
            <button
              type="button"
              onClick={() => void handleAuthorizeGoogle()}
              disabled={authBusy}
              className="primary-button min-h-[44px] px-6 py-2.5 flex items-center justify-center gap-2 cursor-pointer w-full text-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#C5A66B]" />
              <span>{authBusy ? 'Connecting...' : 'Connect Sheets Access Token'}</span>
            </button>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
          {/* Drive Spreadsheets List */}
          <aside className="hhj-card p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display font-bold text-base text-[var(--ink)]">
                Your Spreadsheets
              </h2>
              <span className="text-xs font-semibold text-[var(--muted)] tabular-nums">
                {spreadsheets.length} found
              </span>
            </div>

            {loadingFiles ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-[12px] bg-[var(--surface2)] animate-pulse"
                  />
                ))}
              </div>
            ) : spreadsheets.length === 0 ? (
              <EmptyStateCard
                title="No spreadsheets found"
                description="Create a new Her Health Journey workbook in your Google Drive to start syncing."
                actionLabel="Create Health Workbook"
                onAction={() => setConfirmAction({ type: 'create' })}
              />
            ) : (
              <ul className="space-y-1.5 max-h-[420px] overflow-y-auto pr-0.5">
                {spreadsheets.map((file) => {
                  const active = file.id === selectedFileId;
                  return (
                    <li key={file.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedFileId(file.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-[12px] border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[var(--plum-soft)] border-[var(--plum)]/40 text-[var(--ink)]'
                            : 'bg-[var(--surface)]/60 border-transparent hover:bg-[var(--surface2)] text-[var(--ink)]'
                        }`}
                      >
                        <p className="text-sm font-semibold truncate">{file.name}</p>
                        {file.modifiedTime && (
                          <p className="text-[0.74rem] text-[var(--muted)] mt-0.5 tabular-nums">
                            Updated {new Date(file.modifiedTime).toLocaleDateString()}
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Active Spreadsheet Preview & Sync */}
          <section className="hhj-card p-4 sm:p-5 lg:p-6 flex flex-col gap-4 min-w-0">
            {!selectedFileId || !meta ? (
              <EmptyStateCard
                title="Select a spreadsheet"
                description="Choose a Google Sheet from the list or create a dedicated 6-tab health workbook."
              />
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
                  <div className="min-w-0">
                    <h2 className="font-display font-bold text-xl text-[var(--ink)] truncate">
                      {meta.title}
                    </h2>
                    <a
                      href={meta.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--plum)] hover:underline mt-0.5"
                    >
                      <span>Open in Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({
                        type: 'sync',
                        spreadsheetId: meta.spreadsheetId,
                        spreadsheetTitle: meta.title,
                      })
                    }
                    disabled={actionBusy}
                    className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-[12px] hhj-btn-primary text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
                  >
                    <UploadCloud className="w-4 h-4" aria-hidden="true" />
                    <span>Sync My Health Logs</span>
                  </button>
                </div>

                {/* Dynamic Sheet Tabs */}
                <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Spreadsheet tabs">
                  {meta.sheets.map((tab) => {
                    const selected = tab.title === activeTabTitle;
                    return (
                      <button
                        key={tab.sheetId}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => void handleSelectTab(tab.title)}
                        className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          selected
                            ? 'bg-[var(--plum)] text-[var(--plum-ink)]'
                            : 'bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {tab.title}
                      </button>
                    );
                  })}
                </div>

                {/* Sheet Data Grid */}
                {loadingSheet ? (
                  <div className="h-48 rounded-[14px] bg-[var(--surface2)] animate-pulse" />
                ) : rows.length === 0 ? (
                  <EmptyStateCard
                    title={`"${activeTabTitle}" has no rows yet`}
                    description='Click "Sync My Health Logs" above to populate the six health tracker tabs with your records.'
                  />
                ) : (
                  <div className="overflow-x-auto rounded-[14px] border border-[var(--line)] bg-[var(--surface)]/80">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-[var(--surface2)]/80 border-b border-[var(--line)]">
                          {headers.map((h, i) => (
                            <th
                              key={i}
                              className="px-3 py-2.5 font-display font-bold text-[var(--ink)] whitespace-nowrap"
                            >
                              {h || `Col ${i + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bodyRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={Math.max(headers.length, 1)}
                              className="px-3 py-6 text-center text-[var(--muted)]"
                            >
                              Headers present — no data rows logged in this tab yet.
                            </td>
                          </tr>
                        ) : (
                          bodyRows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--surface2)]/40"
                            >
                              {headers.map((_, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="px-3 py-2 text-[var(--ink)] tabular-nums whitespace-nowrap max-w-[260px] truncate"
                                >
                                  {row[cIdx] ?? ''}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={
          confirmAction?.type === 'create'
            ? 'Create New Health Workbook in Google Sheets?'
            : `Sync Health Logs to "${confirmAction?.spreadsheetTitle}"?`
        }
        description={
          confirmAction?.type === 'create'
            ? 'This will create a new spreadsheet titled "Her Health Journey — Wellness Log" in your Google Drive and write your current records across 6 tabs: Periods, PCOS_Symptoms, Mood_Sleep, Nutrition, Water, and Journal.'
            : `This will clear and overwrite ranges A1:K1000 on the 6 health tabs (Periods, PCOS_Symptoms, Mood_Sleep, Nutrition, Water, Journal) inside "${confirmAction?.spreadsheetTitle}" with your current logged data.`
        }
        confirmLabel={confirmAction?.type === 'create' ? 'Create & Sync Workbook' : 'Confirm Sync'}
        busy={actionBusy}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleConfirmExecute()}
      />
    </AppShell>
  );
}
