import { AIService, AIResponse, ConversationContext, PageContext, HelpContent, AIMessage } from '../../types/services';
import { GeminiService } from './GeminiService';
import { GroqService } from './GroqService';
import { MistralService } from './MistralService';
import { DEFAULT_GEMINI_CONFIG, FALLBACK_CONFIG } from './config';

class FallbackAIService implements AIService {
  private primary: AIService;
  private fallbacks: AIService[];

  constructor(primary: AIService, fallbacks: AIService[]) {
    this.primary = primary;
    this.fallbacks = fallbacks;
  }

  async sendMessage(message: string, context: ConversationContext): Promise<AIResponse> {
    try {
      console.log('🤖 Central AI: Attempting Primary (Gemini 2.0)...');
      return await this.primary.sendMessage(message, context);
    } catch (error: any) {
      const errorMessage = (error.message || '').toLowerCase();
      const isRateLimit = errorMessage.includes('429') ||
        errorMessage.includes('too many requests') ||
        errorMessage.includes('rate_limit') ||
        error.status === 429 ||
        error.status === 403;

      console.warn(`⚠️ Primary AI failed (${isRateLimit ? 'Rate Limit' : 'Unexpected Error'}). Error:`, errorMessage);

      if (this.fallbacks.length > 0) {
        console.log(`🔄 Attempting to recover using ${this.fallbacks.length} available backup provider(s)...`);

        for (const [index, fallback] of this.fallbacks.entries()) {
          try {
            const providerName = fallback instanceof GroqService ? 'Groq' : 'Mistral';
            console.log(`🔌 Trying Backup ${index + 1}: ${providerName}...`);
            const response = await fallback.sendMessage(message, context);

            if (response.metadata) {
              response.metadata.sources = [...(response.metadata.sources || []), `Recovered via ${providerName}`];
            }

            console.log(`✅ Recovery Successful! Answered by ${providerName}.`);
            return response;
          } catch (fallbackError: any) {
            console.error(`❌ Backup ${index + 1} (${fallback instanceof GroqService ? 'Groq' : 'Mistral'}) also failed:`, (fallbackError as Error).message);
          }
        }
      }

      console.error('🛑 Critical Failure: All AI providers (Primary + Backups) are unavailable.');
      throw error;
    }
  }

  async sendVoiceMessage(audioBlob: Blob, context: ConversationContext): Promise<AIResponse> {
    return this.primary.sendVoiceMessage?.(audioBlob, context) || Promise.reject('Not implemented');
  }

  async sendImageMessage(imageFile: File, context: ConversationContext): Promise<AIResponse> {
    return this.primary.sendImageMessage?.(imageFile, context) || Promise.reject('Not implemented');
  }

  async escalateToHuman(conversationId: string, reason: string): Promise<void> {
    return this.primary.escalateToHuman(conversationId, reason);
  }

  async getContextualHelp(pageContext: PageContext): Promise<HelpContent> {
    return this.primary.getContextualHelp(pageContext);
  }

  async trackInteractionQuality(interactionId: string, rating: number): Promise<void> {
    return this.primary.trackInteractionQuality(interactionId, rating);
  }

  async getConversationHistory(userId: string, limit?: number): Promise<AIMessage[]> {
    return this.primary.getConversationHistory(userId, limit);
  }

  async clearConversationHistory(userId: string): Promise<void> {
    return this.primary.clearConversationHistory(userId);
  }
}

let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    const geminiKey = DEFAULT_GEMINI_CONFIG.apiKey;
    const groqKey = FALLBACK_CONFIG.groqKey;
    const mistralKey = FALLBACK_CONFIG.mistralKey;

    const gemini = new GeminiService(geminiKey);
    const fallbacks: AIService[] = [];

    if (groqKey) {
      console.log('Enabling Groq Fallback');
      fallbacks.push(new GroqService(groqKey));
    }

    if (mistralKey) {
      console.log('Enabling Mistral Fallback');
      fallbacks.push(new MistralService(mistralKey));
    }

    aiServiceInstance = new FallbackAIService(gemini, fallbacks);
  }
  return aiServiceInstance;
}

export function resetAIService(): void {
  aiServiceInstance = null;
}

export { GeminiService } from './GeminiService';
export { GroqService } from './GroqService';
export { MistralService } from './MistralService';
export * from './config';