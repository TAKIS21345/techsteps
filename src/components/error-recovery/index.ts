// Error Recovery Components Index
// Centralized exports for all error recovery functionality

// Core error recovery utilities
export { errorRecovery } from '../../utils/errorRecovery';
export { errorMessageTranslator } from '../../utils/errorMessages';
export { globalErrorHandler, handleError } from '../../utils/globalErrorHandler';

// React hooks
export { useErrorRecovery } from '../../hooks/useErrorRecovery';
export { useUserFriendlyError } from './UserFriendlyError';
export { useErrorNotifications } from './ErrorNotificationSystem';

// Context and providers
export { 
  ErrorRecoveryProvider, 
  useErrorRecoveryContext, 
  withErrorRecovery,
  ErrorRecoveryBoundary 
} from '../../contexts/ErrorRecoveryContext';

// UI Components
export { UserFriendlyErrorDisplay } from './UserFriendlyError';
export { ErrorNotificationSystem } from './ErrorNotificationSystem';
export { NetworkStatusMonitor } from './NetworkStatusMonitor';
export { SessionRestorePrompt } from './SessionRestorePrompt';

// Fallback components
export {
  OfflineFallback,
  AnimationFallback,
  AIFallback,
  CriticalFailureFallback,
  EmergencySupport,
  SafeMode,
  FallbackWrapper
} from './FallbackStates';

// Types
export type { 
  RetryConfig,
  SessionData,
  QueuedAction,
  RecoveryStrategy 
} from '../../utils/errorRecovery';

export type {
  ErrorSeverity,
  UserFriendlyError,
  ErrorAction,
  ErrorPattern
} from '../../utils/errorMessages';

export type {
  ErrorHandlerOptions,
  ErrorNotification
} from '../../utils/globalErrorHandler';