import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from './AccessibilityContext';
import { useUser } from './UserContext';
import {
  OnboardingState,
  OnboardingContextType,
  OnboardingUserPreferences,
  OnboardingProgress,
  OnboardingStorageData,
  defaultOnboardingState,
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_VERSION,
} from '../types/onboarding';

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const { updateSettings } = useAccessibility();
  const { updateUserData } = useUser();
  
  const [state, setState] = useState<OnboardingState>(() => {
    // Initialize with default state and user's current language
    const initialState = {
      ...defaultOnboardingState,
      userPreferences: {
        ...defaultOnboardingState.userPreferences,
        preferredLanguages: [i18n.language],
      },
    };
    return initialState;
  });

  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());

  // Load onboarding progress from localStorage on mount
  useEffect(() => {
    loadProgress();
  }, []);

  // Track time spent on current step
  useEffect(() => {
    setStepStartTime(Date.now());
  }, [state.currentStep]);

  // Apply accessibility settings when they change
  useEffect(() => {
    if (state.userPreferences.accessibilitySettings) {
      updateSettings({
        highContrast: state.userPreferences.accessibilitySettings.highContrast,
        reducedMotion: state.userPreferences.accessibilitySettings.reducedMotion,
        fontSize: state.userPreferences.accessibilitySettings.fontSize,
        keyboardNavigation: state.userPreferences.accessibilitySettings.keyboardNavigation,
        screenReaderOptimized: state.userPreferences.accessibilitySettings.screenReaderOptimized,
        voiceControl: state.userPreferences.accessibilitySettings.voiceControl,
      });
    }
  }, [state.userPreferences.accessibilitySettings, updateSettings]);

  // Apply language preferences
  useEffect(() => {
    if (state.userPreferences.preferredLanguages.length > 0) {
      const primaryLanguage = state.userPreferences.preferredLanguages[0];
      if (i18n.language !== primaryLanguage) {
        i18n.changeLanguage(primaryLanguage);
      }
    }
  }, [state.userPreferences.preferredLanguages, i18n]);

  const updateState = useCallback((updates: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateUserPreferences = useCallback((preferences: Partial<OnboardingUserPreferences>) => {
    setState(prev => ({
      ...prev,
      userPreferences: { ...prev.userPreferences, ...preferences },
    }));
  }, []);

  const updateProgress = useCallback((progress: Partial<OnboardingProgress>) => {
    setState(prev => ({
      ...prev,
      progress: { ...prev.progress, ...progress },
    }));
  }, []);

  const completeStep = useCallback((stepIndex: number) => {
    const timeSpent = Math.floor((Date.now() - stepStartTime) / 1000);
    
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        stepsCompleted: [...new Set([...prev.progress.stepsCompleted, stepIndex])],
        stepsSkipped: prev.progress.stepsSkipped.filter(s => s !== stepIndex),
        timeSpentPerStep: {
          ...prev.progress.timeSpentPerStep,
          [stepIndex]: (prev.progress.timeSpentPerStep[stepIndex] || 0) + timeSpent,
        },
        totalTimeSpent: prev.progress.totalTimeSpent + timeSpent,
        lastActiveStep: stepIndex,
      },
    }));
  }, [stepStartTime]);

  const skipStep = useCallback((stepIndex: number) => {
    const timeSpent = Math.floor((Date.now() - stepStartTime) / 1000);
    
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        stepsSkipped: [...new Set([...prev.progress.stepsSkipped, stepIndex])],
        stepsCompleted: prev.progress.stepsCompleted.filter(s => s !== stepIndex),
        timeSpentPerStep: {
          ...prev.progress.timeSpentPerStep,
          [stepIndex]: (prev.progress.timeSpentPerStep[stepIndex] || 0) + timeSpent,
        },
        totalTimeSpent: prev.progress.totalTimeSpent + timeSpent,
        lastActiveStep: stepIndex,
      },
    }));
  }, [stepStartTime]);

  const goToStep = useCallback((stepIndex: number) => {
    setState(prev => ({
      ...prev,
      currentStep: stepIndex,
      progress: {
        ...prev.progress,
        lastActiveStep: stepIndex,
      },
    }));
  }, []);

  const restartOnboarding = useCallback(() => {
    setState({
      ...defaultOnboardingState,
      userPreferences: {
        ...defaultOnboardingState.userPreferences,
        preferredLanguages: [i18n.language],
      },
    });
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }, [i18n.language]);

  const completeOnboarding = useCallback(async () => {
    try {
      const completedState = {
        ...state,
        completed: true,
        completedAt: new Date(),
        progress: {
          ...state.progress,
          canRestart: true,
        },
      };

      setState(completedState);

      // Save to user profile
      await updateUserData({
        onboardingCompleted: true,
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false,
            learningReminders: true,
            caregiverUpdates: false,
            systemUpdates: true,
          },
          privacy: {
            shareProgressWithCaregivers: false,
            allowAnalytics: true,
            allowAITraining: false,
            dataRetentionPeriod: 365,
          },
          learning: {
            difficulty: state.userPreferences.techExperience,
            pacePreference: 'normal',
            preferredContentTypes: ['text', 'video'],
            reminderFrequency: 'weekly',
          },
          ui: {
            theme: state.userPreferences.uiPreferences.theme,
            fontSize: state.userPreferences.accessibilitySettings.fontSize,
            reducedMotion: state.userPreferences.accessibilitySettings.reducedMotion,
            keyboardNavigation: state.userPreferences.accessibilitySettings.keyboardNavigation,
            screenReaderOptimized: state.userPreferences.accessibilitySettings.screenReaderOptimized,
          },
        },
        profile: {
          firstName: state.userPreferences.firstName,
          lastName: state.userPreferences.lastName,
          preferredLanguage: state.userPreferences.preferredLanguages[0] || 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        accessibilitySettings: {
          highContrast: state.userPreferences.accessibilitySettings.highContrast,
          reducedMotion: state.userPreferences.accessibilitySettings.reducedMotion,
          fontSize: state.userPreferences.accessibilitySettings.fontSize,
          keyboardNavigation: state.userPreferences.accessibilitySettings.keyboardNavigation,
          screenReaderOptimized: state.userPreferences.accessibilitySettings.screenReaderOptimized,
          voiceControl: state.userPreferences.accessibilitySettings.voiceControl,
          magnification: 1.0,
        },
      });

      // Clear onboarding data from localStorage
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }, [state, updateUserData]);

  const saveProgress = useCallback(async () => {
    try {
      const storageData: OnboardingStorageData = {
        state,
        version: ONBOARDING_VERSION,
        lastSaved: new Date(),
      };
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
    }
  }, [state]);

  const loadProgress = useCallback(async () => {
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const storageData: OnboardingStorageData = JSON.parse(stored);
        
        // Check version compatibility
        if (storageData.version === ONBOARDING_VERSION) {
          setState(() => ({
            ...storageData.state,
            userPreferences: {
              ...storageData.state.userPreferences,
              // Ensure current language is included
              preferredLanguages: storageData.state.userPreferences.preferredLanguages.includes(i18n.language)
                ? storageData.state.userPreferences.preferredLanguages
                : [i18n.language, ...storageData.state.userPreferences.preferredLanguages],
            },
          }));
        } else {
          // Version mismatch, clear old data
          localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  }, [i18n.language]);

  const isStepCompleted = useCallback((stepIndex: number) => {
    return state.progress.stepsCompleted.includes(stepIndex);
  }, [state.progress.stepsCompleted]);

  const isStepSkipped = useCallback((stepIndex: number) => {
    return state.progress.stepsSkipped.includes(stepIndex);
  }, [state.progress.stepsSkipped]);

  const canProceedToStep = useCallback((stepIndex: number) => {
    // Can always go to first step
    if (stepIndex === 0) return true;
    
    // Can proceed if previous step is completed or skipped
    const previousStep = stepIndex - 1;
    return isStepCompleted(previousStep) || isStepSkipped(previousStep);
  }, [isStepCompleted, isStepSkipped]);

  const getStepValidationErrors = useCallback((stepIndex: number) => {
    return state.progress.validationErrors[stepIndex] || [];
  }, [state.progress.validationErrors]);

  const setStepValidationErrors = useCallback((stepIndex: number, errors: string[]) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        validationErrors: {
          ...prev.progress.validationErrors,
          [stepIndex]: errors,
        },
      },
    }));
  }, []);

  const clearValidationErrors = useCallback((stepIndex: number) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        validationErrors: {
          ...prev.progress.validationErrors,
          [stepIndex]: [],
        },
      },
    }));
  }, []);

  // Auto-save progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.completed) {
        saveProgress();
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [saveProgress, state.completed]);

  // Save progress when component unmounts
  useEffect(() => {
    return () => {
      if (!state.completed) {
        saveProgress();
      }
    };
  }, [saveProgress, state.completed]);

  const value: OnboardingContextType = {
    state,
    updateState,
    updateUserPreferences,
    updateProgress,
    completeStep,
    skipStep,
    goToStep,
    restartOnboarding,
    completeOnboarding,
    saveProgress,
    loadProgress,
    isStepCompleted,
    isStepSkipped,
    canProceedToStep,
    getStepValidationErrors,
    setStepValidationErrors,
    clearValidationErrors,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};