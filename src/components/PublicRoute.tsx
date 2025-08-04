import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { LoadingSpinner } from './design-system/LoadingSpinner';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: userLoading } = useUser();

  if (authLoading || (user && userLoading)) {
    return <LoadingSpinner />;
  }

  if (user && hasCompletedOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  if (user && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;