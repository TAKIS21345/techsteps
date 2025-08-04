/**
 * Example demonstrating how to integrate motion sensitivity and accessibility features
 * with the avatar movement system.
 */

import { 
  MotionSensitivityManager,
  MovementConfigurationManager,
  AccessibilityComplianceManager,
  MovementOrchestrator
} from '../index';

import { 
  MovementContext,
  CulturalProfile,
  AccentProfile,
  MotionSettings
} from '../types';

/**
 * Example class showing how to set up and use the accessibility features
 */
export class AccessibilityIntegrationExample {
  private motionSensitivityManager: MotionSensitivityManager;
  private configurationManager: MovementConfigurationManager;
  private accessibilityManager: AccessibilityComplianceManager;
  private movementOrchestrator: MovementOrchestrator;

  constructor() {
    // Initialize motion sensitivity manager
    this.motionSensitivityManager = new MotionSensitivityManager({
      motionSensitivityEnabled: false,
      intensityLevel: 'standard'
    });

    // Initialize configuration manager
    this.configurationManager = new MovementConfigurationManager(
      this.motionSensitivityManager
    );

    // Initialize accessibility compliance manager
    this.accessibilityManager = new AccessibilityComplianceManager(
      this.motionSensitivityManager,
      {
        reducedMotionCompliance: true,
        wcagLevel: 'AA'
      }
    );

    // Initialize movement orchestrator with default settings
    const defaultCulturalProfile: CulturalProfile = {
      region: 'western',
      gesturePreferences: [],
      movementAmplitude: 1.0,
      eyeContactPatterns: {
        frequency: 0.7,
        duration: 2000,
        avoidance: false
      },
      personalSpaceBehavior: {
        preferredDistance: 1.0,
        approachStyle: 'respectful',
        retreatTriggers: []
      },
      restrictedGestures: []
    };

    const defaultAccentProfile: AccentProfile = {
      language: 'en',
      pronunciationRules: {
        vowelMappings: {},
        consonantMappings: {},
        rhythmPattern: {
          beatsPerMinute: 120,
          stressPattern: [1, 0.5, 0.8, 0.3],
          pauseDurations: [200, 400, 600]
        },
        stressPatterns: []
      },
      speechRhythm: {
        beatsPerMinute: 120,
        stressPattern: [1, 0.5, 0.8, 0.3],
        pauseDurations: [200, 400, 600]
      },
      intonationPatterns: [],
      headMovementStyle: {
        nodFrequency: 0.6,
        tiltTendency: 0.3,
        emphasisStyle: 'moderate'
      }
    };

    this.movementOrchestrator = new MovementOrchestrator(
      this.configurationManager.getMotionSettings(),
      defaultCulturalProfile,
      defaultAccentProfile
    );

    this.setupEventListeners();
  }

  /**
   * Example: Enable accessibility features for users with motion sensitivity
   */
  public enableMotionSensitivityMode(): void {
    console.log('Enabling motion sensitivity mode...');

    // Activate minimal motion mode
    this.motionSensitivityManager.activateMinimalMotionMode();

    // Set up formal context profile for reduced distractions
    this.configurationManager.activateContextProfile('formal');

    // Enable vestibular safe mode
    this.accessibilityManager.enableVestibularSafeMode();

    // Update orchestrator with new settings
    this.updateOrchestratorSettings();

    console.log('Motion sensitivity mode enabled');
  }

  /**
   * Example: Configure for educational context with accessibility
   */
  public configureForEducationalContext(): void {
    console.log('Configuring for educational context...');

    // Use educational context profile
    this.configurationManager.activateContextProfile('educational');

    // Enable alternative communication methods
    this.accessibilityManager.updateSettings({
      alternativeEmphasis: {
        enabled: true,
        methods: ['text_highlight', 'bold_text', 'underline'],
        intensity: 0.8,
        duration: 1000
      },
      alternativeQuestions: {
        enabled: true,
        methods: ['question_mark_highlight', 'text_styling'],
        visualCues: true,
        audioCues: false
      }
    });

    // Update orchestrator
    this.updateOrchestratorSettings();

    console.log('Educational context configured');
  }

  /**
   * Example: Process speech content with accessibility considerations
   */
  public processSpeechWithAccessibility(speechContent: string, language: string = 'en'): void {
    const context: MovementContext = {
      isQuestion: speechContent.includes('?'),
      isExplanation: speechContent.includes('because') || speechContent.includes('therefore'),
      emphasisLevel: this.detectEmphasisLevel(speechContent),
      culturalContext: 'western',
      language,
      speechContent
    };

    console.log('Processing speech:', speechContent);

    // Check if we should use alternative communication
    const accessibilityResult = this.accessibilityManager.processMovementContext(context);
    
    if (accessibilityResult.useAlternatives) {
      console.log('Using alternative communication methods:');
      accessibilityResult.alternatives.forEach(alt => {
        console.log(`- ${alt.type}: ${alt.method} (intensity: ${alt.intensity})`);
      });
    }

    // Get contextual configuration
    const config = this.configurationManager.getContextualConfiguration(context);
    
    // Apply motion sensitivity filtering if needed
    // (This would normally be done within the movement generation process)
    console.log('Current motion settings:', {
      intensity: config.globalIntensity,
      headMovements: config.headMovementConfig.enabled,
      gestures: config.gestureConfig.enabled,
      alternatives: accessibilityResult.useAlternatives
    });
  }

