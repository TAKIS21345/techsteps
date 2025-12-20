// AI Service exports - Using Google Gemini exclusively for senior learning platform
export { GeminiService } from './GeminiService';
export { PrivacyHandler } from './PrivacyHandler';
export { QualityTracker } from './QualityTracker';
export * from './config';

import { AIService } from '../../types/services';
import { GeminiService } from './GeminiService';

// Create singleton instance - using Gemini exclusively
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!geminiKey) {
      throw new Error('Gemini API key is required. Please set VITE_GEMINI_API_KEY in your environment variables.');
    }
    
    console.log('Using Google Gemini AI service for senior learning platform');
    aiServiceInstance = new GeminiService(geminiKey);
  }
  return aiServiceInstance;
}

export function resetAIService(): void {
  aiServiceInstance = null;
}

// Helper to get Gemini service directly
export function getGeminiService(): GeminiService {
  return getAIService() as GeminiService;
}