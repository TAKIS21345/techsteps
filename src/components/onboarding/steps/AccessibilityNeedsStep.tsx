import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingState } from '../../../hooks/useOnboardingState';
import { Button } from '../../design-system/Button';
import { Typography } from '../../design-system/Typography';

interface AccessibilityNeedsStepProps {
  data: any;
  updateData: (updates: any) => void;
}

export const AccessibilityNeedsStep: React.FC<AccessibilityNeedsStepProps> = ({ data, updateData }) => {
  const { t } = useTranslation();
  const { errors } = useOnboardingState({ stepIndex: 5 });

  const needs = [
    'largerText',
    'highContrast',
    'voiceCommands',
    'screenReader',
    'slowerExplanations',
    'visualSteps',
    'noneNeeded'
  ];

  const selectedNeeds = data.assistiveNeeds || [];

  const handleNeedToggle = (need: string) => {
    const needKey = `onboarding.step6.needs.${need}`;
    const noneNeededKey = `onboarding.step6.needs.noneNeeded`;
    
    let newNeeds = [...selectedNeeds];
    
    if (needKey === noneNeededKey) {
      newNeeds = newNeeds.includes(needKey) ? [] : [needKey];
    } else {
      if (newNeeds.includes(needKey)) {
        newNeeds = newNeeds.filter((n: string) => n !== needKey);
      } else {
        newNeeds = [...newNeeds.filter((n: string) => n !== noneNeededKey), needKey];
      }
    }
    
    updateData({ assistiveNeeds: newNeeds });
  };

  return (
    <div className="space-y-4" data-testid="accessibility-needs-step">
      <div className="grid grid-cols-1 gap-3">
        {needs.map((need) => (
          <Button
            key={need}
            variant={selectedNeeds.includes(`onboarding.step6.needs.${need}`) ? 'primary' : 'outline'}
            size="lg"
            onClick={() => handleNeedToggle(need)}
            className="w-full p-4 text-left justify-start"
            data-testid={`need-option-${need}`}
          >
            <Typography variant="body">
              {t(`onboarding.step6.needs.${need}`)}
            </Typography>
          </Button>
        ))}
      </div>

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