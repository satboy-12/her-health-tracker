import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastBannerProps {
  message: string | null;
  variant?: 'success' | 'error';
  onDismiss: () => void;
}

export function ToastBanner({
  message,
  variant = 'success',
  onDismiss,
}: ToastBannerProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 right-6 z-50 max-w-sm bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-xl flex items-center gap-3"
    >
      {variant === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-tertiary-fixed shrink-0" aria-hidden="true" />
      ) : (
        <AlertCircle className="w-5 h-5 text-error-container shrink-0" aria-hidden="true" />
      )}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="p-1 rounded hover:bg-white/10 cursor-pointer"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
