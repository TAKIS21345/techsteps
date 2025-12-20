export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
  lang?: string;
}

export interface TTSService {
  speak(text: string, options?: TTSOptions): Promise<void>;
  stop(): void;
  getVoices(): SpeechSynthesisVoice[];
  isSupported(): boolean;
  isSpeaking(): boolean;
  setCallbacks(callbacks: {
    onSpeakStart?: () => void;
    onSpeakEnd?: () => void;
    onAudioLevel?: (level: number) => void;
  }): void;
}

class BrowserTTSService implements TTSService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onSpeakStart?: () => void;
  private onSpeakEnd?: () => void;
  private onAudioLevel?: (level: number) => void;

  constructor() {
    // Ensure voices are loaded
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices();
    }
  }

  setCallbacks(callbacks: {
    onSpeakStart?: () => void;
    onSpeakEnd?: () => void;
    onAudioLevel?: (level: number) => void;
  }): void {
    this.onSpeakStart = callbacks.onSpeakStart;
    this.onSpeakEnd = callbacks.onSpeakEnd;
    this.onAudioLevel = callbacks.onAudioLevel;
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Speech synthesis not supported');
    }

    // Stop any current speech
    this.stop();

    // Clean text (remove markdown, HTML, etc.)
    const cleanText = this.cleanText(text);

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Set options for more natural, emotional speech
      utterance.rate = options.rate || 1.2; // Slightly faster, clearer
      utterance.pitch = options.pitch || 1.05; // Slightly higher pitch for warmth
      utterance.volume = options.volume || 1;
      utterance.lang = options.lang || 'en-US';

      // Set voice if specified
      if (options.voice) {
        const voices = this.getVoices();
        const selectedVoice = voices.find(v => v.name === options.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } else {
        // Select best male voice for the language with natural quality
        const voices = this.getVoices();
        const lang = utterance.lang;
        const langCode = lang.split('-')[0]; // e.g., 'en' from 'en-US'

        // Helper function to check if voice matches language
        const matchesLanguage = (voice: SpeechSynthesisVoice) => {
          return voice.lang.toLowerCase().startsWith(langCode.toLowerCase()) ||
            voice.lang.toLowerCase().includes(langCode.toLowerCase());
        };

        // Try to find a high-quality male voice for the exact language
        let preferredVoice = voices.find(v =>
          v.lang.toLowerCase() === lang.toLowerCase() &&
          v.name.toLowerCase().includes('male') &&
          !v.name.toLowerCase().includes('female')
        );

        // Fallback: Male voice for language code (e.g., 'en' matches 'en-US', 'en-GB')
        if (!preferredVoice) {
          preferredVoice = voices.find(v =>
            matchesLanguage(v) &&
            v.name.toLowerCase().includes('male') &&
            !v.name.toLowerCase().includes('female')
          );
        }

        // Fallback: Try specific good male voices by name for the language
        if (!preferredVoice) {
          const maleVoiceNames = [
            'Google US English Male', 'Microsoft David', 'Alex', 'Daniel',
            'Google UK English Male', 'Microsoft Mark', 'Thomas', 'Fred',
            'Google español', 'Microsoft Pablo', 'Diego', 'Jorge',
            'Google français', 'Microsoft Paul', 'Thomas',
            'Google Deutsch', 'Microsoft Stefan', 'Hans',
            'Google italiano', 'Microsoft Cosimo', 'Luca',
            'Google português', 'Microsoft Daniel', 'Felipe'
          ];
          preferredVoice = voices.find(v =>
            matchesLanguage(v) &&
            maleVoiceNames.some(name => v.name.includes(name))
          );
        }

        // Fallback: Any male voice for the language
        if (!preferredVoice) {
          preferredVoice = voices.find(v =>
            matchesLanguage(v) &&
            (v.name.includes('Male') || v.name.includes('Man') || v.name.includes('Homme'))
          );
        }

        // Fallback: Best quality voice for the language (any gender)
        if (!preferredVoice) {
          preferredVoice = voices.find(v =>
            matchesLanguage(v) &&
            (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Enhanced'))
          );
        }

        // Final fallback: Any voice for the language
        if (!preferredVoice) {
          preferredVoice = voices.find(v => matchesLanguage(v));
        }

        if (preferredVoice) {
          utterance.voice = preferredVoice;
          console.log('Selected TTS voice:', preferredVoice.name, 'for language:', preferredVoice.lang);
        } else {
          console.warn('No voice found for language:', lang, '- using default voice');
        }
      }

      // Event handlers
      utterance.onstart = () => {
        this.onSpeakStart?.();
        this.simulateAudioLevels();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        this.onSpeakEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        this.onSpeakEnd?.();
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (this.currentUtterance) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
      this.onSpeakEnd?.();
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices();
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  isSpeaking(): boolean {
    return speechSynthesis.speaking;
  }

  private cleanText(text: string): string {
    return text
      // Remove markdown bold/italic
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/__/g, '')
      .replace(/_/g, '')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`.*?`/g, '')
      // Remove headers
      .replace(/#{1,6}\s/g, '')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove HTML
      .replace(/<[^>]*>/g, '')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  private simulateAudioLevels(): void {
    if (!this.isSpeaking()) return;

    // Simulate audio levels for mouth animation
    const interval = setInterval(() => {
      if (!this.isSpeaking()) {
        clearInterval(interval);
        return;
      }

      // Generate realistic audio level (0.2 to 1.0)
      const level = 0.2 + Math.random() * 0.8;
      this.onAudioLevel?.(level);
    }, 100);
  }
}

// Google Cloud TTS Service
class GoogleTTSService implements TTSService {
  private projectId: string;
  private clientEmail: string;
  private privateKey: string;
  private currentAudio: HTMLAudioElement | null = null;
  private onSpeakStart?: () => void;
  private onSpeakEnd?: () => void;
  private onAudioLevel?: (level: number) => void;
  private audioLevelInterval?: NodeJS.Timeout;

  constructor(projectId: string, clientEmail: string, privateKey: string) {
    this.projectId = projectId;
    this.clientEmail = clientEmail;
    this.privateKey = privateKey;
  }

  setCallbacks(callbacks: {
    onSpeakStart?: () => void;
    onSpeakEnd?: () => void;
    onAudioLevel?: (level: number) => void;
  }): void {
    this.onSpeakStart = callbacks.onSpeakStart;
    this.onSpeakEnd = callbacks.onSpeakEnd;
    this.onAudioLevel = callbacks.onAudioLevel;
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    try {
      // Stop any current audio
      this.stop();

      // Clean text
      const cleanText = this.cleanText(text);

      // Get access token
      const accessToken = await this.getAccessToken();

      // Get the best voice for the language
      const voiceConfig = this.getVoiceForLanguage(options.lang || 'en-US');

      // Prepare TTS request
      const ttsRequest = {
        input: { text: cleanText },
        voice: {
          languageCode: voiceConfig.languageCode,
          name: voiceConfig.name,
          ssmlGender: voiceConfig.gender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: options.rate || 0.95, // Natural pace
          pitch: options.pitch || 1.5, // Warmer, more emotional tone
          volumeGainDb: 3, // Clear and audible
          effectsProfileId: ['headphone-class-device'] // Better audio quality
        }
      };

      // Call Google TTS API
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ttsRequest)
        }
      );

      if (!response.ok) {
        throw new Error(`Google TTS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.audioContent) {
        throw new Error('No audio content received from Google TTS');
      }

      // Play the audio
      await this.playAudio(data.audioContent);

    } catch (error) {
      console.error('Google TTS Error:', error);
      this.onSpeakEnd?.();
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    // Create JWT for Google Cloud authentication
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.clientEmail,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    // For client-side implementation, we'll use a simpler approach
    // In production, this should be done server-side for security
    const jwt = await this.createJWT(header, payload);

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  }

  private async createJWT(header: any, payload: any): Promise<string> {
    // Simple JWT creation for client-side (not recommended for production)
    const encoder = new TextEncoder();

    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const message = `${headerB64}.${payloadB64}`;

    // Import private key
    const privateKeyPem = this.privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\n/g, '');

    const privateKeyBuffer = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      encoder.encode(message)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    return `${message}.${signatureB64}`;
  }

  private async playAudio(audioContent: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create audio element
        const audio = new Audio();
        this.currentAudio = audio;

        // Convert base64 to blob URL
        const audioBlob = new Blob([
          Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))
        ], { type: 'audio/mp3' });

        const audioUrl = URL.createObjectURL(audioBlob);
        audio.src = audioUrl;

        // Set up event listeners
        audio.onloadstart = () => {
          this.onSpeakStart?.();
          this.startAudioLevelSimulation();
        };

        audio.onended = () => {
          this.stopAudioLevelSimulation();
          this.onSpeakEnd?.();
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = () => {
          this.stopAudioLevelSimulation();
          this.onSpeakEnd?.();
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(new Error('Audio playback failed'));
        };

        // Play the audio
        audio.play().catch(reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  private startAudioLevelSimulation(): void {
    let time = 0;
    this.audioLevelInterval = setInterval(() => {
      if (this.currentAudio && !this.currentAudio.paused) {
        // Create more realistic speech-like audio levels
        time += 0.1;
        const baseLevel = 0.4 + Math.sin(time * 3) * 0.2; // Slow wave for speech rhythm
        const variation = Math.random() * 0.4; // Random variation
        const speechPattern = Math.sin(time * 8) * 0.2; // Faster pattern for syllables

        const level = Math.max(0.1, Math.min(1.0, baseLevel + variation + speechPattern));
        this.onAudioLevel?.(level);
      }
    }, 80); // Slightly faster updates for smoother animation
  }

  private stopAudioLevelSimulation(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = undefined;
    }
    this.onAudioLevel?.(0);
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.stopAudioLevelSimulation();
    this.onSpeakEnd?.();
  }

  getVoices(): SpeechSynthesisVoice[] {
    // Return empty array for now - Google TTS voices are handled server-side
    return [];
  }

  isSupported(): boolean {
    return !!this.projectId && !!this.clientEmail && !!this.privateKey;
  }

  isSpeaking(): boolean {
    return this.currentAudio ? !this.currentAudio.paused : false;
  }

  private getVoiceForLanguage(languageCode: string): { languageCode: string; name: string; gender: string } {
    // Map of language codes to best male Google TTS voices with natural emotion
    const voiceMap: Record<string, { languageCode: string; name: string; gender: string }> = {
      'en-US': { languageCode: 'en-US', name: 'en-US-Neural2-D', gender: 'MALE' }, // Warm, friendly male voice
      'en-GB': { languageCode: 'en-GB', name: 'en-GB-Neural2-D', gender: 'MALE' }, // British male
      'en': { languageCode: 'en-US', name: 'en-US-Neural2-D', gender: 'MALE' }, // Default English
      'es-ES': { languageCode: 'es-ES', name: 'es-ES-Neural2-B', gender: 'MALE' }, // Spanish male
      'es-MX': { languageCode: 'es-MX', name: 'es-MX-Neural2-B', gender: 'MALE' }, // Mexican male
      'es': { languageCode: 'es-ES', name: 'es-ES-Neural2-B', gender: 'MALE' }, // Default Spanish
      'fr-FR': { languageCode: 'fr-FR', name: 'fr-FR-Neural2-B', gender: 'MALE' }, // French male
      'fr-CA': { languageCode: 'fr-CA', name: 'fr-CA-Neural2-B', gender: 'MALE' }, // Canadian French male
      'fr': { languageCode: 'fr-FR', name: 'fr-FR-Neural2-B', gender: 'MALE' }, // Default French
      'de-DE': { languageCode: 'de-DE', name: 'de-DE-Neural2-D', gender: 'MALE' }, // German male
      'de': { languageCode: 'de-DE', name: 'de-DE-Neural2-D', gender: 'MALE' }, // Default German
      'it-IT': { languageCode: 'it-IT', name: 'it-IT-Neural2-C', gender: 'MALE' }, // Italian male
      'it': { languageCode: 'it-IT', name: 'it-IT-Neural2-C', gender: 'MALE' }, // Default Italian
      'pt-BR': { languageCode: 'pt-BR', name: 'pt-BR-Neural2-B', gender: 'MALE' }, // Brazilian male
      'pt-PT': { languageCode: 'pt-PT', name: 'pt-PT-Wavenet-B', gender: 'MALE' }, // Portuguese male
      'pt': { languageCode: 'pt-BR', name: 'pt-BR-Neural2-B', gender: 'MALE' }, // Default Portuguese (Brazilian)
      'ja-JP': { languageCode: 'ja-JP', name: 'ja-JP-Neural2-C', gender: 'MALE' }, // Japanese male
      'ja': { languageCode: 'ja-JP', name: 'ja-JP-Neural2-C', gender: 'MALE' }, // Default Japanese
      'ko-KR': { languageCode: 'ko-KR', name: 'ko-KR-Neural2-C', gender: 'MALE' }, // Korean male
      'ko': { languageCode: 'ko-KR', name: 'ko-KR-Neural2-C', gender: 'MALE' }, // Default Korean
      'zh-CN': { languageCode: 'zh-CN', name: 'zh-CN-Wavenet-B', gender: 'MALE' }, // Chinese male
      'zh-TW': { languageCode: 'zh-TW', name: 'zh-TW-Wavenet-B', gender: 'MALE' }, // Taiwanese male
      'zh': { languageCode: 'zh-CN', name: 'zh-CN-Wavenet-B', gender: 'MALE' }, // Default Chinese (Simplified)
      'hi-IN': { languageCode: 'hi-IN', name: 'hi-IN-Neural2-B', gender: 'MALE' }, // Hindi male
      'hi': { languageCode: 'hi-IN', name: 'hi-IN-Neural2-B', gender: 'MALE' }, // Default Hindi
      'ar-XA': { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-B', gender: 'MALE' }, // Arabic male
      'ar': { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-B', gender: 'MALE' }, // Default Arabic
      'ru-RU': { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-B', gender: 'MALE' }, // Russian male
      'ru': { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-B', gender: 'MALE' }, // Default Russian
      'nl-NL': { languageCode: 'nl-NL', name: 'nl-NL-Wavenet-B', gender: 'MALE' }, // Dutch male
      'nl': { languageCode: 'nl-NL', name: 'nl-NL-Wavenet-B', gender: 'MALE' }, // Default Dutch
      'sv-SE': { languageCode: 'sv-SE', name: 'sv-SE-Wavenet-A', gender: 'MALE' }, // Swedish male
      'sv': { languageCode: 'sv-SE', name: 'sv-SE-Wavenet-A', gender: 'MALE' }, // Default Swedish
      'no-NO': { languageCode: 'no-NO', name: 'no-NO-Wavenet-B', gender: 'MALE' }, // Norwegian male
      'no': { languageCode: 'no-NO', name: 'no-NO-Wavenet-B', gender: 'MALE' }, // Default Norwegian
      'da-DK': { languageCode: 'da-DK', name: 'da-DK-Wavenet-C', gender: 'MALE' }, // Danish male
      'da': { languageCode: 'da-DK', name: 'da-DK-Wavenet-C', gender: 'MALE' }, // Default Danish
      'fi-FI': { languageCode: 'fi-FI', name: 'fi-FI-Wavenet-A', gender: 'MALE' }, // Finnish male
      'fi': { languageCode: 'fi-FI', name: 'fi-FI-Wavenet-A', gender: 'MALE' }, // Default Finnish
      'pl-PL': { languageCode: 'pl-PL', name: 'pl-PL-Wavenet-B', gender: 'MALE' }, // Polish male
      'pl': { languageCode: 'pl-PL', name: 'pl-PL-Wavenet-B', gender: 'MALE' }, // Default Polish
      'tr-TR': { languageCode: 'tr-TR', name: 'tr-TR-Wavenet-B', gender: 'MALE' }, // Turkish male
      'tr': { languageCode: 'tr-TR', name: 'tr-TR-Wavenet-B', gender: 'MALE' }, // Default Turkish
      'th-TH': { languageCode: 'th-TH', name: 'th-TH-Neural2-C', gender: 'MALE' }, // Thai male
      'th': { languageCode: 'th-TH', name: 'th-TH-Neural2-C', gender: 'MALE' }, // Default Thai
      'vi-VN': { languageCode: 'vi-VN', name: 'vi-VN-Neural2-D', gender: 'MALE' }, // Vietnamese male
      'vi': { languageCode: 'vi-VN', name: 'vi-VN-Neural2-D', gender: 'MALE' }, // Default Vietnamese

      // Additional Languages
      'bg-BG': { languageCode: 'bg-BG', name: 'bg-BG-Standard-A', gender: 'FEMALE' }, // Bulgarian (Standard only)
      'bg': { languageCode: 'bg-BG', name: 'bg-BG-Standard-A', gender: 'FEMALE' },
      'cs-CZ': { languageCode: 'cs-CZ', name: 'cs-CZ-Wavenet-A', gender: 'FEMALE' }, // Czech
      'cs': { languageCode: 'cs-CZ', name: 'cs-CZ-Wavenet-A', gender: 'FEMALE' },
      'hr-HR': { languageCode: 'hr-HR', name: 'hr-HR-Standard-A', gender: 'FEMALE' }, // Croatian (Standard only)
      'hr': { languageCode: 'hr-HR', name: 'hr-HR-Standard-A', gender: 'FEMALE' },
      'et-EE': { languageCode: 'et-EE', name: 'et-EE-Standard-A', gender: 'FEMALE' }, // Estonian
      'et': { languageCode: 'et-EE', name: 'et-EE-Standard-A', gender: 'FEMALE' },
      'hu-HU': { languageCode: 'hu-HU', name: 'hu-HU-Wavenet-A', gender: 'FEMALE' }, // Hungarian
      'hu': { languageCode: 'hu-HU', name: 'hu-HU-Wavenet-A', gender: 'FEMALE' },
      'lt-LT': { languageCode: 'lt-LT', name: 'lt-LT-Standard-A', gender: 'MALE' }, // Lithuanian
      'lt': { languageCode: 'lt-LT', name: 'lt-LT-Standard-A', gender: 'MALE' },
      'lv-LV': { languageCode: 'lv-LV', name: 'lv-LV-Standard-A', gender: 'MALE' }, // Latvian
      'lv': { languageCode: 'lv-LV', name: 'lv-LV-Standard-A', gender: 'MALE' },
      'ro-RO': { languageCode: 'ro-RO', name: 'ro-RO-Wavenet-A', gender: 'FEMALE' }, // Romanian
      'ro': { languageCode: 'ro-RO', name: 'ro-RO-Wavenet-A', gender: 'FEMALE' },
      'sk-SK': { languageCode: 'sk-SK', name: 'sk-SK-Wavenet-A', gender: 'FEMALE' }, // Slovak
      'sk': { languageCode: 'sk-SK', name: 'sk-SK-Wavenet-A', gender: 'FEMALE' },
      'sl-SI': { languageCode: 'sl-SI', name: 'sl-SI-Standard-A', gender: 'MALE' }, // Slovenian
      'sl': { languageCode: 'sl-SI', name: 'sl-SI-Standard-A', gender: 'MALE' },
      'uk-UA': { languageCode: 'uk-UA', name: 'uk-UA-Wavenet-A', gender: 'FEMALE' }, // Ukrainian
      'uk': { languageCode: 'uk-UA', name: 'uk-UA-Wavenet-A', gender: 'FEMALE' },
      'el-GR': { languageCode: 'el-GR', name: 'el-GR-Wavenet-C', gender: 'FEMALE' }, // Greek
      'el': { languageCode: 'el-GR', name: 'el-GR-Wavenet-C', gender: 'FEMALE' },
      'he-IL': { languageCode: 'he-IL', name: 'he-IL-Wavenet-B', gender: 'MALE' }, // Hebrew
      'he': { languageCode: 'he-IL', name: 'he-IL-Wavenet-B', gender: 'MALE' },
      'id-ID': { languageCode: 'id-ID', name: 'id-ID-Wavenet-B', gender: 'MALE' }, // Indonesian
      'id': { languageCode: 'id-ID', name: 'id-ID-Wavenet-B', gender: 'MALE' },
      'ms-MY': { languageCode: 'ms-MY', name: 'ms-MY-Wavenet-B', gender: 'MALE' }, // Malay
      'ms': { languageCode: 'ms-MY', name: 'ms-MY-Wavenet-B', gender: 'MALE' },
      'sr-RS': { languageCode: 'sr-RS', name: 'sr-RS-Standard-A', gender: 'FEMALE' }, // Serbian
      'sr': { languageCode: 'sr-RS', name: 'sr-RS-Standard-A', gender: 'FEMALE' }
    };

    // Try exact match first
    if (voiceMap[languageCode]) {
      console.log('Google TTS: Using voice for', languageCode);
      return voiceMap[languageCode];
    }

    // Try language code without region (e.g., 'en' from 'en-US')
    const langOnly = languageCode.split('-')[0];
    if (voiceMap[langOnly]) {
      console.log('Google TTS: Using default voice for', langOnly);
      return voiceMap[langOnly];
    }

    // Final fallback to English
    console.warn('Google TTS: No voice found for', languageCode, '- using English');
    return voiceMap['en-US'];
  }

  private cleanText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`(.*?)`/g, '$1') // Code
      .replace(/#{1,6}\s*(.*)/g, '$1') // Headers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
      .replace(/<[^>]*>/g, '') // HTML tags
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Service factory
export const createTTSService = (useGoogle = true): TTSService => {
  if (useGoogle) {
    const projectId = import.meta.env.VITE_GOOGLE_PROJECT_ID;
    const clientEmail = import.meta.env.VITE_GOOGLE_CLIENT_EMAIL;
    const privateKey = import.meta.env.VITE_GOOGLE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      return new GoogleTTSService(projectId, clientEmail, privateKey);
    }
  }

  return new BrowserTTSService();
};

// Default export - use Google TTS by default
export const ttsService: TTSService = createTTSService(true);