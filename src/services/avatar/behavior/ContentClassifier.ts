/**
 * Content type classification for avatar behavior control
 */

import { ContentClassificationResult } from './types';

export class ContentClassifier {
  private questionPatterns: RegExp[];
  private explanationPatterns: RegExp[];
  private celebrationPatterns: RegExp[];
  private instructionPatterns: RegExp[];
  private greetingPatterns: RegExp[];
  private farewellPatterns: RegExp[];

  constructor() {
    this.initializePatterns();
  }

  /**
   * Classifies content type based on text analysis
   */
  public classifyContent(text: string): ContentClassificationResult {
    const lowerText = text.toLowerCase();
    const features: Record<string, number> = {};
    const scores: Record<string, number> = {
      question: 0,
      explanation: 0,
      celebration: 0,
      instruction: 0,
      greeting: 0,
      farewell: 0
    };

    // Question detection
    features.hasQuestionMark = text.includes('?') ? 1 : 0;
    features.questionWords = this.countMatches(lowerText, this.questionPatterns);
    scores.question = features.hasQuestionMark * 0.4 + features.questionWords * 0.6;

    // Explanation detection
    features.explanationPhrases = this.countMatches(lowerText, this.explanationPatterns);
    features.hasConjunctions = this.countConjunctions(lowerText);
    scores.explanation = features.explanationPhrases * 0.7 + features.hasConjunctions * 0.3;

    // Celebration detection
    features.celebrationWords = this.countMatches(lowerText, this.celebrationPatterns);
    features.hasExclamation = text.includes('!') ? 1 : 0;
    scores.celebration = features.celebrationWords * 0.6 + features.hasExclamation * 0.4;

    // Instruction detection
    features.instructionPhrases = this.countMatches(lowerText, this.instructionPatterns);
    features.hasImperativeVerbs = this.countImperativeVerbs(lowerText);
    scores.instruction = features.instructionPhrases * 0.5 + features.hasImperativeVerbs * 0.5;

    // Greeting detection
    features.greetingPhrases = this.countMatches(lowerText, this.greetingPatterns);
    scores.greeting = features.greetingPhrases;

    // Farewell detection
    features.farewellPhrases = this.countMatches(lowerText, this.farewellPatterns);
    scores.farewell = features.farewellPhrases;

    // Find primary type
    const primaryType = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    // Get secondary types (scores > 0.3)
    const secondaryTypes = Object.entries(scores)
      .filter(([type, score]) => type !== primaryType && score > 0.3)
      .map(([type]) => type);

    // Calculate confidence
    const maxScore = Math.max(...Object.values(scores));
    const confidence = Math.min(maxScore, 1);

    return {
      primaryType,
      secondaryTypes,
      confidence,
      features
    };
  }

  /**
   * Extracts key phrases from text for behavior context
   */
  public extractKeyPhrases(text: string): string[] {
    const phrases: string[] = [];
    const lowerText = text.toLowerCase();

    // Extract important nouns and adjectives
    const words = lowerText.split(/\s+/);
    const importantWords = words.filter(word => 
      word.length > 3 && 
      !this.isStopWord(word) &&
      !word.match(/^\d+$/)
    );

    // Extract phrases with emotional significance
    const emotionalPhrases = [
      'well done', 'great job', 'excellent work', 'keep going',
      'let me explain', 'here\'s how', 'step by step', 'for example',
      'what do you think', 'how about', 'can you', 'would you like',
      'congratulations', 'celebration', 'achievement', 'success'
    ];

    emotionalPhrases.forEach(phrase => {
      if (lowerText.includes(phrase)) {
        phrases.push(phrase);
      }
    });

    // Add significant individual words
    phrases.push(...importantWords.slice(0, 5));

    return [...new Set(phrases)];
  }

  private countMatches(text: string, patterns: RegExp[]): number {
    return patterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  private countConjunctions(text: string): number {
    const conjunctions = ['because', 'since', 'therefore', 'however', 'moreover', 'furthermore'];
    return conjunctions.reduce((count, conj) => 
      count + (text.includes(conj) ? 1 : 0), 0
    );
  }

  private countImperativeVerbs(text: string): number {
    const imperatives = ['click', 'press', 'select', 'choose', 'try', 'remember', 'note', 'see'];
    return imperatives.reduce((count, verb) => 
      count + (text.includes(verb) ? 1 : 0), 0
    );
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);
    return stopWords.has(word);
  }

  private initializePatterns(): void {
    this.questionPatterns = [
      /\b(what|how|why|when|where|who|which|can|could|would|should|do|does|did|is|are|was|were)\b/g,
      /\b(tell me|explain|help me understand)\b/g
    ];

    this.explanationPatterns = [
      /\b(because|since|therefore|thus|hence|so|as a result)\b/g,
      /\b(let me explain|here's how|the reason|this means)\b/g,
      /\b(for example|for instance|such as|like)\b/g
    ];

    this.celebrationPatterns = [
      /\b(congratulations|celebrate|achievement|success|victory|win|excellent|amazing|fantastic|wonderful)\b/g,
      /\b(well done|great job|keep it up|you did it)\b/g
    ];

    this.instructionPatterns = [
      /\b(step|first|second|third|next|then|finally|now)\b/g,
      /\b(click|press|select|choose|try|remember|note|follow)\b/g,
      /\b(let's|you need to|you should|make sure)\b/g
    ];

    this.greetingPatterns = [
      /\b(hello|hi|hey|good morning|good afternoon|good evening|welcome)\b/g,
      /\b(nice to meet|pleased to meet|how are you)\b/g
    ];

    this.farewellPatterns = [
      /\b(goodbye|bye|farewell|see you|take care|have a good)\b/g,
      /\b(until next time|talk soon|catch you later)\b/g
    ];
  }
}