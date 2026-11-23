import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPreviewMode, enterPreviewMode } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('preview') === '1' && !isAuthenticated && !isPreviewMode) {
      enterPreviewMode();
    }
  }, [location.search, isAuthenticated, isPreviewMode, enterPreviewMode]);

  const params = new URLSearchParams(location.search);
  const hasPreviewQuery = params.get('preview') === '1';

  if (!isAuthenticated && !isPreviewMode && !hasPreviewQuery) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
