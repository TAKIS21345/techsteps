import { OnboardingState, OnboardingUserPreferences } from '../types/onboarding';

/**
 * Utility functions for onboarding state management and help menu integration
 */

export const ONBOARDING_HELP_MENU_KEY = 'onboarding-help-menu';

export interface OnboardingHelpMenuItem {
  id: string;
  title: string;
  description: string;
  action: () => void;
  available: boolean;
  icon?: string;
}

/**
 * Generate help menu items for onboarding
 */
export const generateOnboardingHelpMenuItems = (
  state: OnboardingState,
  actions: {
    restart: () => void;
    resume: () => void;
    viewProgress: () => void;
  }
): OnboardingHelpMenuItem[] => {
  const items: OnboardingHelpMenuItem[] = [];

  // Restart onboarding
  if (state.completed || state.skipped) {
    items.push({
      id: 'restart-onboarding',
      title: 'Restart Setup Process',
      description: 'Go through the initial setup again to update your preferences',
      action: actions.restart,
      available: state.progress.canRestart,
      icon: 'refresh',
    });
  }

  // Resume onboarding
  if (!state.completed && !state.skipped && state.currentStep > 0) {
    items.push({
      id: 'resume-onboarding',
      title: 'Continue Setup',
      description: `Resume setup from step ${state.currentStep + 1}`,
      action: actions.resume,
      available: true,
      icon: 'play',
    });
  }

  // View progress
  if (state.progress.stepsCompleted.length > 0 || state.progress.stepsSkipped.length > 0) {
    items.push({
      id: 'view-onboarding-progress',
      title: 'View Setup Progress',
      description: 'See what you\'ve completed in the setup process',
      action: actions.viewProgress,
      available: true,
      icon: 'chart',
    });
  }

  return items;
};

/**
 * Calculate onboarding completion percentage
 */
export const calculateOnboardingProgress = (state: OnboardingState, totalSteps: number): number => {
  const completedSteps = state.progress.stepsCompleted.length;
  const skippedSteps = state.progress.stepsSkipped.length;
  const totalProcessed = completedSteps + skippedSteps;
  
  return Math.round((totalProcessed / totalSteps) * 100);
};

/**
 * Get onboarding summary for display
 */
export const getOnboardingSummary = (state: OnboardingState) => {
  const { userPreferences, progress } = state;
  
  return {
    personalInfo: {
      name: `${userPreferences.firstName} ${userPreferences.lastName}`.trim(),
      age: userPreferences.age,
      languages: userPreferences.preferredLanguages,
    },
    preferences: {
      device: userPreferences.primaryDevice,
      experience: userPreferences.techExperience,
      communicationStyle: userPreferences.communicationStyle,
      concerns: userPreferences.primaryConcerns,
      assistiveNeeds: userPreferences.assistiveNeeds,
    },
    accessibility: userPreferences.accessibilitySettings,
    ui: userPreferences.uiPreferences,
    progress: {
      completed: progress.stepsCompleted.length,
      skipped: progress.stepsSkipped.length,
      totalTime: progress.totalTimeSpent,
      lastActive: progress.lastActiveStep,
    },
    status: {
      completed: state.completed,
      skipped: state.skipped,
      canRestart: progress.canRestart,
    },
  };
};

/**
 * Validate onboarding data for completeness
 */
export const validateOnboardingCompleteness = (preferences: OnboardingUserPreferences): {
  isComplete: boolean;
  missingFields: string[];
  warnings: string[];
} => {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!preferences.firstName?.trim()) missingFields.push('firstName');
  if (!preferences.lastName?.trim()) missingFields.push('lastName');
  if (!preferences.age || preferences.age < 18) missingFields.push('age');
  if (!preferences.preferredLanguages?.length) missingFields.push('preferredLanguages');
  if (!preferences.primaryDevice?.trim()) missingFields.push('primaryDevice');
  if (!preferences.techExperience) missingFields.push('techExperience');
  if (!preferences.communicationStyle) missingFields.push('communicationStyle');
  if (!preferences.assistiveNeeds?.length) missingFields.push('assistiveNeeds');

  // Optional but recommended fields
  if (!preferences.primaryConcerns?.length) {
    warnings.push('primaryConcerns');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    warnings,
  };
};

/**
 * Export onboarding data for backup/transfer
 */
export const exportOnboardingData = (state: OnboardingState) => {
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      userPreferences: state.userPreferences,
      progress: {
        stepsCompleted: state.progress.stepsCompleted,
        stepsSkipped: state.progress.stepsSkipped,
        totalTimeSpent: state.progress.totalTimeSpent,
      },
      completed: state.completed,
      completedAt: state.completedAt?.toISOString(),
    },
  };
};

/**
 * Import onboarding data from backup
 */
export const importOnboardingData = (exportedData: any): Partial<OnboardingState> | null => {
  try {
    if (!exportedData.version || !exportedData.data) {
      return null;
    }

    const { data } = exportedData;
    
    return {
      userPreferences: data.userPreferences,
      progress: {
        stepsCompleted: data.progress.stepsCompleted || [],
        stepsSkipped: data.progress.stepsSkipped || [],
        timeSpentPerStep: {},
        totalTimeSpent: data.progress.totalTimeSpent || 0,
        validationErrors: {},
        lastActiveStep: Math.max(...data.progress.stepsCompleted, 0),
        canRestart: true,
      },
      completed: data.completed || false,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
    };
  } catch (error) {
    console.error('Error importing onboarding data:', error);
    return null;
  }
};

/**
 * Generate accessibility recommendations based on onboarding data
 */
export const generateAccessibilityRecommendations = (preferences: OnboardingUserPreferences): string[] => {
  const recommendations: string[] = [];

  // Age-based recommendations
  if (preferences.age >= 65) {
    recommendations.push('Consider enabling larger text size for better readability');
    recommendations.push('High contrast mode may help with visual clarity');
  }

  // Experience-based recommendations
  if (preferences.techExperience === 'beginner') {
    recommendations.push('Enable tooltips and help hints for guidance');
    recommendations.push('Consider slower explanations and step-by-step guidance');
  }

  // Assistive needs recommendations
  if (preferences.assistiveNeeds.includes('onboarding.step6.needs.largerText')) {
    recommendations.push('Large text size is enabled in your accessibility settings');
  }

  if (preferences.assistiveNeeds.includes('onboarding.step6.needs.highContrast')) {
    recommendations.push('High contrast mode is available in your settings');
  }

  if (preferences.assistiveNeeds.includes('onboarding.step6.needs.voiceCommands')) {
    recommendations.push('Voice input is enabled for hands-free interaction');
  }

  if (preferences.assistiveNeeds.includes('onboarding.step6.needs.screenReader')) {
    recommendations.push('Screen reader optimization is enabled');
  }

  return recommendations;
};

/**
 * Format time spent for display
 */
export const formatTimeSpent = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
};