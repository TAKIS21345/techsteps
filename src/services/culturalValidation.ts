import { SUPPORTED_LANGUAGES } from '../i18n';

export interface CulturalColorGuideline {
  color: string;
  meaning: string;
  appropriate: boolean;
  alternatives?: string[];
  regions: string[];
}

export interface CulturalSymbolGuideline {
  symbol: string;
  meaning: string;
  appropriate: boolean;
  alternatives?: string[];
  regions: string[];
}

export interface CulturalValidationResult {
  language: string;
  region: string;
  colorIssues: CulturalColorGuideline[];
  symbolIssues: CulturalSymbolGuideline[];
  recommendations: string[];
}

class CulturalValidationService {
  private colorGuidelines: Record<string, CulturalColorGuideline[]> = {
    'zh': [
      {
        color: 'red',
        meaning: 'Good fortune, prosperity, joy',
        appropriate: true,
        regions: ['China', 'Taiwan', 'Singapore']
      },
      {
        color: 'white',
        meaning: 'Death, mourning',
        appropriate: false,
        alternatives: ['light blue', 'light green'],
        regions: ['China', 'Taiwan']
      },
      {
        color: 'yellow',
        meaning: 'Imperial color, prosperity',
        appropriate: true,
        regions: ['China']
      }
    ],
    'ar': [
      {
        color: 'green',
        meaning: 'Islam, paradise, nature',
        appropriate: true,
        regions: ['Middle East', 'North Africa']
      },
      {
        color: 'blue',
        meaning: 'Protection, spirituality',
        appropriate: true,
        regions: ['Middle East', 'North Africa']
      },
      {
        color: 'yellow',
        meaning: 'Betrayal, cowardice (in some contexts)',
        appropriate: false,
        alternatives: ['gold', 'amber'],
        regions: ['Some Middle Eastern countries']
      }
    ],
    'hi': [
      {
        color: 'saffron',
        meaning: 'Courage, sacrifice, spirituality',
        appropriate: true,
        regions: ['India']
      },
      {
        color: 'white',
        meaning: 'Peace, purity',
        appropriate: true,
        regions: ['India']
      },
      {
        color: 'green',
        meaning: 'Fertility, prosperity',
        appropriate: true,
        regions: ['India']
      }
    ],
    'ja': [
      {
        color: 'red',
        meaning: 'Life, vitality, good fortune',
        appropriate: true,
        regions: ['Japan']
      },
      {
        color: 'white',
        meaning: 'Purity, cleanliness',
        appropriate: true,
        regions: ['Japan']
      },
      {
        color: 'black',
        meaning: 'Formality, elegance',
        appropriate: true,
        regions: ['Japan']
      }
    ]
  };

  private symbolGuidelines: Record<string, CulturalSymbolGuideline[]> = {
    'zh': [
      {
        symbol: '🦇',
        meaning: 'Good luck, happiness',
        appropriate: true,
        regions: ['China']
      },
      {
        symbol: '🕐',
        meaning: 'Death (giving clocks as gifts)',
        appropriate: false,
        alternatives: ['⏰', '📅'],
        regions: ['China', 'Taiwan']
      },
      {
        symbol: '4️⃣',
        meaning: 'Death (number 4)',
        appropriate: false,
        alternatives: ['other numbers'],
        regions: ['China', 'Japan', 'Korea']
      }
    ],
    'ar': [
      {
        symbol: '👍',
        meaning: 'Can be offensive in some contexts',
        appropriate: false,
        alternatives: ['✅', '👌'],
        regions: ['Some Middle Eastern countries']
      },
      {
        symbol: '🐷',
        meaning: 'Religiously inappropriate',
        appropriate: false,
        alternatives: ['🐑', '🐄'],
        regions: ['Muslim-majority countries']
      }
    ],
    'hi': [
      {
        symbol: '🐄',
        meaning: 'Sacred animal',
        appropriate: true,
        regions: ['India']
      },
      {
        symbol: '🕉️',
        meaning: 'Sacred symbol',
        appropriate: true,
        regions: ['India']
      }
    ]
  };

  /**
   * Validate cultural appropriateness for a specific language/region
   */
  validateCulturalAppropriatenesss(language: string): CulturalValidationResult {
    const region = this.getRegionForLanguage(language);
    
    const colorIssues = this.colorGuidelines[language] || [];
    const symbolIssues = this.symbolGuidelines[language] || [];
    
    const recommendations = this.generateRecommendations(language, colorIssues, symbolIssues);

    return {
      language,
      region,
      colorIssues: colorIssues.filter(c => !c.appropriate),
      symbolIssues: symbolIssues.filter(s => !s.appropriate),
      recommendations
    };
  }

  /**
   * Check if a specific color is culturally appropriate
   */
  isColorAppropriate(color: string, language: string): boolean {
    const guidelines = this.colorGuidelines[language];
    if (!guidelines) return true;

    const colorGuideline = guidelines.find(g => g.color.toLowerCase() === color.toLowerCase());
    return !colorGuideline || colorGuideline.appropriate;
  }

