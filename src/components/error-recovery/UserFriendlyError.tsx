// User-Friendly Error Display Component
// Shows errors in plain language with clear action steps for senior users

import React, { useState } from 'react';
import { errorMessageTranslator } from '../../utils/errors/errorMessages';
import { Typography } from '../design-system/Typography';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Icon } from '../design-system/Icon';
import { useTranslation } from 'react-i18next';

interface UserFriendlyErrorProps {
  error: Error | string;
  context?: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showTechnicalDetails?: boolean;
}

export const UserFriendlyErrorDisplay: React.FC<UserFriendlyErrorProps> = ({
  error,
  context,
  onRetry,
  onDismiss,
  className = '',
  showTechnicalDetails = false
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const friendlyError = errorMessageTranslator.translateError(error, context);
  const severityColor = errorMessageTranslator.getSeverityColor(friendlyError.severity);
  const iconColor = errorMessageTranslator.getSeverityIconColor(friendlyError.severity);

  const handleActionClick = async (action: any) => {
    if (action.label.toLowerCase().includes('try again') || action.label.toLowerCase().includes('retry')) {
      setIsRetrying(true);
    }

    try {
      await action.action();
      if (onRetry && (action.label.toLowerCase().includes('try again') || action.label.toLowerCase().includes('retry'))) {
        onRetry();
      }
    } catch (actionError) {
      console.error('Error action failed:', actionError);
    } finally {
      setIsRetrying(false);
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'low':
        return t('error.severity.low', 'Minor Issue');
      case 'medium':
        return t('error.severity.medium', 'Issue');
      case 'high':
        return t('error.severity.high', 'Problem');
      case 'critical':
        return t('error.severity.critical', 'Urgent Problem');
      default:
        return t('error.severity.unknown', 'Issue');
    }
  };

  return (
    <Card
      variant="outlined"
      padding="lg"
      className={`${className} ${severityColor} border-l-4`}
    >
      <div className="flex items-start space-x-4">
        <Icon
          name={friendlyError.icon as any}
          size="lg"
          color={iconColor}
          className="shrink-0 mt-1"
        />

        <div className="flex-1 min-w-0">
          {/* Error Header */}
          <div className="flex items-center justify-between mb-2">
            <Typography variant="h4" className="font-semibold">
              {friendlyError.title}
            </Typography>

            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityColor}`}>
                {getSeverityLabel(friendlyError.severity)}
              </span>

              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="p-1"
                  aria-label={t('error.dismiss', 'Dismiss error')}
                >
                  <Icon name="X" size="sm" />
                </Button>
              )}
            </div>
          </div>

          {/* Error Message */}
          <Typography variant="body" className="mb-4 leading-relaxed">
            {friendlyError.message}
          </Typography>

          {/* Action Buttons */}
          {friendlyError.actions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {friendlyError.actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.primary ? 'primary' : 'secondary'}
                  size="lg"
                  onClick={() => handleActionClick(action)}
                  disabled={isRetrying}
                  loading={isRetrying && action.primary}
                  className="sm:w-auto w-full"
                >
                  {action.icon && (
                    <Icon
                      name={action.icon as any}
                      size="sm"
                      className="mr-2"
                    />
                  )}
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Support Contact */}
          {friendlyError.supportContact && (
            <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="HelpCircle" size="sm" color="primary" />
                <Typography variant="body" className="font-medium">
                  {t('error.need_help', 'Need More Help?')}
                </Typography>
              </div>
              <Typography variant="body-sm" className="text-neutral-700">
                {t('error.support_message',
                  'If this problem continues, our support team is here to help. We can walk you through the solution step by step.'
                )}
              </Typography>
            </div>
          )}

          {/* Technical Details (Development/Debug) */}
          {(showTechnicalDetails || process.env.NODE_ENV === 'development') && friendlyError.technicalDetails && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="mb-2"
              >
                <Icon
                  name={showDetails ? 'ChevronUp' : 'ChevronDown'}
                  size="sm"
                  className="mr-1"
                />
                {showDetails ?
                  t('error.hide_details', 'Hide Technical Details') :
                  t('error.show_details', 'Show Technical Details')
                }
              </Button>

              {showDetails && (
                <div className="bg-gray-100 rounded-lg p-3 mt-2">
                  <Typography variant="body-sm" className="font-mono text-gray-700 whitespace-pre-wrap">
                    {friendlyError.technicalDetails}
                  </Typography>
                </div>
              )}
            </div>
          )}

          {/* Helpful Tips */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Typography variant="body-sm" className="text-neutral-600">
              <Icon name="Info" size="sm" className="inline mr-1" />
              {t('error.tip',
                'Tip: If you\'re unsure about any of these steps, don\'t hesitate to ask for help. We\'re here to support you.'
              )}
            </Typography>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Hook for easy error handling in components
export function useUserFriendlyError() {
  const [error, setError] = useState<Error | string | null>(null);
  const [context, setContext] = useState<any>(null);

  const showError = (error: Error | string, context?: any) => {
    setError(error);
    setContext(context);
  };

  const clearError = () => {
    setError(null);
    setContext(null);
  };

  const ErrorComponent = error ? (
    <UserFriendlyErrorDisplay
      error={error}
      context={context}
      onDismiss={clearError}
    />
  ) : null;

  return {
    showError,
    clearError,
    hasError: !!error,
    ErrorComponent
  };
}

export default UserFriendlyErrorDisplay;