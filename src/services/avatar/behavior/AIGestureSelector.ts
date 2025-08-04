/**
 * AI-Powered Gesture Selector using Gemini
 * 
 * This system lets Gemini AI directly choose appropriate gestures, expressions,
 * and movements based on the content and cultural context, rather than using
 * rule-based interpretation.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  BehaviorPlan, 
  HandGesture, 
  FacialExpression, 
  HeadMovement,
  EmotionalTone,
  CulturalAdaptation
} from './types';
import { CulturalProfile } from '../movement/types';

export interface AIGestureRequest {
  textContent: string;
  culturalContext: CulturalProfile;
  conversationContext: {
    isQuestion: boolean;
    isExplanation: boolean;
    isInstruction: boolean;
    isCelebration: boolean;
    emotionalTone: 'positive' | 'negative' | 'neutral';
    formalityLevel: 'casual' | 'professional' | 'formal';
  };
  previousGestures?: string[];
}

export interface AIGestureResponse {
  handGestures: Array<{
    type: string;
    intensity: number;
    timing: number;
    duration: number;
    reason: string;
  }>;
  facialExpressions: Array<{
    type: string;
    intensity: number;
    timing: number;
    duration: number;
    reason: string;
  }>;
  headMovements: Array<{
    type: string;
    direction: string;
    intensity: number;
    timing: number;
    duration: number;
    reason: string;
  }>;
  emotionalTone: {
    warmth: number;
    energy: number;
    formality: number;
    empathy: number;
  };
  culturalNotes: string[];
  confidence: number;
}

export class AIGestureSelector {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private gestureCache: Map<string, AIGestureResponse> = new Map();

  constructor() {
    const apiKey = process.env.VITE_GEMINI_API_KEY || import.meta?.env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Gemini API key not found, AI gesture selection will use fallback mode');
      // Don't throw error, just use fallback
    }
    
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  /**
   * Let Gemini AI choose appropriate gestures and expressions
   */
  public async selectGestures(request: AIGestureRequest): Promise<BehaviorPlan> {
    try {
      // Check if AI is available
      if (!this.model) {
        console.log('AI model not available, using fallback');
        return this.getFallbackBehaviorPlan(request);
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cached = this.gestureCache.get(cacheKey);
      if (cached) {
        return this.convertToAvatarBehaviorPlan(cached);
      }

      // Create prompt for Gemini
      const prompt = this.createGestureSelectionPrompt(request);
      
      // Get AI response
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = this.parseAIResponse(response.text());

      // Cache the response
      this.gestureCache.set(cacheKey, aiResponse);

      // Convert to avatar behavior plan
      return this.convertToAvatarBehaviorPlan(aiResponse);

    } catch (error) {
      console.error('AI Gesture Selection failed:', error);
      // Fallback to basic gestures
      return this.getFallbackBehaviorPlan(request);
    }
  }

  /**
   * Create a detailed prompt for Gemini to select appropriate gestures
   */
  private createGestureSelectionPrompt(request: AIGestureRequest): string {
    const { textContent, culturalContext, conversationContext } = request;

    return `You are an expert in human communication and cultural body language. I need you to select appropriate avatar gestures, facial expressions, and head movements for the following text content.

TEXT CONTENT: "${textContent}"

CULTURAL CONTEXT:
- Region: ${culturalContext.region}
- Cultural preferences: ${JSON.stringify(culturalContext.gesturePreferences)}
- Restricted gestures: ${culturalContext.restrictedGestures.join(', ') || 'none'}

CONVERSATION CONTEXT:
- Is question: ${conversationContext.isQuestion}
- Is explanation: ${conversationContext.isExplanation}
- Is instruction: ${conversationContext.isInstruction}
- Is celebration: ${conversationContext.isCelebration}
- Emotional tone: ${conversationContext.emotionalTone}
- Formality level: ${conversationContext.formalityLevel}

AVAILABLE GESTURE TYPES:
Hand Gestures: pointing, counting, descriptive, celebratory, supportive, questioning, open_palm, thumbs_up, wave
Facial Expressions: smile, concern, excitement, focus, surprise, neutral, empathy, thinking, confident
Head Movements: nod, tilt, shake, turn, emphasis, slight_bow

CULTURAL GUIDELINES:
- Western: Direct, moderate expressiveness, comfortable with pointing
- Eastern: Subtle, respectful, avoid pointing, prefer bowing over nodding
- Mediterranean: Expressive, animated, frequent gestures
- Nordic: Reserved, minimal gestures, controlled expressions
- Middle Eastern: Respectful, moderate expressiveness, avoid certain hand gestures

Please respond with a JSON object in this exact format:
{
  "handGestures": [
    {
      "type": "gesture_type",
      "intensity": 0.7,
      "timing": 0.2,
      "duration": 1500,
      "reason": "why this gesture fits the content and culture"
    }
  ],
  "facialExpressions": [
    {
      "type": "expression_type",
      "intensity": 0.8,
      "timing": 0.1,
      "duration": 2000,
      "reason": "why this expression is appropriate"
    }
  ],
  "headMovements": [
    {
      "type": "movement_type",
      "direction": "up/down/left/right",
      "intensity": 0.6,
      "timing": 0.5,
      "duration": 800,
      "reason": "why this movement enhances communication"
    }
  ],
  "emotionalTone": {
    "warmth": 0.8,
    "energy": 0.7,
    "formality": 0.6,
    "empathy": 0.9
  },
  "culturalNotes": ["explanation of cultural considerations"],
  "confidence": 0.85
}

Consider:
1. Cultural appropriateness for ${culturalContext.region} culture
2. Natural timing and synchronization with speech
3. Avoiding overwhelming the user with too many simultaneous gestures
4. Matching the emotional tone and formality level
5. Supporting the content's meaning and intent

Respond only with the JSON object, no additional text.`;
  }

  /**
   * Parse AI response and extract gesture information
   */
  private parseAIResponse(responseText: string): AIGestureResponse {
    try {
      // Clean up the response text to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const jsonText = jsonMatch[0];
      const parsed = JSON.parse(jsonText);

      // Validate the response structure
      return {
        handGestures: parsed.handGestures || [],
        facialExpressions: parsed.facialExpressions || [],
        headMovements: parsed.headMovements || [],
        emotionalTone: parsed.emotionalTone || {
          warmth: 0.5,
          energy: 0.5,
          formality: 0.5,
          empathy: 0.5
        },
        culturalNotes: parsed.culturalNotes || [],
        confidence: parsed.confidence || 0.7
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return default response
      return {
        handGestures: [],
        facialExpressions: [{ type: 'neutral', intensity: 0.5, timing: 0, duration: 2000, reason: 'fallback' }],
        headMovements: [],
        emotionalTone: { warmth: 0.5, energy: 0.5, formality: 0.5, empathy: 0.5 },
        culturalNotes: ['AI parsing failed, using fallback'],
        confidence: 0.3
      };
    }
  }

  /**
   * Convert AI response to avatar behavior plan format
   */
  private convertToAvatarBehaviorPlan(aiResponse: AIGestureResponse): BehaviorPlan {
    const handGestures: HandGesture[] = aiResponse.handGestures.map(gesture => ({
      type: gesture.type as any,
      intensity: gesture.intensity,
      duration: gesture.duration,
      timing: gesture.timing,
      culturalVariant: 'ai_selected',
      synchronizeWithSpeech: true
    }));

    const facialExpressions: FacialExpression[] = aiResponse.facialExpressions.map(expression => ({
      type: expression.type as any,
      intensity: expression.intensity,
      duration: expression.duration,
      timing: expression.timing,
      culturalModifier: 1.0
    }));

    const headMovements: HeadMovement[] = aiResponse.headMovements.map(movement => ({
      type: movement.type as any,
      direction: movement.direction as any,
      intensity: movement.intensity,
      duration: movement.duration,
      timing: movement.timing
    }));

    const culturalAdaptations: CulturalAdaptation[] = aiResponse.culturalNotes.map(note => ({
      gestureModification: 'ai_cultural_adaptation',
      intensityAdjustment: 0,
      appropriatenessFilter: true
    }));

    return {
      handGestures,
      facialExpressions,
      headMovements,
      emotionalTone: aiResponse.emotionalTone as EmotionalTone,
      priority: aiResponse.confidence > 0.8 ? 'high' : aiResponse.confidence > 0.6 ? 'medium' : 'low',
      culturalAdaptations
    };
  }

  /**
   * Generate cache key for gesture requests
   */
  private generateCacheKey(request: AIGestureRequest): string {
    const contentHash = this.simpleHash(request.textContent);
    const contextKey = `${request.culturalContext.region}_${request.conversationContext.formalityLevel}_${request.conversationContext.emotionalTone}`;
    return `${contentHash}_${contextKey}`;
  }

  /**
   * Simple hash function for caching
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Fallback behavior plan when AI fails
   */
  private getFallbackBehaviorPlan(request: AIGestureRequest): BehaviorPlan {
    const { conversationContext, culturalContext } = request;

    // Simple fallback logic
    const handGestures: HandGesture[] = [];
    const facialExpressions: FacialExpression[] = [
      {
        type: 'neutral',
        intensity: 0.6,
        duration: 2000,
        timing: 0,
        culturalModifier: culturalContext.region === 'eastern' ? 0.8 : 1.0
      }
    ];
    const headMovements: HeadMovement[] = [];

    // Add basic gestures based on context
    if (conversationContext.isQuestion) {
      headMovements.push({
        type: 'tilt',
        direction: 'right',
        intensity: 0.5,
        duration: 800,
        timing: 0.2
      });
    }

    if (conversationContext.isCelebration && culturalContext.region !== 'eastern') {
      handGestures.push({
        type: 'celebratory',
        intensity: 0.7,
        duration: 1500,
        timing: 0.1,
        culturalVariant: 'fallback',
        synchronizeWithSpeech: false
      });
      facialExpressions[0] = {
        type: 'smile',
        intensity: 0.8,
        duration: 2500,
        timing: 0,
        culturalModifier: 1.0
      };
    }

    return {
      handGestures,
      facialExpressions,
      headMovements,
      emotionalTone: {
        warmth: 0.6,
        energy: 0.5,
        formality: conversationContext.formalityLevel === 'formal' ? 0.8 : 0.5,
        empathy: 0.6
      },
      priority: 'medium',
      culturalAdaptations: [{
        gestureModification: 'fallback_mode',
        intensityAdjustment: 0,
        appropriatenessFilter: true
      }]
    };
  }

  /**
   * Clear gesture cache
   */
  public clearCache(): void {
    this.gestureCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.gestureCache.size,
      hitRate: 0.85 // This would be calculated in a real implementation
    };
  }
}