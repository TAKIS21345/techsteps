import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../contexts/OnboardingContext';
import { OnboardingStepValidation } from '../types/onboarding';

export interface UseOnboardingStateOptions {
  stepIndex: number;
  autoSave?: boolean;
  validationRules?: (data: any) => OnboardingStepValidation;
}

export interface UseOnboardingStateReturn {
  data: any;
  updateData: (updates: any) => void;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isCompleted: boolean;
  isSkipped: boolean;
  canProceed: boolean;
  timeSpent: number;
  validate: () => OnboardingStepValidation;
  clearErrors: () => void;
  markCompleted: () => void;
  markSkipped: () => void;
}

export const useOnboardingState = ({
  stepIndex,
  autoSave = true,
  validationRules,
}: UseOnboardingStateOptions): UseOnboardingStateReturn => {
  const { t } = useTranslation();
  const {
    state,
    updateUserPreferences,
    completeStep,
    skipStep,
    isStepCompleted,
    isStepSkipped,
    canProceedToStep,
    getStepValidationErrors,
    setStepValidationErrors,
    clearValidationErrors,
    saveProgress,
  } = useOnboarding();

  const [localData, setLocalData] = useState<any>({});
  const [startTime] = useState<number>(Date.now());

  // Initialize local data from onboarding state
  useEffect(() => {
    setLocalData(state.userPreferences);
  }, [state.userPreferences]);

  const updateData = useCallback((updates: any) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    updateUserPreferences(updates);

    if (autoSave) {
      // Debounced save
      const timeoutId = setTimeout(() => {
        saveProgress();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [localData, updateUserPreferences, autoSave, saveProgress]);

  const validate = useCallback((): OnboardingStepValidation => {
    if (validationRules) {
      return validationRules(localData);
    }

    // Default validation based on step
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (stepIndex) {
      case 0: // Personal information
        if (!localData.firstName?.trim()) {
          errors.push(t('onboarding.validation.firstNameRequired'));
        }
        if (!localData.lastName?.trim()) {
          errors.push(t('onboarding.validation.lastNameRequired'));
        }
        if (!localData.age || localData.age < 18 || localData.age > 120) {
          errors.push(t('onboarding.validation.validAgeRequired'));
        }
        break;

      case 1: // Language selection
        if (!localData.preferredLanguages?.length) {
          errors.push(t('onboarding.validation.languageRequired'));
        }
        break;

      case 2: // Device selection
        if (!localData.primaryDevice?.trim()) {
          errors.push(t('onboarding.validation.deviceRequired'));
        }
        break;

      case 3: // Tech experience
        if (!localData.techExperience) {
          errors.push(t('onboarding.validation.experienceRequired'));
        }
        break;

      case 4: // Primary concerns (optional)
        if (localData.primaryConcerns?.length === 0) {
          warnings.push(t('onboarding.validation.concernsOptional'));
        }
        break;

      case 5: // Assistive needs
        if (!localData.assistiveNeeds?.length) {
          errors.push(t('onboarding.validation.assistiveNeedsRequired'));
        }
        break;

      case 6: // Communication style
        if (!localData.communicationStyle) {
          errors.push(t('onboarding.validation.communicationStyleRequired'));
        }
        break;

      case 7: // Final preferences (optional)
        // No validation required for final step
        break;

      default:
        break;
    }

    return {
      stepIndex,
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [validationRules, localData, stepIndex, t]);

  const clearErrors = useCallback(() => {
    clearValidationErrors(stepIndex);
  }, [clearValidationErrors, stepIndex]);

  const markCompleted = useCallback(() => {
    const validation = validate();
    if (validation.isValid) {
      completeStep(stepIndex);
      clearErrors();
    } else {
      setStepValidationErrors(stepIndex, validation.errors);
    }
  }, [validate, completeStep, stepIndex, clearErrors, setStepValidationErrors]);

  const markSkipped = useCallback(() => {
    skipStep(stepIndex);
    clearErrors();
  }, [skipStep, stepIndex, clearErrors]);

  // Auto-validate when data changes
  useEffect(() => {
    const validation = validate();
    if (validation.errors.length > 0) {
      setStepValidationErrors(stepIndex, validation.errors);
    } else {
      clearValidationErrors(stepIndex);
    }
  }, [localData, validate, stepIndex, setStepValidationErrors, clearValidationErrors]);

  const currentErrors = getStepValidationErrors(stepIndex);
  const validation = validate();
  const timeSpent = Math.floor((Date.now() - startTime) / 1000);

  return {
    data: localData,
    updateData,
    isValid: validation.isValid && currentErrors.length === 0,
    errors: currentErrors.length > 0 ? currentErrors : validation.errors,
    warnings: validation.warnings,
    isCompleted: isStepCompleted(stepIndex),
    isSkipped: isStepSkipped(stepIndex),
    canProceed: canProceedToStep(stepIndex),
    timeSpent,
    validate,
    clearErrors,
    markCompleted,
    markSkipped,
  };
};

// Helper hook for managing onboarding restart from help menu
export const useOnboardingRestart = () => {
  const { restartOnboarding, state } = useOnboarding();
  const { t } = useTranslation();

  const canRestart = state.progress.canRestart;
  const isCompleted = state.completed;

  const restart = useCallback(() => {
    if (canRestart) {
      const confirmed = window.confirm(t('onboarding.restart.confirmMessage'));
      if (confirmed) {
        restartOnboarding();
        return true;
      }
    }
    return false;
  }, [canRestart, restartOnboarding, t]);

  return {
    canRestart,
    isCompleted,
    restart,
  };
};