export interface ParsedAIResponse {
    display_text: string;
    spoken_text: string;
    new_facts: string[];
    flashcards?: any;
}

export function parseAIJSONResponse(rawText: string): ParsedAIResponse {
    // Default values
    const result: ParsedAIResponse = {
        display_text: rawText,
        spoken_text: rawText,
        new_facts: []
    };

    try {
        // Attempt to find JSON block
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            // Map common variations to our standard structure
            result.display_text = parsed.display_text || parsed.content || parsed.text || rawText;
            result.spoken_text = parsed.spoken_text || parsed.speech || result.display_text;
            result.new_facts = Array.isArray(parsed.new_facts) ? parsed.new_facts : (parsed.facts ? [parsed.facts] : []);
            result.flashcards = parsed.flashcards || null;

            // Clean up spoken_text (remove markdown if any)
            result.spoken_text = result.spoken_text.replace(/[*#_\[\]]/g, '');
        }
    } catch (e) {
        console.warn('Failed to parse AI JSON:', e);
    }

    return result;
}
