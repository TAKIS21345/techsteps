import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { OnboardingStep, OnboardingStepProps } from './OnboardingStep';
import { OnboardingProgress } from './OnboardingProgress';
import { OnboardingTooltip } from './OnboardingTooltip';
import { Typography } from '../design-system/Typography';
import { Button } from '../design-system/Button';
import { X, SkipForward } from 'lucide-react';

export interface OnboardingStepData {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  tooltip: {
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    size: 'large';
  };
  optional: boolean;
  component: React.ComponentType<any>;
  props?: any;
  validation?: () => boolean;
}

export interface OnboardingFlowProps {
  steps: OnboardingStepData[];
  onComplete: (data: any) => void;
  onSkip?: () => void;
  onCancel?: () => void;
  initialData?: any;
  showProgress?: boolean;
  showSkipAll?: boolean;
  className?: string;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  steps,
  onComplete,
  onSkip,
  onCancel,
  initialData = {},
  showProgress = true,
  showSkipAll = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const { announceToScreenReader, settings } = useAccessibility();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Announce step changes to screen readers
  useEffect(() => {
    if (currentStep) {
      announceToScreenReader(
        t('onboarding.accessibility.stepChanged', {
          step: currentStepIndex + 1,
          total: steps.length,
          title: currentStep.title
        })
      );
    }
  }, [currentStepIndex, currentStep, steps.length, announceToScreenReader, t]);

  // Show tooltip when step changes (if target element exists)
  useEffect(() => {
    if (currentStep?.targetElement) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 500); // Small delay to allow page to render
      
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const updateFormData = useCallback((stepData: any) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  }, []);

  const canProceed = useCallback(() => {
    if (currentStep?.validation) {
      return currentStep.validation();
    }
    return true;
  }, [currentStep]);

  const handleNext = useCallback(async () => {
    if (!canProceed()) return;

    setShowTooltip(false);

    if (isLastStep) {
      setLoading(true);
      try {
        await onComplete(formData);
      } catch (error) {
        console.error('Error completing onboarding:', error);
        announceToScreenReader(t('onboarding.accessibility.errorCompleting'));
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [canProceed, isLastStep, onComplete, formData, announceToScreenReader, t]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setShowTooltip(false);
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [isFirstStep]);

  const handleSkipStep = useCallback(() => {
    if (currentStep?.optional) {
      setShowTooltip(false);
      if (isLastStep) {
        onComplete(formData);
      } else {
        setCurrentStepIndex(prev => prev + 1);
      }
    }
  }, [currentStep, isLastStep, onComplete, formData]);

  const handleSkipAll = useCallback(() => {
    if (onSkip) {
      announceToScreenReader(t('onboarding.accessibility.skippingOnboarding'));
      onSkip();
    }
  }, [onSkip, announceToScreenReader, t]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      announceToScreenReader(t('onboarding.accessibility.cancellingOnboarding'));
      onCancel();
    }
  }, [onCancel, announceToScreenReader, t]);

  const handleTooltipNext = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const handleTooltipSkip = useCallback(() => {
    setShowTooltip(false);
    handleSkipStep();
  }, [handleSkipStep]);

  if (!currentStep) {
    return null;
  }

  const StepComponent = currentStep.component;
  const stepTitles = steps.map(step => step.title);

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-center py-8 px-4 ${className}`}
      data-testid="onboarding-flow"
    >
      {/* Header with Skip/Cancel Options */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex justify-between items-center">
          <Typography variant="h1" className="text-center flex-1">
            {t('onboarding.flow.title')}
          </Typography>
          
          <div className="flex gap-2">
            {showSkipAll && onSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipAll}
                aria-label={t('onboarding.accessibility.skipEntireOnboarding')}
                data-testid="skip-all-button"
              >
                <SkipForward className="w-4 h-4 mr-1" />
                {t('onboarding.buttons.skipAll')}
              </Button>
            )}
            
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                aria-label={t('onboarding.accessibility.cancelOnboarding')}
                data-testid="cancel-button"
              >
                <X className="w-4 h-4 mr-1" />
                {t('onboarding.buttons.cancel')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {showProgress && (
        <div className="w-full max-w-2xl mb-8">
          <OnboardingProgress
            currentStep={currentStepIndex}
            totalSteps={steps.length}
            stepTitles={stepTitles}
          />
        </div>
      )}

      {/* Current Step */}
      <OnboardingStep
        {...currentStep}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={handleSkipStep}
        canProceed={canProceed()}
        isFirst={isFirstStep}
        isLast={isLastStep}
        loading={loading}
      >
        <StepComponent
          data={formData}
          updateData={updateFormData}
          {...(currentStep.props || {})}
        />
      </OnboardingStep>

      {/* Contextual Tooltip */}
      <OnboardingTooltip
        content={currentStep.tooltip.content}
        position={currentStep.tooltip.position}
        targetElement={currentStep.targetElement}
        visible={showTooltip}
        onClose={() => setShowTooltip(false)}
        onNext={handleTooltipNext}
        onSkip={currentStep.optional ? handleTooltipSkip : undefined}
        showSkip={currentStep.optional}
      />

      {/* Keyboard Navigation Instructions */}
      <div 
        className={`
          mt-6 text-center max-w-2xl
          ${settings.screenReaderOptimized ? 'sr-only' : 'text-sm text-gray-500'}
        `}
        aria-live="polite"
        data-testid="keyboard-instructions"
      >
        <Typography variant="caption">
          {t('onboarding.accessibility.keyboardInstructions')}
        </Typography>
      </div>
    </div>
  );
};