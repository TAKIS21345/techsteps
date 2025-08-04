import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { Typography } from '../design-system/Typography';
import { Check } from 'lucide-react';

export interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
  className?: string;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
  stepTitles = [],
  className = '',
}) => {
  const { t } = useTranslation();
  const { settings } = useAccessibility();

  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div 
      className={`w-full ${className}`}
      role="progressbar"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={t('onboarding.progress.label', { 
        current: currentStep + 1, 
        total: totalSteps 
      })}
      data-testid="onboarding-progress"
    >
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Typography variant="body-sm" color="secondary">
            {t('onboarding.progress.stepOf', { 
              current: currentStep + 1, 
              total: totalSteps 
            })}
          </Typography>
          <Typography variant="body-sm" color="secondary">
            {Math.round(progressPercentage)}%
          </Typography>
        </div>
        
        <div 
          className={`
            w-full h-3 rounded-full overflow-hidden
            ${settings.highContrast ? 'bg-gray-800' : 'bg-gray-200'}
          `}
        >
          <div
            className={`
              h-full transition-all duration-500 ease-out rounded-full
              ${settings.highContrast ? 'bg-yellow-400' : 'bg-blue-600'}
              ${settings.reducedMotion ? 'transition-none' : ''}
            `}
            style={{ width: `${progressPercentage}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center space-x-3 mb-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const stepTitle = stepTitles[index] || `${t('onboarding.progress.step')} ${index + 1}`;
          
          return (
            <div
              key={index}
              className={`
                relative flex items-center justify-center
                w-10 h-10 rounded-full border-2 transition-all duration-300
                ${settings.reducedMotion ? 'transition-none' : ''}
                ${
                  isCompleted
                    ? settings.highContrast
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'bg-green-500 border-green-500 text-white'
                    : isCurrent
                    ? settings.highContrast
                      ? 'bg-blue-800 border-blue-800 text-white'
                      : 'bg-blue-600 border-blue-600 text-white'
                    : settings.highContrast
                    ? 'bg-gray-100 border-gray-800 text-gray-800'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }
              `}
              role="button"
              tabIndex={0}
              aria-label={
                isCompleted
                  ? t('onboarding.progress.stepCompleted', { step: stepTitle })
                  : isCurrent
                  ? t('onboarding.progress.stepCurrent', { step: stepTitle })
                  : t('onboarding.progress.stepUpcoming', { step: stepTitle })
              }
              data-testid={`step-indicator-${index}`}
            >
              {isCompleted ? (
                <Check 
                  className="w-5 h-5" 
                  aria-hidden="true"
                />
              ) : (
                <span 
                  className="text-sm font-semibold"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
              )}
              
              {/* Tooltip for step title */}
              {stepTitles[index] && (
                <div
                  className={`
                    absolute -bottom-8 left-1/2 transform -translate-x-1/2
                    px-2 py-1 text-xs rounded whitespace-nowrap
                    ${settings.highContrast 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-700 text-white'
                    }
                    opacity-0 group-hover:opacity-100 transition-opacity
                    ${settings.reducedMotion ? 'transition-none' : ''}
                  `}
                  role="tooltip"
                  aria-hidden="true"
                >
                  {stepTitles[index]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Title */}
      {stepTitles[currentStep] && (
        <div className="text-center">
          <Typography 
            variant="body-sm" 
            color="secondary"
            data-testid="current-step-title"
          >
            {stepTitles[currentStep]}
          </Typography>
        </div>
      )}
    </div>
  );
};