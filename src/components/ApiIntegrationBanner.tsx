import React from 'react';
import { AlertCircle, RefreshCw, ServerOff } from 'lucide-react';
import { ApiError, getApiBaseUrl } from '../api/client';

interface ApiIntegrationBannerProps {
  error: ApiError | string | null;
  expectedEndpoint: string;
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

  const isApiError = error instanceof ApiError;
  const isDisconnected = isApiError && error.code === 'BACKEND_UNAVAILABLE';
  const baseUrl = getApiBaseUrl();
  const message = typeof error === 'string' ? error : error.message;

  return (
    <div
      role="status"
      className={`rounded-[14px] px-4 py-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDisconnected
          ? 'bg-[var(--warn-soft)] border-[var(--warn)]/25 text-[var(--ink)]'
          : 'bg-[var(--bad-soft)] border-[var(--bad)]/25 text-[var(--ink)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5 ${
            isDisconnected
              ? 'bg-[var(--surface)] text-[var(--warn)]'
              : 'bg-[var(--surface)] text-[var(--bad)]'
          }`}
        >
          {isDisconnected ? (
            <ServerOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
          )}
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className={isDisconnected ? 'text-[var(--warn)]' : 'text-[var(--bad)]'}>
              {isDisconnected
                ? 'Spring Boot Backend Not Connected'
                : 'API Request Error'}
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-[var(--muted)]">
              ·
            </span>
            <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--surface)]/75 text-[var(--plum)]">
              {expectedEndpoint}
            </code>
          </div>
          <p className="text-[0.9rem] text-[var(--ink)] leading-snug">{message}</p>
          {isDisconnected && (
            <p className="text-xs text-[var(--muted)]">
              Configured <code className="font-mono">VITE_API_BASE_URL</code>:{' '}
              <span className="font-semibold">
                {baseUrl || 'Not set (defaulting to relative /api path)'}
              </span>
              . No placeholder records are displayed as real user data.
            </p>
          )}
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface2)] text-[var(--ink)] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
          {retrying ? 'Checking...' : 'Retry Connection'}
        </button>
      )}
    </div>
  );
}
