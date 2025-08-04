import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingState } from '../../../hooks/useOnboardingState';
import { Button } from '../../design-system/Button';
import { Typography } from '../../design-system/Typography';

interface PrimaryConcernsStepProps {
  data: any;
  updateData: (updates: any) => void;
}

export const PrimaryConcernsStep: React.FC<PrimaryConcernsStepProps> = ({ data, updateData }) => {
  const { t } = useTranslation();
  const { warnings } = useOnboardingState({ stepIndex: 4 });

  const concerns = [
    'onlineSafety',
    'passwordManagement',
    'videoCalling',
    'socialMedia',
    'onlineBanking',
    'emailMessaging',
    'photoStorage',
    'appDownloads',
    'wifiInternet',
    'deviceSettings',
    'onlineShopping',
    'healthApps'
  ];

  const selectedConcerns = data.primaryConcerns || [];

  const handleConcernToggle = (concern: string) => {
    const concernKey = `onboarding.step5.concerns.${concern}`;
    const newConcerns = selectedConcerns.includes(concernKey)
      ? selectedConcerns.filter((c: string) => c !== concernKey)
      : [...selectedConcerns, concernKey];
    
    updateData({ primaryConcerns: newConcerns });
  };

  return (
    <div className="space-y-4" data-testid="primary-concerns-step">
      <div className="grid grid-cols-1 gap-3">
        {concerns.map((concern) => (
          <Button
            key={concern}
            variant={selectedConcerns.includes(`onboarding.step5.concerns.${concern}`) ? 'primary' : 'outline'}
            size="lg"
            onClick={() => handleConcernToggle(concern)}
            className="w-full p-4 text-left justify-start"
            data-testid={`concern-option-${concern}`}
          >
            <Typography variant="body">
              {t(`onboarding.step5.concerns.${concern}`)}
            </Typography>
          </Button>
        ))}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
          {warnings.map((warning, index) => (
            <Typography key={index} variant="body-sm" className="text-amber-700">
              {warning}
            </Typography>
          ))}
        </div>
      )}
    </div>
  );
};