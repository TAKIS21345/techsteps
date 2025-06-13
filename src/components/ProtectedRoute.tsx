import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresOnboarding?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiresOnboarding = true 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: userLoading } = useUser();

  if (authLoading || userLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiresOnboarding && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;