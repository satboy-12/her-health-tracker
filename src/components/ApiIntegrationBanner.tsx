import React from 'react';
import { AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { ApiError } from '../api/client';

interface ApiIntegrationBannerProps {
  error: ApiError | string | null;
  expectedEndpoint?: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export function ApiIntegrationBanner({
  error,
  expectedEndpoint,
  onRetry,
  retrying = false,
}: ApiIntegrationBannerProps) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message;

  return (
    <div
      role="status"
      className="rounded-[14px] px-4 py-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bad-soft)] border-[var(--bad)]/25 text-[var(--ink)]"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5 bg-[var(--surface)] text-[var(--bad)]">
          <AlertCircle className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--bad)]">
            <span>Authentication & Service Notice</span>
            {expectedEndpoint && (
              <>
                <span aria-hidden="true" className="hidden sm:inline text-[var(--muted)]">·</span>
                <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--surface)]/75 text-[var(--plum)]">
                  {expectedEndpoint}
                </code>
              </>
            )}
          </div>
          <p className="text-xs text-[var(--ink)] break-words leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="self-end sm:self-center shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-primary)] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{retrying ? 'Retrying...' : 'Retry'}</span>
        </button>
      )}
    </div>
  );
}
