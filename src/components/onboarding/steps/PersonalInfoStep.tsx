import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingState } from '../../../hooks/useOnboardingState';
import { Input } from '../../design-system/Input';
import { Typography } from '../../design-system/Typography';

interface PersonalInfoStepProps {
  data: any;
  updateData: (updates: any) => void;
}

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ data, updateData }) => {
  const { t } = useTranslation();
  const { errors } = useOnboardingState({ stepIndex: 0 });

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'age' ? parseInt(event.target.value) || 65 : event.target.value;
    updateData({ [field]: value });
  };

  return (
    <div className="space-y-6" data-testid="personal-info-step">
      <div>
        <label htmlFor="firstName" className="block mb-2">
          <Typography variant="body" className="font-medium">
            {t('onboarding.step1.firstName')}
          </Typography>
        </label>
        <Input
          id="firstName"
          type="text"
          value={data.firstName || ''}
          onChange={handleInputChange('firstName')}
          placeholder={t('onboarding.step1.firstNamePlaceholder')}
          size="lg"
          variant={errors.some(e => e.includes('first name')) ? 'error' : 'default'}
          aria-describedby={errors.some(e => e.includes('first name')) ? 'firstName-error' : undefined}
          data-testid="firstName-input"
        />
        {errors.some(e => e.includes('first name')) && (
          <Typography 
            variant="body-sm" 
            color="error" 
            id="firstName-error"
            className="mt-1"
          >
            {errors.find(e => e.includes('first name'))}
          </Typography>
        )}
      </div>

      <div>
        <label htmlFor="lastName" className="block mb-2">
          <Typography variant="body" className="font-medium">
            {t('onboarding.step1.lastName')}
          </Typography>
        </label>
        <Input
          id="lastName"
          type="text"
          value={data.lastName || ''}
          onChange={handleInputChange('lastName')}
          placeholder={t('onboarding.step1.lastNamePlaceholder')}
          size="lg"
          variant={errors.some(e => e.includes('last name')) ? 'error' : 'default'}
          aria-describedby={errors.some(e => e.includes('last name')) ? 'lastName-error' : undefined}
          data-testid="lastName-input"
        />
        {errors.some(e => e.includes('last name')) && (
          <Typography 
            variant="body-sm" 
            color="error" 
            id="lastName-error"
            className="mt-1"
          >
            {errors.find(e => e.includes('last name'))}
          </Typography>
        )}
      </div>

      <div>
        <label htmlFor="age" className="block mb-2">
          <Typography variant="body" className="font-medium">
            {t('onboarding.step1.age')}
          </Typography>
        </label>
        <Input
          id="age"
          type="number"
          min="18"
          max="120"
          value={data.age || 65}
          onChange={handleInputChange('age')}
          size="lg"
          variant={errors.some(e => e.includes('age')) ? 'error' : 'default'}
          aria-describedby={errors.some(e => e.includes('age')) ? 'age-error' : undefined}
          data-testid="age-input"
        />
        {errors.some(e => e.includes('age')) && (
          <Typography 
            variant="body-sm" 
            color="error" 
            id="age-error"
            className="mt-1"
          >
            {errors.find(e => e.includes('age'))}
          </Typography>
        )}
      </div>
    </div>
  );
};