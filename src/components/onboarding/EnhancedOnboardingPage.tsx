import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OnboardingProvider } from '../../contexts/OnboardingContext';
import { OnboardingFlow, OnboardingStepData } from './OnboardingFlow';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { LanguageSelectionStep } from './steps/LanguageSelectionStep';
import { DeviceSelectionStep } from './steps/DeviceSelectionStep';
import { TechExperienceStep } from './steps/TechExperienceStep';
import { PrimaryConcernsStep } from './steps/PrimaryConcernsStep';
import { AccessibilityNeedsStep } from './steps/AccessibilityNeedsStep';
import { CommunicationStyleStep } from './steps/CommunicationStyleStep';
import { FinalPreferencesStep } from './steps/FinalPreferencesStep';

const EnhancedOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onboardingSteps: OnboardingStepData[] = [
    {
      id: 'personal-info',
      title: t('onboarding.step1.title'),
      description: t('onboarding.step1.subtitle'),
      tooltip: {
        content: t('onboarding.step1.tooltip', { 
          default: 'Tell us a bit about yourself so we can personalize your learning experience.' 
        }),
        position: 'bottom',
        size: 'large',
      },
      optional: false,
      component: PersonalInfoStep,
      validation: (data) => ({
        stepIndex: 0,
        isValid: !!(data.firstName?.trim() && data.lastName?.trim() && data.age >= 18),
        errors: [
          ...(!data.firstName?.trim() ? [t('onboarding.validation.firstNameRequired')] : []),
          ...(!data.lastName?.trim() ? [t('onboarding.validation.lastNameRequired')] : []),
          ...(!data.age || data.age < 18 ? [t('onboarding.validation.validAgeRequired')] : []),
        ],
        warnings: [],
      }),
    },
    {
      id: 'language-selection',
      title: t('onboarding.step2.title'),
      description: t('onboarding.step2.subtitle'),
      tooltip: {
        content: t('onboarding.step2.tooltip', {
          default: 'Choose the languages you\'re comfortable with for voice input and text interactions.'
        }),
        position: 'bottom',
        size: 'large',
      },
      optional: false,
      component: LanguageSelectionStep,
      validation: (data) => ({
        stepIndex: 1,
        isValid: !!(data.preferredLanguages?.length > 0),
        errors: data.preferredLanguages?.length === 0 ? [t('onboarding.validation.languageRequired')] : [],
        warnings: [],
      }),
    },
    {
      id: 'device-selection',
      title: t('onboarding.step3.title'),
      description: t('onboarding.step3.subtitle'),
      tooltip: {
        content: t('onboarding.step3.tooltip', {
          default: 'Knowing your primary device helps us provide more relevant instructions.'
        }),
        position: 'bottom',
        size: 'large',
      },
      optional: false,
      component: DeviceSelectionStep,
      validation: (data) => ({
        stepIndex: 2,
        isValid: !!(data.primaryDevice?.trim()),
        errors: !data.primaryDevice?.trim() ? [t('onboarding.validation.deviceRequired')] : [],
        warnings: [],
      }),
    },
    {
      id: 'tech-experience',
      title: t('onboarding.step4.title'),
      description: t('onboarding.step4.subtitle'),
      tooltip: {
        content: t('onboarding.step4.tooltip', {
          default: 'Be honest about your comfort level - this helps us explain things at the right pace.'
        }),
        position: 'bottom',
        size: 'large',
      },
      optional: false,
      component: TechExperienceStep,
      validation: (data) => ({
        stepIndex: 3,
        isValid: !!(data.techExperience),
        errors: !data.techExperience ? [t('onboarding.validation.experienceRequired')] : [],
        warnings: [],
      }),
    },
    {
      id: 'primary-concerns',
      title: t('onboarding.step5.title'),
      description: t('onboarding.step5.subtitle'),
      tooltip: {
        content: t('onboarding.step5.tooltip', {
          default: 'Select topics that worry you most so we can prioritize help in these areas.'
        }),
        position: 'bottom',
        size: 'large',
      },
      optional: true,
      component: PrimaryConcernsStep,
      validation: (data) => ({
        stepIndex: 4,
        isValid: true, // This step is optional
        errors: [],
        warnings: data.primaryConcerns?.length === 0 ? [t('onboarding.validation.concernsOptional')] : [],
      }),
    },
    {
      id: 'accessibility-needs',
      title: t('onboarding.step6.title'),
      description: t('onboarding.step6.subtitle'),
      tooltip: {
        content: t('onboarding.step6.tooltip', {
          default: 'Let us know about any accessibility features you need for a comfortable experience.'
        }),
        position: 'bottom',
        size: 'large',
      },
      optional: false,
      component: AccessibilityNeedsStep,
      validation: (data) => ({
        stepIndex: 5,
        isValid: !!(data.assistiveNeeds?.length > 0),
        errors: data.assistiveNeeds?.length === 0 ? [t('onboarding.validation.assistiveNeedsRequired')] : [],
        warnings: [],
      }),
    },
    {
      id: 'communication-style',
      title: t('onboarding.step7.title'),
      description: t('onboarding.step7.subtitle'),
      tooltip: {
        content: t('onboarding.step7.tooltip', {
          default: 'Choose how you prefer to learn so we can adjust our teaching style.'
        }),
        position: 'bottom',
        size: 'large',
      },
      optional: false,
      component: CommunicationStyleStep,
      validation: (data) => ({
        stepIndex: 6,
        isValid: !!(data.communicationStyle),
        errors: !data.communicationStyle ? [t('onboarding.validation.communicationStyleRequired')] : [],
        warnings: [],
      }),
    },
    {
      id: 'final-preferences',
      title: t('onboarding.step8.title'),
      description: t('onboarding.step8.subtitle'),
      tooltip: {
        content: t('onboarding.step8.tooltip', {
          default: 'Set up your perfect learning environment with these final preferences.'
        }),
        position: 'bottom',
        size: 'large',
      },
      optional: true,
      component: FinalPreferencesStep,
      validation: () => ({
        stepIndex: 7,
        isValid: true, // Final step is always valid
        errors: [],
        warnings: [],
      }),
    },
  ];

  const handleComplete = async (data: any) => {
    try {
      // The OnboardingContext will handle saving to user profile
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const handleSkip = () => {
    navigate('/dashboard', { replace: true });
  };

  const handleCancel = () => {
    navigate('/', { replace: true });
  };

  return (
    <OnboardingProvider>
      <OnboardingFlow
        steps={onboardingSteps}
        onComplete={handleComplete}
        onSkip={handleSkip}
        onCancel={handleCancel}
        showProgress={true}
        showSkipAll={true}
        className="bg-gray-50"
      />
    </OnboardingProvider>
  );
};

export default EnhancedOnboardingPage;