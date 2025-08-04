// Error Recovery Context Provider
// Provides comprehensive error recovery functionality throughout the app

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useErrorRecovery } from '../hooks/useErrorRecovery';
import { globalErrorHandler, ErrorNotification } from '../utils/globalErrorHandler';
import { ErrorNotificationSystem } from '../components/error-recovery/ErrorNotificationSystem';
import { NetworkStatusMonitor } from '../components/error-recovery/NetworkStatusMonitor';
import { EmergencySupport } from '../components/error-recovery/FallbackStates';

interface ErrorRecoveryContextType {
  // Error state
  hasError: boolean;
  lastError: Error | null;
  isRecovering: boolean;
  
  // Network state
  isOffline: boolean;
  queuedActionCount: number;
  
  // Session state
  hasSessionData: boolean;
  
  // Notifications
  notifications: ErrorNotification[];
  
  // Actions
  showEmergencySupport: (reason?: string) => void;
  hideEmergencySupport: () => void;
  handleError: (error: Error | string, context?: any) => void;
  clearError: () => void;
  retryLastOperation: () => Promise<void>;
  
  // Recovery actions
  restoreSession: () => Promise<boolean>;
  clearSession: () => void;
  queueAction: (type: string, payload: any) => void;
}

const ErrorRecoveryContext = createContext<ErrorRecoveryContextType | undefined>(undefined);

interface ErrorRecoveryProviderProps {
  children: ReactNode;
  enableNotifications?: boolean;
  enableSessionRestore?: boolean;
  enableNetworkMonitor?: boolean;
  maxNotifications?: number;
}

export const ErrorRecoveryProvider: React.FC<ErrorRecoveryProviderProps> = ({
  children,
  enableNotifications = true,
  enableSessionRestore = true,
  enableNetworkMonitor = true,
  maxNotifications = 3
}) => {
  const recovery = useErrorRecovery({
    autoRestore: enableSessionRestore,
    preserveProgress: true
  });

  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState<string>();
  const [lastOperation] = useState<(() => Promise<void>) | null>(null);

  // Subscribe to error notifications
  useEffect(() => {
    if (!enableNotifications) return;

    const unsubscribe = globalErrorHandler.addErrorListener((notification) => {
      setNotifications(prev => {
        const updated = [notification, ...prev];
        return updated.slice(0, maxNotifications);
      });
    });

    // Load existing notifications
    setNotifications(globalErrorHandler.getActiveNotifications().slice(0, maxNotifications));

    return unsubscribe;
  }, [enableNotifications, maxNotifications]);

  // Handle critical errors by showing emergency support
  useEffect(() => {
    const handleCriticalError = (notification: ErrorNotification) => {
      if (notification.error.severity === 'critical') {
        setEmergencyReason(notification.error.title);
        setShowEmergencyModal(true);
      }
    };

    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      handleCriticalError(latestNotification);
    }
  }, [notifications]);

  const showEmergencySupport = (reason?: string) => {
    setEmergencyReason(reason);
    setShowEmergencyModal(true);
  };

  const hideEmergencySupport = () => {
    setShowEmergencyModal(false);
    setEmergencyReason(undefined);
  };

  const handleError = (error: Error | string, context?: any) => {
    globalErrorHandler.handleError(error, {
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      actions: ['context_error'],
      ...context
    });
  };

  const retryLastOperation = async () => {
    if (lastOperation) {
      try {
        await recovery.retryOperation(lastOperation);
      } catch (error) {
        console.error('Retry failed:', error);
        handleError(error as Error, { action: 'retry_failed' });
      }
    }
  };

  const contextValue: ErrorRecoveryContextType = {
    // Error state
    hasError: recovery.lastError !== null,
    lastError: recovery.lastError,
    isRecovering: recovery.isRecovering,
    
    // Network state
    isOffline: recovery.isOffline,
    queuedActionCount: recovery.queuedActionCount,
    
    // Session state
    hasSessionData: recovery.hasSessionData,
    
    // Notifications
    notifications,
    
    // Actions
    showEmergencySupport,
    hideEmergencySupport,
    handleError,
    clearError: recovery.clearError,
    retryLastOperation,
    
    // Recovery actions
    restoreSession: recovery.restoreSession,
    clearSession: recovery.clearSession,
    queueAction: recovery.queueAction
  };

  return (
    <ErrorRecoveryContext.Provider value={contextValue}>
      {children}
      
      {/* Error Notifications - Subtle bottom-left corner */}
      {enableNotifications && (
        <ErrorNotificationSystem 
          maxNotifications={maxNotifications}
          position="bottom-left"
        />
      )}
      

      
      {/* Network Status Monitor */}
      {enableNetworkMonitor && (recovery.isOffline || recovery.queuedActionCount > 0) && (
        <div className="fixed bottom-4 left-4 right-4 z-30">
          <NetworkStatusMonitor showDetails={true} />
        </div>
      )}
      
      {/* Emergency Support Modal */}
      {showEmergencyModal && (
        <EmergencySupport
          reason={emergencyReason}
          onClose={hideEmergencySupport}
        />
      )}
    </ErrorRecoveryContext.Provider>
  );
};

// Hook to use error recovery context
export const useErrorRecoveryContext = (): ErrorRecoveryContextType => {
  const context = useContext(ErrorRecoveryContext);
  if (context === undefined) {
    throw new Error('useErrorRecoveryContext must be used within an ErrorRecoveryProvider');
  }
  return context;
};

// HOC for components that need error recovery
export function withErrorRecovery<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ErrorRecoveryWrappedComponent(props: P) {
    const errorRecovery = useErrorRecoveryContext();
    
    return (
      <Component 
        {...props} 
        errorRecovery={errorRecovery}
      />
    );
  };
}

// Error boundary with recovery integration
export class ErrorRecoveryBoundary extends React.Component<
  {
    children: ReactNode;
    fallback?: React.ComponentType<{
      error: Error;
      resetError: () => void;
      showEmergencySupport: () => void;
    }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
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
    // Log error through global handler
    globalErrorHandler.handleError(error, {
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      actions: ['boundary_error'],
      state: { componentStack: errorInfo.componentStack }
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return (
          <ErrorRecoveryContext.Consumer>
            {(context) => (
              <FallbackComponent
                error={this.state.error!}
                resetError={this.resetError}
                showEmergencySupport={context?.showEmergencySupport || (() => {})}
              />
            )}
          </ErrorRecoveryContext.Consumer>
        );
      }

      // Default fallback with emergency support
      return (
        <ErrorRecoveryContext.Consumer>
          {(context) => (
            <div className="min-h-screen flex items-center justify-center p-4 bg-red-50">
              <div className="max-w-md text-center">
                <h2 className="text-2xl font-bold text-red-800 mb-4">
                  Something went wrong
                </h2>
                <p className="text-red-700 mb-6">
                  We encountered an unexpected problem. Don't worry - your information is safe.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={this.resetError}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => context?.showEmergencySupport('Critical system error')}
                    className="w-full bg-white text-red-600 border border-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
                  >
                    Get Emergency Help
                  </button>
                </div>
              </div>
            </div>
          )}
        </ErrorRecoveryContext.Consumer>
      );
    }

    return this.props.children;
  }
}

export default ErrorRecoveryProvider;