import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSkeleton } from './LoadingSkeleton';

/**
 * Strict Login-Based Module Access Guard:
 * Only authenticated users can access the dashboard and health modules.
 * Unauthenticated visitors are immediately redirected to /login with state preservation.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authReady, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-8 max-w-4xl mx-auto flex items-center justify-center">
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
