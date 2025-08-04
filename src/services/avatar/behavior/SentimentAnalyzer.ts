/**
 * Real-time sentiment analysis for avatar behavior control
 */

import { SentimentData } from './types';

export class SentimentAnalyzer {
  private positiveWords: Set<string>;
  private negativeWords: Set<string>;
  private intensifiers: Set<string>;
  private emotionalPatterns: Map<string, number>;

  constructor() {
    this.initializeWordLists();
    this.initializeEmotionalPatterns();
  }

  /**
   * Analyzes sentiment of given text content
   */
  public analyzeSentiment(text: string): SentimentData {
    const cleanText = this.preprocessText(text);
    const words = cleanText.split(/\s+/);
    
    let positiveScore = 0;
    let negativeScore = 0;
    let intensityMultiplier = 1;
    const emotionalTags: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      
      // Check for intensifiers
      if (this.intensifiers.has(word)) {
        intensityMultiplier = Math.min(intensityMultiplier * 1.5, 3);
        continue;
      }

      // Analyze sentiment
      if (this.positiveWords.has(word)) {
        positiveScore += intensityMultiplier;
        emotionalTags.push('positive');
      } else if (this.negativeWords.has(word)) {
        negativeScore += intensityMultiplier;
        emotionalTags.push('negative');
      }

      // Check emotional patterns
      for (const [pattern, score] of this.emotionalPatterns.entries()) {
        if (word.includes(pattern)) {
          if (score > 0) {
            positiveScore += score * intensityMultiplier;
            emotionalTags.push(pattern);
          } else {
            negativeScore += Math.abs(score) * intensityMultiplier;
            emotionalTags.push(pattern);
          }
        }
      }

      // Reset intensifier after each word
      intensityMultiplier = 1;
    }

    // Calculate polarity (-1 to 1)
    const totalScore = positiveScore + negativeScore;
    const polarity = totalScore === 0 ? 0 : (positiveScore - negativeScore) / totalScore;
    
    // Calculate subjectivity (0 to 1)
    const subjectivity = Math.min(totalScore / words.length, 1);
    
    // Calculate confidence based on word count and emotional indicators
    const confidence = Math.min(
      (totalScore / words.length) * 0.7 + 
      (emotionalTags.length / words.length) * 0.3,
      1
    );

    return {
      polarity,
      subjectivity,
      confidence,
      emotionalTags: [...new Set(emotionalTags)]
    };
  }

  /**
   * Detects specific emotional contexts from text
   */
  public detectEmotionalContext(text: string, sentimentData: SentimentData): string[] {
    const contexts: string[] = [];
    const lowerText = text.toLowerCase();

    // Joy indicators
    if (sentimentData.polarity > 0.3 && (
      lowerText.includes('great') || lowerText.includes('wonderful') || 
      lowerText.includes('excellent') || lowerText.includes('amazing')
    )) {
      contexts.push('joy');
    }

    // Excitement indicators
    if (sentimentData.polarity > 0.2 && sentimentData.emotionalTags.includes('positive') && (
      lowerText.includes('!') || lowerText.includes('wow') || 
      lowerText.includes('incredible') || lowerText.includes('fantastic')
    )) {
      contexts.push('excitement');
    }

    // Concern indicators
    if (sentimentData.polarity < -0.2 || (
      lowerText.includes('worry') || lowerText.includes('concern') || 
      lowerText.includes('problem') || lowerText.includes('issue')
    )) {
      contexts.push('concern');
    }

    // Focus/instruction indicators
    if (lowerText.includes('let me explain') || lowerText.includes('here\'s how') || 
        lowerText.includes('step by step') || lowerText.includes('important')) {
      contexts.push('focus');
    }

    // Empathy indicators
    if (lowerText.includes('understand') || lowerText.includes('feel') || 
        lowerText.includes('sorry') || lowerText.includes('support')) {
      contexts.push('empathy');
    }

    return contexts.length > 0 ? contexts : ['neutral'];
  }

  private preprocessText(text: string): string {
    return text
      .replace(/[^\w\s!?.,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private initializeWordLists(): void {
    this.positiveWords = new Set([
      'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'perfect',
      'love', 'like', 'enjoy', 'happy', 'pleased', 'delighted', 'thrilled',
      'success', 'achievement', 'victory', 'win', 'accomplish', 'complete',
      'beautiful', 'brilliant', 'outstanding', 'superb', 'magnificent',
      'yes', 'absolutely', 'definitely', 'certainly', 'sure', 'correct'
    ]);

    this.negativeWords = new Set([
      'bad', 'terrible', 'awful', 'horrible', 'disappointing', 'frustrating',
      'hate', 'dislike', 'annoying', 'irritating', 'upset', 'angry', 'sad',
      'failure', 'mistake', 'error', 'wrong', 'incorrect', 'problem',
      'difficult', 'hard', 'challenging', 'struggle', 'trouble', 'issue',
      'no', 'never', 'nothing', 'nobody', 'nowhere', 'impossible'
    ]);

    this.intensifiers = new Set([
      'very', 'extremely', 'incredibly', 'absolutely', 'completely', 'totally',
      'really', 'quite', 'rather', 'pretty', 'so', 'too', 'highly'
    ]);
  }

  private initializeEmotionalPatterns(): void {
    this.emotionalPatterns = new Map([
      ['excit', 0.8],
      ['thrill', 0.9],
      ['amaz', 0.7],
      ['wonder', 0.6],
      ['disappoint', -0.7],
      ['frustrat', -0.6],
      ['concern', -0.5],
      ['worry', -0.6],
      ['celebrat', 0.8],
      ['congratulat', 0.7]
    ]);
  }
}