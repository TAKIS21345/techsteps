// Google Gemini AI Service Configuration - Primary and only AI service
export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topK: number;
  topP: number;
  maxRetries: number;
  timeoutMs: number;
  fallbackEnabled: boolean;
  escalationThreshold: number;
}

export const DEFAULT_GEMINI_CONFIG: GeminiConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  model: 'gemini-2.0-flash-exp',
  maxTokens: 1000,
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxRetries: 3,
  timeoutMs: 30000,
  fallbackEnabled: true,
  escalationThreshold: 3
};

// Alias for backward compatibility
export const DEFAULT_AI_CONFIG = DEFAULT_GEMINI_CONFIG;
export type AIConfig = GeminiConfig;

// Privacy and data handling configuration
export interface PrivacyConfig {
  anonymizeUserData: boolean;
  retainConversationHistory: boolean;
  maxHistoryDays: number;
  allowTrainingDataUsage: boolean;
  encryptStoredData: boolean;
}

export const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  anonymizeUserData: true,
  retainConversationHistory: true,
  maxHistoryDays: 30,
  allowTrainingDataUsage: false, // Never use senior user data for training
  encryptStoredData: true
};

// Response quality tracking configuration
export interface QualityConfig {
  trackConfidenceScores: boolean;
  trackResponseTimes: boolean;
  trackUserSatisfaction: boolean;
  minimumConfidenceThreshold: number;
  escalationConfidenceThreshold: number;
}

export const DEFAULT_QUALITY_CONFIG: QualityConfig = {
  trackConfidenceScores: true,
  trackResponseTimes: true,
  trackUserSatisfaction: true,
  minimumConfidenceThreshold: 0.6,
  escalationConfidenceThreshold: 0.3
};

// Fallback responses for common scenarios
export const FALLBACK_RESPONSES = {
  GENERAL_ERROR: "I apologize, but I'm having trouble right now. Let me connect you with one of our helpful team members who can assist you better.",
  
  NETWORK_ERROR: "It seems there's a connection issue. Please check your internet connection and try again, or I can help you contact our support team.",
  
  TIMEOUT_ERROR: "I'm taking longer than usual to respond. Let me try again, or would you prefer to speak with a human helper?",
  
  UNCLEAR_QUESTION: "I want to make sure I understand your question correctly. Could you please rephrase it, or would you like me to connect you with someone who can help?",
  
  COMPLEX_TECHNICAL: "This seems like a technical question that would be better handled by our support team. They have specialized knowledge to help you with this.",
  
  PRIVACY_CONCERN: "I understand you have privacy concerns. Let me connect you with our support team who can address your specific privacy questions.",
  
  ACCESSIBILITY_HELP: "For accessibility assistance, our support team has specialized training to help you. Would you like me to connect you with them?",
  
  EMERGENCY_SUPPORT: "It sounds like you need immediate assistance. Let me connect you with our support team right away."
};

// Contextual help templates
export const HELP_TEMPLATES = {
  LANDING_PAGE: {
    title: "Welcome! Getting Started",
    content: "Welcome to our learning platform! Here you can start your technology learning journey. The 'Get Started' button will guide you through creating your account and setting up your preferences.",
    actions: [
      { label: "Create Account", type: "navigate", target: "/signup" },
      { label: "Learn More", type: "tutorial", target: "getting-started" }
    ]
  },
  
  TUTORIAL_PAGE: {
    title: "Tutorial Help",
    content: "You're doing great! Take your time with each step. If something isn't clear, don't hesitate to ask questions or use the 'Previous' button to review earlier steps.",
    actions: [
      { label: "Ask a Question", type: "help", target: "ai-assistant" },
      { label: "Contact Support", type: "contact", target: "support" }
    ]
  },
  
  PROFILE_PAGE: {
    title: "Your Profile Settings",
    content: "Here you can update your personal information, change your preferences, and adjust accessibility settings to make your learning experience more comfortable.",
    actions: [
      { label: "Accessibility Settings", type: "navigate", target: "/profile/accessibility" },
      { label: "Privacy Settings", type: "navigate", target: "/profile/privacy" }
    ]
  }
};

// Senior-friendly response formatting guidelines
export const RESPONSE_GUIDELINES = {
  MAX_PARAGRAPH_LENGTH: 100, // characters
  USE_SIMPLE_LANGUAGE: true,
  INCLUDE_ENCOURAGEMENT: true,
  BREAK_INTO_STEPS: true,
  AVOID_TECHNICAL_JARGON: true,
  OFFER_HUMAN_HELP: true,
  PATIENCE_REMINDERS: true
};