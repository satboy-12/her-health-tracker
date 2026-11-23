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
      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            isDisconnected
              ? 'bg-primary-fixed/60 text-on-primary-fixed'
              : 'bg-error-container text-on-error-container'
          }`}
        >
          {isDisconnected ? (
            <ServerOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-on-surface">
            <span>
              {isDisconnected
                ? 'Spring Boot Backend Not Connected'
                : 'API Request Error'}
            </span>
            <span aria-hidden="true" className="text-outline">
              ·
            </span>
            <code className="font-mono text-xs text-primary">{expectedEndpoint}</code>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
          {isDisconnected && (
            <p className="text-xs text-outline">
              Configured <code className="font-mono">VITE_API_BASE_URL</code>:{' '}
              <span className="font-medium text-on-surface-variant">
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
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
          {retrying ? 'Checking...' : 'Retry Connection'}
        </button>
      )}
    </div>
  );
}
