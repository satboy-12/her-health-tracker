import React from 'react';
import { Database } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  endpoint?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  endpoint,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="border-[1.5px] border-dashed border-[var(--border-strong)] rounded-[16px] p-6 text-center text-[var(--muted)] flex flex-col items-center justify-center gap-2.5 bg-[var(--bg-secondary)]/55">
      <div className="w-10 h-10 rounded-[12px] bg-[var(--surface2)] flex items-center justify-center text-[var(--plum)]">
        <Database className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="font-display text-base font-bold text-[var(--ink)]">{title}</h3>
        <p className="text-sm text-[var(--muted)]">{description}</p>
        {endpoint && (
          <p className="text-xs text-[var(--muted)] font-mono pt-0.5">Awaiting API · {endpoint}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-1 px-4 py-2 rounded-[12px] hhj-btn-primary text-sm font-semibold cursor-pointer whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
