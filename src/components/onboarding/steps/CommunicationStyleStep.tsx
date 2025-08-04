import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingState } from '../../../hooks/useOnboardingState';
import { Button } from '../../design-system/Button';
import { Typography } from '../../design-system/Typography';

interface CommunicationStyleStepProps {
  data: any;
  updateData: (updates: any) => void;
}

export const CommunicationStyleStep: React.FC<CommunicationStyleStepProps> = ({ data, updateData }) => {
  const { t } = useTranslation();
  const { errors } = useOnboardingState({ stepIndex: 6 });

  const styles = [
    { value: 'simple', label: t('onboarding.step7.simple'), desc: t('onboarding.step7.simpleDesc') },
    { value: 'detailed', label: t('onboarding.step7.detailed'), desc: t('onboarding.step7.detailedDesc') },
    { value: 'visual', label: t('onboarding.step7.visual'), desc: t('onboarding.step7.visualDesc') }
  ];

  const handleStyleSelect = (value: string) => {
    updateData({ communicationStyle: value });
  };

  return (
    <div className="space-y-4" data-testid="communication-style-step">
      {styles.map((style) => (
        <Button
          key={style.value}
          variant={data.communicationStyle === style.value ? 'primary' : 'outline'}
          size="lg"
          onClick={() => handleStyleSelect(style.value)}
          className="w-full p-4 text-left justify-start"
          data-testid={`style-option-${style.value}`}
        >
          <div>
            <Typography variant="body" className="font-medium mb-1">
              {style.label}
            </Typography>
            <Typography variant="body-sm" color="secondary">
              {style.desc}
            </Typography>
          </div>
        </Button>
      ))}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
          {errors.map((error, index) => (
            <Typography key={index} variant="body-sm" className="text-red-700">
              {error}
            </Typography>
          ))}
        </div>
      )}
    </div>
  );
};