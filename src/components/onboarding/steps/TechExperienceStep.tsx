import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingState } from '../../../hooks/useOnboardingState';
import { Button } from '../../design-system/Button';
import { Typography } from '../../design-system/Typography';

interface TechExperienceStepProps {
  data: any;
  updateData: (updates: any) => void;
}

export const TechExperienceStep: React.FC<TechExperienceStepProps> = ({ data, updateData }) => {
  const { t } = useTranslation();
  const { errors } = useOnboardingState({ stepIndex: 3 });

  const experienceLevels = [
    { value: 'beginner', label: t('onboarding.step4.beginner'), desc: t('onboarding.step4.beginnerDesc') },
    { value: 'some', label: t('onboarding.step4.some'), desc: t('onboarding.step4.someDesc') },
    { value: 'comfortable', label: t('onboarding.step4.comfortable'), desc: t('onboarding.step4.comfortableDesc') }
  ];

  const handleExperienceSelect = (value: string) => {
    updateData({ techExperience: value });
  };

  return (
    <div className="space-y-4" data-testid="tech-experience-step">
      {experienceLevels.map((level) => (
        <Button
          key={level.value}
          variant={data.techExperience === level.value ? 'primary' : 'outline'}
          size="lg"
          onClick={() => handleExperienceSelect(level.value)}
          className="w-full p-4 text-left justify-start"
          data-testid={`experience-option-${level.value}`}
        >
          <div>
            <Typography variant="body" className="font-medium mb-1">
              {level.label}
            </Typography>
            <Typography variant="body-sm" color="secondary">
              {level.desc}
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