// Quality Tracking Service for AI Responses

export interface QualityMetrics {
  interactionId: string;
  timestamp: Date;
  responseTime: number;
  confidence: number;
  userSatisfaction?: number;
  escalated: boolean;
  errorOccurred: boolean;
  contextRelevance: number;
  responseLength: number;
  containedFallback: boolean;
}

export interface QualityReport {
  averageConfidence: number;
  averageResponseTime: number;
  escalationRate: number;
  errorRate: number;
  userSatisfactionScore: number;
  totalInteractions: number;
  timeframe: {
    start: Date;
    end: Date;
  };
  recommendations: string[];
}

export class QualityTracker {
  private metrics: QualityMetrics[] = [];
  private readonly MAX_STORED_METRICS = 1000;

  /**
   * Records quality metrics for an AI interaction
   */
  recordInteraction(metrics: Omit<QualityMetrics, 'timestamp'>): void {
    const fullMetrics: QualityMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.metrics.push(fullMetrics);

    // Keep only recent metrics to prevent memory issues
    if (this.metrics.length > this.MAX_STORED_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_STORED_METRICS);
    }

    // Log for monitoring (privacy-safe)
    this.logMetrics(fullMetrics);
  }

  /**
   * Records user satisfaction rating
   */
  recordUserSatisfaction(interactionId: string, rating: number): void {
    const metric = this.metrics.find(m => m.interactionId === interactionId);
    if (metric) {
      metric.userSatisfaction = Math.max(1, Math.min(5, rating));
    }
  }

  /**
   * Calculates confidence score based on response characteristics
   */
  calculateConfidence(response: string, context: any): number {
    let confidence = 0.8; // Base confidence

    // Response length analysis
    if (response.length < 20) confidence -= 0.3; // Too short
    if (response.length > 1000) confidence -= 0.2; // Too long

    // Uncertainty indicators
    const uncertaintyPhrases = [
      'i\'m not sure', 'i don\'t know', 'maybe', 'perhaps', 
      'i think', 'possibly', 'might be', 'could be'
    ];
    
    const uncertaintyCount = uncertaintyPhrases.reduce((count, phrase) => {
      return count + (response.toLowerCase().includes(phrase) ? 1 : 0);
    }, 0);
    
    confidence -= (uncertaintyCount * 0.15);

    // Positive indicators
    const positiveIndicators = [
      'here\'s how', 'step by step', 'let me help', 'i can help',
      'here\'s what you need', 'follow these steps'
    ];
    
    const positiveCount = positiveIndicators.reduce((count, phrase) => {
      return count + (response.toLowerCase().includes(phrase) ? 1 : 0);
    }, 0);
    
    confidence += (positiveCount * 0.1);

    // Context relevance
    if (context.currentPage && response.toLowerCase().includes(context.currentPage.toLowerCase())) {
      confidence += 0.1;
    }

    // Senior-friendly language check
    if (this.isSeniorFriendly(response)) {
      confidence += 0.1;
    } else {
      confidence -= 0.2;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Evaluates context relevance of the response
   */
  evaluateContextRelevance(response: string, context: any): number {
    let relevance = 0.5; // Base relevance

    // Check if response addresses the current page/tutorial
    if (context.currentPage && response.toLowerCase().includes(context.currentPage.toLowerCase())) {
      relevance += 0.2;
    }

    if (context.currentTutorial && response.toLowerCase().includes('tutorial')) {
      relevance += 0.2;
    }

    // Check for generic responses (lower relevance)
    const genericPhrases = [
      'i can help you with that',
      'let me assist you',
      'here are some options',
      'you can try'
    ];

    if (genericPhrases.some(phrase => response.toLowerCase().includes(phrase))) {
      relevance -= 0.1;
    }

    return Math.max(0.0, Math.min(1.0, relevance));
  }

  /**
   * Generates a quality report for a given timeframe
   */
  generateReport(days: number = 7): QualityReport {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffDate);

    if (recentMetrics.length === 0) {
      return this.getEmptyReport(cutoffDate, new Date());
    }

    const totalInteractions = recentMetrics.length;
    const escalatedCount = recentMetrics.filter(m => m.escalated).length;
    const errorCount = recentMetrics.filter(m => m.errorOccurred).length;
    
    const averageConfidence = recentMetrics.reduce((sum, m) => sum + m.confidence, 0) / totalInteractions;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalInteractions;
    
    const satisfactionRatings = recentMetrics.filter(m => m.userSatisfaction !== undefined);
    const userSatisfactionScore = satisfactionRatings.length > 0 
      ? satisfactionRatings.reduce((sum, m) => sum + (m.userSatisfaction || 0), 0) / satisfactionRatings.length
      : 0;

    return {
      averageConfidence,
      averageResponseTime,
      escalationRate: escalatedCount / totalInteractions,
      errorRate: errorCount / totalInteractions,
      userSatisfactionScore,
      totalInteractions,
      timeframe: {
        start: cutoffDate,
        end: new Date()
      },
      recommendations: this.generateRecommendations(recentMetrics)
    };
  }

  /**
   * Checks if response uses senior-friendly language
   */
  private isSeniorFriendly(response: string): boolean {
    // Check for complex technical terms
    const technicalTerms = [
      'api', 'json', 'xml', 'http', 'ssl', 'url', 'html', 'css',
      'javascript', 'database', 'server', 'cache', 'cookie'
    ];

    const hasTechnicalTerms = technicalTerms.some(term => 
      response.toLowerCase().includes(term)
    );

    if (hasTechnicalTerms) return false;

    // Check for encouraging language
    const encouragingPhrases = [
      'you\'re doing great', 'don\'t worry', 'take your time',
      'that\'s a good question', 'let\'s work through this together',
      'you\'ve got this', 'no problem'
    ];

    const hasEncouragement = encouragingPhrases.some(phrase =>
      response.toLowerCase().includes(phrase)
    );

    // Check for clear, simple language
    const sentences = response.split(/[.!?]+/);
    const averageSentenceLength = sentences.reduce((sum, sentence) => 
      sum + sentence.trim().split(' ').length, 0) / sentences.length;

    const isSimpleLanguage = averageSentenceLength < 20; // Average sentence under 20 words

    return hasEncouragement || isSimpleLanguage;
  }

  /**
   * Generates recommendations based on quality metrics
   */
  private generateRecommendations(metrics: QualityMetrics[]): string[] {
    const recommendations: string[] = [];

    const avgConfidence = metrics.reduce((sum, m) => sum + m.confidence, 0) / metrics.length;
    const escalationRate = metrics.filter(m => m.escalated).length / metrics.length;
    const errorRate = metrics.filter(m => m.errorOccurred).length / metrics.length;

    if (avgConfidence < 0.6) {
      recommendations.push('Consider improving AI model training for senior-specific use cases');
    }

    if (escalationRate > 0.2) {
      recommendations.push('High escalation rate detected - review common failure patterns');
    }

    if (errorRate > 0.1) {
      recommendations.push('Error rate is elevated - investigate technical issues');
    }

    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    if (avgResponseTime > 5000) { // 5 seconds
      recommendations.push('Response times are slow - optimize AI service performance');
    }

    const satisfactionRatings = metrics.filter(m => m.userSatisfaction !== undefined);
    if (satisfactionRatings.length > 0) {
      const avgSatisfaction = satisfactionRatings.reduce((sum, m) => sum + (m.userSatisfaction || 0), 0) / satisfactionRatings.length;
      if (avgSatisfaction < 3.5) {
        recommendations.push('User satisfaction is below target - review response quality and tone');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('AI service performance is meeting quality targets');
    }

    return recommendations;
  }

  /**
   * Logs metrics in a privacy-safe manner
   */
  private logMetrics(metrics: QualityMetrics): void {
    // Create privacy-safe log entry
    const logEntry = {
      timestamp: metrics.timestamp.toISOString(),
      responseTime: metrics.responseTime,
      confidence: metrics.confidence,
      escalated: metrics.escalated,
      errorOccurred: metrics.errorOccurred,
      responseLength: metrics.responseLength,
      // Don't log interaction ID or other potentially identifying info
    };

    console.log('AI Quality Metrics:', logEntry);

    // In a real implementation, send to analytics service
    // this.analyticsService.track('ai_interaction_quality', logEntry);
  }

  /**
   * Returns an empty report structure
   */
  private getEmptyReport(start: Date, end: Date): QualityReport {
    return {
      averageConfidence: 0,
      averageResponseTime: 0,
      escalationRate: 0,
      errorRate: 0,
      userSatisfactionScore: 0,
      totalInteractions: 0,
      timeframe: { start, end },
      recommendations: ['No interactions recorded in this timeframe']
    };
  }

  /**
   * Clears old metrics to prevent memory issues
   */
  clearOldMetrics(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffDate);
  }

  /**
   * Gets current metrics count
   */
  getMetricsCount(): number {
    return this.metrics.length;
  }
}