  /**
   * Check if a specific symbol is culturally appropriate
   */
  isSymbolAppropriate(symbol: string, language: string): boolean {
    const guidelines = this.symbolGuidelines[language];
    if (!guidelines) return true;

    const symbolGuideline = guidelines.find(g => g.symbol === symbol);
    return !symbolGuideline || symbolGuideline.appropriate;
  }

  /**
   * Get alternative colors for a language
   */
  getColorAlternatives(color: string, language: string): string[] {
    const guidelines = this.colorGuidelines[language];
    if (!guidelines) return [];

    const colorGuideline = guidelines.find(g => g.color.toLowerCase() === color.toLowerCase());
    return colorGuideline?.alternatives || [];
  }

  /**
   * Get alternative symbols for a language
   */
  getSymbolAlternatives(symbol: string, language: string): string[] {
    const guidelines = this.symbolGuidelines[language];
    if (!guidelines) return [];

    const symbolGuideline = guidelines.find(g => g.symbol === symbol);
    return symbolGuideline?.alternatives || [];
  }

  /**
   * Get culturally appropriate colors for a language
   */
  getAppropriateColors(language: string): CulturalColorGuideline[] {
    const guidelines = this.colorGuidelines[language];
    if (!guidelines) return [];

    return guidelines.filter(g => g.appropriate);
  }

  /**
   * Get culturally appropriate symbols for a language
   */
  getAppropriateSymbols(language: string): CulturalSymbolGuideline[] {
    const guidelines = this.symbolGuidelines[language];
    if (!guidelines) return [];

    return guidelines.filter(g => g.appropriate);
  }

  /**
   * Validate UI elements for cultural appropriateness
   */
  validateUIElements(elements: { type: 'color' | 'symbol'; value: string }[], language: string): {
    element: { type: 'color' | 'symbol'; value: string };
    appropriate: boolean;
    alternatives: string[];
    reason: string;
  }[] {
    return elements.map(element => {
      if (element.type === 'color') {
        const appropriate = this.isColorAppropriate(element.value, language);
        const alternatives = this.getColorAlternatives(element.value, language);
        const guideline = this.colorGuidelines[language]?.find(g => g.color.toLowerCase() === element.value.toLowerCase());
        
        return {
          element,
          appropriate,
          alternatives,
          reason: guideline?.meaning || 'No specific cultural meaning found'
        };
      } else {
        const appropriate = this.isSymbolAppropriate(element.value, language);
        const alternatives = this.getSymbolAlternatives(element.value, language);
        const guideline = this.symbolGuidelines[language]?.find(g => g.symbol === element.value);
        
        return {
          element,
          appropriate,
          alternatives,
          reason: guideline?.meaning || 'No specific cultural meaning found'
        };
      }
    });
  }

  /**
   * Get region for language code
   */
  private getRegionForLanguage(language: string): string {
    const regionMap: Record<string, string> = {
      'zh': 'East Asia',
      'ja': 'East Asia',
      'ko': 'East Asia',
      'ar': 'Middle East & North Africa',
      'he': 'Middle East',
      'hi': 'South Asia',
      'th': 'Southeast Asia',
      'vi': 'Southeast Asia',
      'ru': 'Eastern Europe',
      'tr': 'Western Asia',
      'fa': 'Central Asia'
    };

    return regionMap[language] || 'Global';
  }

  /**
   * Generate cultural recommendations
   */
  private generateRecommendations(
    language: string, 
    colorIssues: CulturalColorGuideline[], 
    symbolIssues: CulturalSymbolGuideline[]
  ): string[] {
    const recommendations: string[] = [];
    const langInfo = SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES];

    if (langInfo?.rtl) {
      recommendations.push('Ensure all layouts are properly mirrored for right-to-left reading');
      recommendations.push('Test navigation flows with RTL text direction');
    }

    if (colorIssues.length > 0) {
      recommendations.push(`Avoid using ${colorIssues.map(c => c.color).join(', ')} as primary colors`);
      recommendations.push('Consider cultural color meanings when choosing UI colors');
    }

    if (symbolIssues.length > 0) {
      recommendations.push(`Replace symbols: ${symbolIssues.map(s => s.symbol).join(', ')}`);
      recommendations.push('Use culturally neutral symbols when possible');
    }

    // Language-specific recommendations
    switch (language) {
      case 'zh':
        recommendations.push('Use red for positive actions and success states');
        recommendations.push('Avoid white backgrounds for important content');
        break;
      case 'ar':
        recommendations.push('Use green for positive states and confirmations');
        recommendations.push('Ensure proper Arabic typography and font support');
        break;
      case 'hi':
        recommendations.push('Consider using saffron/orange for important elements');
        recommendations.push('Respect religious symbols and imagery');
        break;
      case 'ja':
        recommendations.push('Maintain clean, minimalist design principles');
        recommendations.push('Use appropriate honorific language in text');
        break;
    }

    return recommendations;
  }
}

export const culturalValidationService = new CulturalValidationService();