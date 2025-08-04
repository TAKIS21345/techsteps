// Session Restore Prompt Component
// Prompts senior users to restore their previous session after interruption

import React, { useState } from 'react';
import { useErrorRecovery } from '../../hooks/useErrorRecovery';
import { Typography } from '../design-system/Typography';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Icon } from '../design-system/Icon';
import { useTranslation } from 'react-i18next';

interface SessionRestorePromptProps {
  onRestore?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const SessionRestorePrompt: React.FC<SessionRestorePromptProps> = ({
  onRestore,
  onDismiss,
  className = ''
}) => {
  const { t } = useTranslation();
  const { hasSessionData, restoreSession, clearSession, isRecovering } = useErrorRecovery();
  const [isRestoring, setIsRestoring] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show if no session data or already dismissed
  if (!hasSessionData || dismissed) {
    return null;
  }

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const success = await restoreSession();
      if (success) {
        onRestore?.();
        setDismissed(true);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDismiss = () => {
    clearSession();
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Card 
      variant="outlined" 
      padding="sm" 
      className={`${className} bg-white shadow-sm border border-gray-200 text-xs`}
    >
      <div className="flex items-center space-x-2">
        <Icon 
          name="RotateCcw" 
          size="sm" 
          color="primary"
          className="shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <Typography variant="body-sm" className="font-medium mb-1 text-xs">
            {t('session.restore_title', 'Previous session found')}
          </Typography>
          
          <div className="flex gap-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRestore}
              disabled={isRestoring || isRecovering}
              loading={isRestoring}
              className="text-xs px-2 py-1 h-6"
            >
              {t('session.restore_button', 'Continue')}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              disabled={isRestoring || isRecovering}
              className="text-xs px-2 py-1 h-6"
            >
              {t('session.start_fresh', 'Dismiss')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SessionRestorePrompt;