  /**
   * Example: Perform accessibility audit
   */
  public performAccessibilityAudit(): void {
    console.log('Performing accessibility audit...');

    const auditResult = this.accessibilityManager.performAccessibilityAudit();
    
    console.log('Audit Results:');
    console.log(`- Compliant: ${auditResult.compliant}`);
    console.log(`- WCAG Level: ${auditResult.wcagLevel}`);
    console.log(`- Score: ${(auditResult.score * 100).toFixed(1)}%`);
    
    if (auditResult.violations.length > 0) {
      console.log('Violations:');
      auditResult.violations.forEach(violation => {
        console.log(`- ${violation.severity.toUpperCase()}: ${violation.description}`);
        console.log(`  Recommendation: ${violation.recommendation}`);
      });
    }

    if (auditResult.recommendations.length > 0) {
      console.log('Recommendations:');
      auditResult.recommendations.forEach(rec => {
        console.log(`- ${rec}`);
      });
    }
  }

  /**
   * Example: Handle user preference changes in real-time
   */
  public handleUserPreferenceChange(preference: string, value: any): void {
    console.log(`Updating user preference: ${preference} = ${value}`);

    switch (preference) {
      case 'motionIntensity':
        this.motionSensitivityManager.updateSettings({
          intensityLevel: value
        });
        break;

      case 'enableGestures':
        this.motionSensitivityManager.updateSettings({
          enableGestures: value
        });
        break;

      case 'reducedMotion':
        this.accessibilityManager.updateSettings({
          reducedMotionCompliance: value
        });
        break;

      case 'contextProfile':
        this.configurationManager.activateContextProfile(value);
        break;

      default:
        console.log('Unknown preference:', preference);
        return;
    }

    // Update orchestrator with new settings
    this.updateOrchestratorSettings();
    console.log('Preference updated successfully');
  }

  /**
   * Example: Get current accessibility status
   */
  public getAccessibilityStatus(): void {
    const status = this.accessibilityManager.getAccessibilityStatus();
    const userControl = this.accessibilityManager.validateUserControl();
    
    console.log('Current Accessibility Status:');
    console.log(`- Compliant: ${status.compliant}`);
    console.log(`- Level: ${status.level}`);
    console.log(`- Active Features: ${status.activeFeatures.join(', ')}`);
    console.log('User Control Capabilities:');
    console.log(`- Can disable motion: ${userControl.canDisableMotion}`);
    console.log(`- Can adjust intensity: ${userControl.canAdjustIntensity}`);
    console.log(`- Has immediate effect: ${userControl.hasImmediateEffect}`);
    console.log(`- Provides confirmation: ${userControl.providesConfirmation}`);
  }

  // Private helper methods

  private setupEventListeners(): void {
    // Listen for motion sensitivity changes
    this.motionSensitivityManager.addEventListener('settings_changed', (event) => {
      console.log('Motion sensitivity settings changed:', event.data);
      this.updateOrchestratorSettings();
    });

    // Listen for configuration changes
    this.configurationManager.addEventListener('settings_changed', (event) => {
      console.log('Configuration changed:', event.data);
    });

    // Listen for accessibility changes
    this.accessibilityManager.addEventListener('settings_changed', (event) => {
      console.log('Accessibility settings changed:', event.data);
    });
  }

  private updateOrchestratorSettings(): void {
    const motionSettings = this.configurationManager.getMotionSettings();
    this.movementOrchestrator.updateMotionSettings(motionSettings);
  }

  private detectEmphasisLevel(speechContent: string): 'low' | 'medium' | 'high' {
    const emphasisWords = ['important', 'crucial', 'essential', 'critical', 'vital'];
    const strongEmphasisWords = ['extremely', 'absolutely', 'definitely', 'certainly'];
    
    const hasEmphasis = emphasisWords.some(word => 
      speechContent.toLowerCase().includes(word)
    );
    
    const hasStrongEmphasis = strongEmphasisWords.some(word => 
      speechContent.toLowerCase().includes(word)
    );

    if (hasStrongEmphasis) return 'high';
    if (hasEmphasis) return 'medium';
    return 'low';
  }
}

// Example usage
export function runAccessibilityExample(): void {
  console.log('=== Avatar Movement Accessibility Integration Example ===\n');

  const example = new AccessibilityIntegrationExample();

  // Example 1: Enable motion sensitivity mode
  console.log('1. Enabling motion sensitivity mode:');
  example.enableMotionSensitivityMode();
  console.log();

  // Example 2: Process speech with accessibility
  console.log('2. Processing speech with accessibility:');
  example.processSpeechWithAccessibility(
    "This is extremely important information. Do you understand?"
  );
  console.log();

  // Example 3: Configure for educational context
  console.log('3. Configuring for educational context:');
  example.configureForEducationalContext();
  console.log();

  // Example 4: Handle user preference changes
  console.log('4. Handling user preference changes:');
  example.handleUserPreferenceChange('motionIntensity', 'reduced');
  example.handleUserPreferenceChange('enableGestures', false);
  console.log();

  // Example 5: Perform accessibility audit
  console.log('5. Performing accessibility audit:');
  example.performAccessibilityAudit();
  console.log();

  // Example 6: Get accessibility status
  console.log('6. Current accessibility status:');
  example.getAccessibilityStatus();
  console.log();

  console.log('=== Example Complete ===');
}

// Uncomment to run the example
// runAccessibilityExample();