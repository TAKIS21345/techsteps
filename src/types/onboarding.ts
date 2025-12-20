// Onboarding State Management Types

export interface OnboardingState {
  currentStep: number;
  completed: boolean;
  skipped: boolean;
  startedAt?: Date;
  completedAt?: Date;
  userPreferences: OnboardingUserPreferences;
  progress: OnboardingProgress;
}

export interface OnboardingUserPreferences {
  firstName: string;
  lastName: string;
  age: number;
  preferredLanguages: string[];
  primaryDevice: string;
  techExperience: 'beginner' | 'some' | 'comfortable';
  primaryConcerns: string[];
  assistiveNeeds: string[];
  communicationStyle: 'simple' | 'detailed' | 'visual';
  accessibilitySettings: OnboardingAccessibilitySettings;
  uiPreferences: OnboardingUIPreferences;
}

export interface OnboardingAccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
  voiceControl: boolean;
  textToSpeech: boolean;
  voiceInput: boolean;
}

export interface OnboardingUIPreferences {
  theme: 'light' | 'dark' | 'high-contrast';
  showAnimations: boolean;
  showTooltips: boolean;
  autoplayVideos: boolean;
  videoRecommendations: boolean;
}

export interface OnboardingProgress {
  stepsCompleted: number[];
  stepsSkipped: number[];
  timeSpentPerStep: Record<number, number>; // step index -> time in seconds
  totalTimeSpent: number;
  validationErrors: Record<number, string[]>;
  lastActiveStep: number;
  canRestart: boolean;
}

export interface OnboardingContextType {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  updateUserPreferences: (preferences: Partial<OnboardingUserPreferences>) => void;
  updateProgress: (progress: Partial<OnboardingProgress>) => void;
  completeStep: (stepIndex: number) => void;
  skipStep: (stepIndex: number) => void;
  goToStep: (stepIndex: number) => void;
  restartOnboarding: () => void;
  completeOnboarding: () => Promise<void>;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  isStepCompleted: (stepIndex: number) => boolean;
  isStepSkipped: (stepIndex: number) => boolean;
  canProceedToStep: (stepIndex: number) => boolean;
  getStepValidationErrors: (stepIndex: number) => string[];
  setStepValidationErrors: (stepIndex: number, errors: string[]) => void;
  clearValidationErrors: (stepIndex: number) => void;
}

export interface OnboardingStepValidation {
  stepIndex: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface OnboardingStorageData {
  state: OnboardingState;
  version: string;
  lastSaved: Date;
}

// Default values
export const defaultOnboardingState: OnboardingState = {
  currentStep: 0,
  completed: false,
  skipped: false,
  userPreferences: {
    firstName: '',
    lastName: '',
    age: 65,
    preferredLanguages: ['en'],
    primaryDevice: '',
    techExperience: 'beginner',
    primaryConcerns: [],
    assistiveNeeds: [],
    communicationStyle: 'simple',
    accessibilitySettings: {
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium',
      keyboardNavigation: false,
      screenReaderOptimized: false,
      voiceControl: false,
      textToSpeech: true,
      voiceInput: true,
    },
    uiPreferences: {
      theme: 'light',
      showAnimations: true,
      showTooltips: true,
      autoplayVideos: false,
      videoRecommendations: true,
    },
  },
  progress: {
    stepsCompleted: [],
    stepsSkipped: [],
    timeSpentPerStep: {},
    totalTimeSpent: 0,
    validationErrors: {},
    lastActiveStep: 0,
    canRestart: true,
  },
};

export const ONBOARDING_STORAGE_KEY = 'senior-learning-onboarding';
export const ONBOARDING_VERSION = '1.0.0';