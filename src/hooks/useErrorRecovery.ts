// React hook for integrating error recovery framework
import React, { useEffect, useState, useCallback } from 'react';
import { errorRecovery, RetryConfig } from '../utils/errorRecovery';
import { ErrorContext } from '../types/core';

export interface UseErrorRecoveryOptions {
  autoRestore?: boolean;
  preserveProgress?: boolean;
  progressKey?: string;
}

export interface ErrorRecoveryState {
  isRecovering: boolean;
  hasSessionData: boolean;
  queuedActionCount: number;
  isOffline: boolean;
  lastError: Error | null;
}

export function useErrorRecovery(options: UseErrorRecoveryOptions = {}) {
  const {
    autoRestore = true,
    preserveProgress = true,
    progressKey = 'default'
  } = options;

  const [state, setState] = useState<ErrorRecoveryState>({
    isRecovering: false,
    hasSessionData: errorRecovery.hasSessionData(),
    queuedActionCount: errorRecovery.getQueuedActionCount(),
    isOffline: errorRecovery.isOffline(),
    lastError: null
  });

  // Update state when online/offline status changes
  useEffect(() => {
    const updateOnlineStatus = () => {
      setState(prev => ({
        ...prev,
        isOffline: errorRecovery.isOffline(),
        queuedActionCount: errorRecovery.getQueuedActionCount()
      }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Auto-restore session on mount if enabled
  useEffect(() => {
    if (autoRestore && state.hasSessionData) {
      restoreSession();
    }
  }, [autoRestore, state.hasSessionData]);

  // Retry function with exponential backoff
  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> => {
    setState(prev => ({ ...prev, isRecovering: true }));
    
    try {
      const result = await errorRecovery.retryWithBackoff(operation, config);
      setState(prev => ({ ...prev, isRecovering: false, lastError: null }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isRecovering: false, 
        lastError: error as Error 
      }));
      throw error;
    }
  }, []);

  // Attempt error recovery
  const attemptRecovery = useCallback(async (
    error: Error, 
    context: ErrorContext
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isRecovering: true, lastError: error }));
    
    try {
      const success = await errorRecovery.attemptRecovery(error, context);
      setState(prev => ({ 
        ...prev, 
        isRecovering: false,
        lastError: success ? null : error
      }));
      return success;
    } catch (recoveryError) {
      setState(prev => ({ 
        ...prev, 
        isRecovering: false,
        lastError: recoveryError as Error
      }));
      return false;
    }
  }, []);

  // Queue action for offline processing
  const queueAction = useCallback((
    type: string, 
    payload: any, 
    maxRetries?: number
  ) => {
    errorRecovery.queueAction(type, payload, maxRetries);
    setState(prev => ({
      ...prev,
      queuedActionCount: errorRecovery.getQueuedActionCount()
    }));
  }, []);

  // Save current progress
  const saveProgress = useCallback((data: any, key?: string) => {
    if (preserveProgress) {
      errorRecovery.preserveProgress(key || progressKey, data);
    }
  }, [preserveProgress, progressKey]);

  // Restore saved progress
  const restoreProgress = useCallback((key?: string) => {
    if (preserveProgress) {
      return errorRecovery.restoreProgress(key || progressKey);
    }
    return null;
  }, [preserveProgress, progressKey]);

  // Restore session data
  const restoreSession = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isRecovering: true }));
    
    try {
      const success = await errorRecovery.restoreSession();
      setState(prev => ({ 
        ...prev, 
        isRecovering: false,
        hasSessionData: errorRecovery.hasSessionData()
      }));
      return success;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isRecovering: false,
        lastError: error as Error
      }));
      return false;
    }
  }, []);

  // Clear session data
  const clearSession = useCallback(() => {
    errorRecovery.clearSessionData();
    setState(prev => ({
      ...prev,
      hasSessionData: false
    }));
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, lastError: null }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    retryOperation,
    attemptRecovery,
    queueAction,
    saveProgress,
    restoreProgress,
    restoreSession,
    clearSession,
    clearError
  };
}

// Higher-order component for automatic error recovery
export function withErrorRecovery<P extends object>(
  Component: React.ComponentType<P>,
  options: UseErrorRecoveryOptions = {}
) {
  return function ErrorRecoveryWrapper(props: P) {
    const recovery = useErrorRecovery(options);
    
    return React.createElement(Component, {
      ...props,
      errorRecovery: recovery
    } as P & { errorRecovery: any });
  };
}

// Error boundary with recovery capabilities
export function ErrorRecoveryBoundary({ 
  children, 
  fallback: Fallback,
  onError
}: {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ 
    error: Error; 
    resetError: () => void;
    recovery: ReturnType<typeof useErrorRecovery>;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  const recovery = useErrorRecovery();
  
  return React.createElement(
    ErrorBoundaryWithRecovery,
    {
      fallback: Fallback,
      onError: onError,
      recovery: recovery
    },
    children
  );
}

// Internal error boundary component
class ErrorBoundaryWithRecovery extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ComponentType<any>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    recovery: ReturnType<typeof useErrorRecovery>;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Attempt automatic recovery
    this.props.recovery.attemptRecovery(error, {
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      actions: ['component_error'],
      state: { componentStack: errorInfo.componentStack }
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
    this.props.recovery.clearError();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return React.createElement(FallbackComponent, {
          error: this.state.error,
          resetError: this.resetError,
          recovery: this.props.recovery
        });
      }

      // Default fallback
      return React.createElement('div', 
        { className: 'error-recovery-fallback' },
        React.createElement('h2', null, 'Something went wrong'),
        React.createElement('button', { onClick: this.resetError }, 'Try again')
      );
    }

    return this.props.children;
  }
}

export default useErrorRecovery;