import Cookies from 'js-cookie';

export interface UserPreferences {
  theme: 'light' | 'dark';
  textToSpeech: boolean;
  voiceInput: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  videoRecommendations: boolean;
}

export interface UserInteraction {
  type: 'question' | 'resource_click' | 'feature_use';
  data: any;
  timestamp: string;
}

export class CookieManager {
  private static readonly PREFERENCES_KEY = 'userPreferences';
  private static readonly INTERACTIONS_KEY = 'userInteractions';
  private static readonly USERNAME_KEY = 'userName';
  private static readonly ONBOARDING_KEY = 'onboardingCompleted';

  static savePreferences(preferences: UserPreferences): void {
    Cookies.set(this.PREFERENCES_KEY, JSON.stringify(preferences), { 
      expires: 365,
      secure: window.location.protocol === 'https:',
      sameSite: 'strict'
    });
  }

  static getPreferences(): UserPreferences | null {
    const stored = Cookies.get(this.PREFERENCES_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing stored preferences:', error);
        return null;
      }
    }
    return null;
  }

  static saveUserName(name: string): void {
    Cookies.set(this.USERNAME_KEY, name, { 
      expires: 365,
      secure: window.location.protocol === 'https:',
      sameSite: 'strict'
    });
  }

  static getUserName(): string | null {
    return Cookies.get(this.USERNAME_KEY) || null;
  }

  static markOnboardingCompleted(): void {
    Cookies.set(this.ONBOARDING_KEY, 'true', { 
      expires: 365,
      secure: window.location.protocol === 'https:',
      sameSite: 'strict'
    });
  }

  static isOnboardingCompleted(): boolean {
    return Cookies.get(this.ONBOARDING_KEY) === 'true';
  }

  static logInteraction(interaction: UserInteraction): void {
    const interactions = this.getInteractions();
    interactions.push(interaction);
    
    // Keep only last 100 interactions
    const trimmed = interactions.slice(-100);
    
    Cookies.set(this.INTERACTIONS_KEY, JSON.stringify(trimmed), { 
      expires: 30,
      secure: window.location.protocol === 'https:',
      sameSite: 'strict'
    });
  }

  static getInteractions(): UserInteraction[] {
    const stored = Cookies.get(this.INTERACTIONS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing stored interactions:', error);
        return [];
      }
    }
    return [];
  }

  static clearAllData(): void {
    Cookies.remove(this.PREFERENCES_KEY);
    Cookies.remove(this.INTERACTIONS_KEY);
    Cookies.remove(this.USERNAME_KEY);
    Cookies.remove(this.ONBOARDING_KEY);
  }

  static applyPreferences(preferences: UserPreferences): void {
    const root = document.documentElement;
    
    // Apply font size
    switch (preferences.fontSize) {
      case 'large':
        root.style.fontSize = '18px';
        break;
      case 'extra-large':
        root.style.fontSize = '22px';
        break;
      default:
        root.style.fontSize = '16px';
    }

    // Apply high contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply theme
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}