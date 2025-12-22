export interface ParsedAIResponse {
    display_text: string;
    spoken_text: string;
    new_facts: string[];
    flashcards?: any[] | null;
}

/**
 * Standardizes AI responses from different providers into a unified structure.
 * Handles JSON extraction, field mapping, and flashcard formatting.
 */
export function parseAIJSONResponse(rawText: string): ParsedAIResponse {
    const result: ParsedAIResponse = {
        display_text: rawText,
        spoken_text: rawText,
        new_facts: []
    };

    try {
        // 1. Precise JSON extraction
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            // 2. Map core fields with fallbacks
            result.display_text = parsed.display_text || parsed.content || parsed.text || rawText;
            result.spoken_text = parsed.spoken_text || parsed.speech || result.display_text;

            // Handle facts
            result.new_facts = Array.isArray(parsed.new_facts) ? parsed.new_facts : (parsed.facts ? [parsed.facts].flat() : []);

            // 3. Robust Flashcard Extraction
            // AI models sometimes use different keys like 'steps' or 'guide'
            const rawFlashcards = parsed.flashcards || parsed.steps || parsed.guide || parsed.instructions;

            if (Array.isArray(rawFlashcards)) {
                result.flashcards = rawFlashcards.map((step: any, index: number) => {
                    // Ensure every step matches the FlashcardStep interface
                    return {
                        id: step.id || `step-${index + 1}`,
                        stepNumber: step.stepNumber || index + 1,
                        title: step.title || step.name || `Step ${index + 1}`,
                        content: step.content || step.description || step.instruction || '',
                        instructions: Array.isArray(step.instructions) ? step.instructions : (step.details ? [step.details] : []),
                        audioScript: step.audioScript || step.speech || `${step.title || 'Next step'}. ${step.content || ''}`,
                        estimatedDuration: step.estimatedDuration || 30
                    };
                });
            } else {
                result.flashcards = null;
            }

            // 4. Clean spoken text (remove markdown symbols that confuse TTS)
            result.spoken_text = result.spoken_text.replace(/[*#_\[\]]/g, '');
        }
    } catch (e) {
        console.warn('⚠️ Unified Parser: Failed to parse JSON, falling back to raw text.', e);
    }

    return result;
}
