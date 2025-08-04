import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { Button } from '../design-system/Button';
import { Typography } from '../design-system/Typography';
import { Card } from '../design-system/Card';

export interface OnboardingStepProps {
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
  children?: React.ReactNode;
  onNext?: () => void;
  onSkip?: () => void;
  onPrevious?: () => void;
  canProceed?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  loading?: boolean;
}

export const OnboardingStep: React.FC<OnboardingStepProps> = ({
  title,
  description,
  tooltip,
  optional,
  children,
  onNext,
  onSkip,
  onPrevious,
  canProceed = true,
  isFirst = false,
  isLast = false,
  loading = false,
}) => {
  const { t } = useTranslation();
  const { announceToScreenReader, settings } = useAccessibility();

  const handleNext = () => {
    if (onNext && canProceed) {
      announceToScreenReader(
        isLast 
          ? t('onboarding.accessibility.completingOnboarding')
          : t('onboarding.accessibility.movingToNextStep')
      );
      onNext();
    }
  };

  const handleSkip = () => {
    if (onSkip && optional) {
      announceToScreenReader(t('onboarding.accessibility.skippingStep'));
      onSkip();
    }
  };

  const handlePrevious = () => {
    if (onPrevious && !isFirst) {
      announceToScreenReader(t('onboarding.accessibility.movingToPreviousStep'));
      onPrevious();
    }
  };

  return (
    <Card 
      className="w-full max-w-2xl mx-auto"
      padding="xl"
      data-testid="onboarding-step"
    >
      {/* Step Header */}
      <div className="text-center mb-8">
        <Typography 
          variant="h2" 
          className="mb-4"
          data-testid="step-title"
        >
          {title}
        </Typography>
        <Typography 
          variant="body-lg" 
          color="secondary"
          data-testid="step-description"
        >
          {description}
        </Typography>
      </div>

      {/* Tooltip Content */}
      {tooltip.content && (
        <div 
          className={`
            mb-8 p-6 rounded-xl border-2 border-blue-200 bg-blue-50
            ${settings.highContrast ? 'border-blue-800 bg-blue-100' : ''}
          `}
          role="complementary"
          aria-label={t('onboarding.accessibility.helpfulTip')}
          data-testid="step-tooltip"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">?</span>
            </div>
            <Typography variant="body" className="text-blue-800">
              {tooltip.content}
            </Typography>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div 
        className="mb-8"
        data-testid="step-content"
      >
        {children}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4">
          {!isFirst && (
            <Button
              variant="secondary"
              size="lg"
              onClick={handlePrevious}
              disabled={loading}
              aria-label={t('onboarding.accessibility.goToPreviousStep')}
              data-testid="previous-button"
            >
              {t('onboarding.buttons.previous')}
            </Button>
          )}
        </div>

        <div className="flex gap-4">
          {optional && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleSkip}
              disabled={loading}
              aria-label={t('onboarding.accessibility.skipThisStep')}
              data-testid="skip-button"
            >
              {t('onboarding.buttons.skip')}
            </Button>
          )}
          
          <Button
            variant="primary"
            size="lg"
            onClick={handleNext}
            disabled={!canProceed || loading}
            loading={loading}
            aria-label={
              isLast 
                ? t('onboarding.accessibility.completeOnboarding')
                : t('onboarding.accessibility.continueToNextStep')
            }
            data-testid="next-button"
          >
            {loading ? (
              t('onboarding.buttons.processing')
            ) : isLast ? (
              t('onboarding.buttons.complete')
            ) : (
              t('onboarding.buttons.next')
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};