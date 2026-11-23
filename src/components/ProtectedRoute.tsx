import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSkeleton } from './LoadingSkeleton';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authReady, isAuthenticated, isPreviewMode, enterPreviewMode } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('preview') === '1' && !isAuthenticated && !isPreviewMode) {
      enterPreviewMode();
    }
  }, [location.search, isAuthenticated, isPreviewMode, enterPreviewMode]);

  const params = new URLSearchParams(location.search);
  const hasPreviewQuery = params.get('preview') === '1';

  if (!authReady && !isPreviewMode && !hasPreviewQuery) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-8 max-w-4xl mx-auto">
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (!isAuthenticated && !isPreviewMode && !hasPreviewQuery) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
