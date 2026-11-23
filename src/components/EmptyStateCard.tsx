import React from 'react';
import { Database } from 'lucide-react';

interface EmptyStateCardProps {
  title: string;
  description: string;
  endpoint?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyStateCard({
  title,
  description,
  endpoint,
  actionLabel,
  onAction,
}: EmptyStateCardProps) {
  return (
    <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl p-6 text-center flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
        <Database className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="text-base font-semibold text-on-surface">{title}</h3>
        <p className="text-sm text-on-surface-variant">{description}</p>
        {endpoint && (
          <p className="text-xs text-outline font-mono pt-1">Awaiting API: {endpoint}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-1 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary-container transition-colors cursor-pointer whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
