// Fallback Response System for AI Assistant
export interface FallbackScenario {
  id: string;
  triggers: string[];
  response: string;
  suggestedActions: FallbackAction[];
  escalationRecommended: boolean;
  contextRequired: string[];
}

export interface FallbackAction {
  type: 'tutorial' | 'help' | 'contact' | 'retry' | 'navigate';
  label: string;
  target: string;
  priority: number;
}

export class FallbackSystem {
  private scenarios: FallbackScenario[] = [
    {
      id: 'password_reset',
      triggers: ['password', 'login', 'sign in', 'forgot password', 'can\'t log in'],
      response: "I understand you're having trouble with your password. For your security, I'll connect you with our support team who can safely help you reset your password. They'll verify your identity and guide you through each step.",
      suggestedActions: [
        { type: 'contact', label: 'Get Password Help', target: 'password-support', priority: 1 },
        { type: 'help', label: 'Password Tips', target: 'password-help', priority: 2 }
      ],
      escalationRecommended: true,
      contextRequired: ['currentPage']
    },
    {
      id: 'technical_error',
      triggers: ['error', 'not working', 'broken', 'won\'t load', 'crashed'],
      response: "I see you're experiencing a technical issue. These problems can be frustrating, but our technical support team is excellent at solving these kinds of problems. Let me connect you with someone who can help troubleshoot this step by step.",
      suggestedActions: [
        { type: 'contact', label: 'Technical Support', target: 'tech-support', priority: 1 },
        { type: 'help', label: 'Common Solutions', target: 'troubleshooting', priority: 2 },
        { type: 'retry', label: 'Try Again', target: 'refresh', priority: 3 }
      ],
      escalationRecommended: true,
      contextRequired: ['currentPage', 'errorDetails']
    },
    {
      id: 'navigation_confusion',
      triggers: ['lost', 'confused', 'where am i', 'how do i get to', 'can\'t find'],
      response: "It sounds like you might be feeling a bit lost on the website. That's completely normal - websites can be confusing! Let me help you get back on track. Our support team can walk you through exactly where you are and how to get where you want to go.",
      suggestedActions: [
        { type: 'help', label: 'Site Map', target: 'sitemap', priority: 1 },
        { type: 'tutorial', label: 'Navigation Guide', target: 'navigation-basics', priority: 2 },
        { type: 'contact', label: 'Get Personal Help', target: 'navigation-support', priority: 3 }
      ],
      escalationRecommended: false,
      contextRequired: ['currentPage', 'userGoal']
    },
    {
      id: 'learning_difficulty',
      triggers: ['too hard', 'don\'t understand', 'too fast', 'too complicated', 'overwhelming'],
      response: "Learning new technology can feel overwhelming sometimes, and that's perfectly okay. Everyone learns at their own pace. Our support team understands this and will work with you at a speed that feels comfortable. They're trained to break things down into small, manageable steps.",
      suggestedActions: [
        { type: 'contact', label: 'Get Learning Support', target: 'learning-support', priority: 1 },
        { type: 'tutorial', label: 'Start with Basics', target: 'getting-started', priority: 2 },
        { type: 'help', label: 'Learning Tips', target: 'learning-strategies', priority: 3 }
      ],
      escalationRecommended: true,
      contextRequired: ['currentTutorial', 'userSkillLevel']
    },
    {
      id: 'accessibility_needs',
      triggers: ['can\'t see', 'too small', 'hard to read', 'screen reader', 'accessibility', 'disability'],
      response: "I want to make sure this platform works well for you. Our support team includes accessibility specialists who can help adjust settings to make everything easier to see, hear, or navigate. They're trained to work with all kinds of assistive technologies.",
      suggestedActions: [
        { type: 'contact', label: 'Accessibility Support', target: 'accessibility-support', priority: 1 },
        { type: 'navigate', label: 'Accessibility Settings', target: '/settings/accessibility', priority: 2 },
        { type: 'help', label: 'Accessibility Guide', target: 'accessibility-help', priority: 3 }
      ],
      escalationRecommended: true,
      contextRequired: ['accessibilitySettings', 'assistiveTechnology']
    },
    {
      id: 'privacy_security',
      triggers: ['privacy', 'security', 'personal information', 'data', 'safe', 'secure'],
      response: "Your privacy and security are very important to us. I understand you have concerns about your personal information. Our privacy specialists can explain exactly how we protect your data and answer any specific questions you have about privacy or security.",
      suggestedActions: [
        { type: 'contact', label: 'Privacy Specialist', target: 'privacy-support', priority: 1 },
        { type: 'help', label: 'Privacy Policy', target: 'privacy-policy', priority: 2 },
        { type: 'help', label: 'Security Guide', target: 'security-guide', priority: 3 }
      ],
      escalationRecommended: true,
      contextRequired: ['privacySettings']
    },
    {
      id: 'family_caregiver',
      triggers: ['family', 'caregiver', 'daughter', 'son', 'help me', 'someone else'],
      response: "I understand you might want to involve a family member or caregiver in your learning journey. Our support team can help you set up family access safely and explain how to share your progress with people you trust, while keeping your information secure.",
      suggestedActions: [
        { type: 'contact', label: 'Family Support Setup', target: 'family-support', priority: 1 },
        { type: 'help', label: 'Caregiver Guide', target: 'caregiver-help', priority: 2 },
        { type: 'navigate', label: 'Family Settings', target: '/settings/family', priority: 3 }
      ],
      escalationRecommended: false,
      contextRequired: ['familySettings', 'caregiverAccess']
    },
    {
      id: 'feeling_frustrated',
      triggers: ['frustrated', 'angry', 'upset', 'give up', 'too difficult', 'hate this'],
      response: "I can hear that you're feeling frustrated, and I completely understand. Learning new technology can be challenging, and it's normal to feel this way sometimes. You're not alone in this - our support team is here to help and they're very patient and understanding. They'll work with you at your own pace.",
      suggestedActions: [
        { type: 'contact', label: 'Talk to Someone', target: 'emotional-support', priority: 1 },
        { type: 'help', label: 'Take a Break Guide', target: 'break-strategies', priority: 2 },
        { type: 'tutorial', label: 'Start Something Easier', target: 'easy-wins', priority: 3 }
      ],
      escalationRecommended: true,
      contextRequired: ['userFrustrationLevel', 'recentActivity']
    },
    {
      id: 'emergency_help',
      triggers: ['emergency', 'urgent', 'help now', 'immediate', 'crisis', 'stuck'],
      response: "I understand you need help right away. Let me connect you immediately with our emergency support team. They're available 24/7 and specially trained to help seniors with urgent technology issues. While you wait, take a deep breath - help is on the way.",
      suggestedActions: [
        { type: 'contact', label: 'Emergency Support', target: 'emergency-support', priority: 1 },
        { type: 'help', label: 'Calm Down Resources', target: 'calming-techniques', priority: 2 }
      ],
      escalationRecommended: true,
      contextRequired: ['emergencyType', 'currentSituation']
    }
  ];

  /**
   * Finds the best fallback response for a given user message
   */
  findBestFallback(userMessage: string, context: any): FallbackScenario | null {
    const lowerMessage = userMessage.toLowerCase();
    
    // Score each scenario based on trigger matches
    const scoredScenarios = this.scenarios.map(scenario => {
      const score = scenario.triggers.reduce((acc, trigger) => {
        if (lowerMessage.includes(trigger.toLowerCase())) {
          return acc + 1;
        }
        return acc;
      }, 0);
      
      return { scenario, score };
    });

    // Find the scenario with the highest score
    const bestMatch = scoredScenarios.reduce((best, current) => {
      return current.score > best.score ? current : best;
    });

    // Only return if we have at least one trigger match
    return bestMatch.score > 0 ? bestMatch.scenario : null;
  }

  /**
   * Gets a contextual fallback response
   */
  getContextualFallback(context: any): FallbackScenario {
    // Default fallback based on context
    if (context.currentTutorial) {
      return {
        id: 'tutorial_help',
        triggers: [],
        response: `I see you're working on "${context.currentTutorial}". Sometimes tutorials can be tricky, and that's okay! Our support team can walk through this tutorial with you step by step, making sure you understand each part before moving on.`,
        suggestedActions: [
          { type: 'contact', label: 'Tutorial Help', target: 'tutorial-support', priority: 1 },
          { type: 'tutorial', label: 'Restart Tutorial', target: context.currentTutorial, priority: 2 },
          { type: 'help', label: 'Tutorial Tips', target: 'tutorial-help', priority: 3 }
        ],
        escalationRecommended: true,
        contextRequired: ['currentTutorial']
      };
    }

    // General fallback
    return {
      id: 'general_help',
      triggers: [],
      response: "I want to help you, but I'm not sure I understand exactly what you need. That's okay - sometimes it's easier to explain things to a real person. Our support team is excellent at listening and figuring out exactly how to help you.",
      suggestedActions: [
        { type: 'contact', label: 'Talk to Support', target: 'general-support', priority: 1 },
        { type: 'help', label: 'Common Questions', target: 'faq', priority: 2 },
        { type: 'tutorial', label: 'Getting Started', target: 'getting-started', priority: 3 }
      ],
      escalationRecommended: true,
      contextRequired: []
    };
  }

  /**
   * Generates a senior-friendly fallback response
   */
  generateSeniorFriendlyResponse(scenario: FallbackScenario, context: any): string {
    let response = scenario.response;

    // Add context-specific information
    if (context.userName) {
      response = `Hello ${context.userName}, ` + response.toLowerCase();
    }

    // Add encouragement
    const encouragements = [
      "You're doing great by asking for help!",
      "Don't worry, we're here to support you.",
      "Learning new things takes time, and that's perfectly normal.",
      "You're not alone in this - many people find technology challenging at first."
    ];

    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    response += ` ${randomEncouragement}`;

    return response;
  }

  /**
   * Checks if escalation is recommended for a scenario
   */
  shouldEscalate(scenario: FallbackScenario, failureCount: number): boolean {
    return scenario.escalationRecommended || failureCount >= 2;
  }

  /**
   * Gets escalation notification message
   */
  getEscalationMessage(scenario: FallbackScenario): string {
    const messages = {
      'password_reset': "I'm connecting you with our security team who can safely help with password issues.",
      'technical_error': "Let me get our technical support team to help solve this problem.",
      'accessibility_needs': "I'm connecting you with our accessibility specialist right away.",
      'privacy_security': "Our privacy team will answer all your security questions.",
      'emergency_help': "Connecting you to emergency support immediately.",
      'feeling_frustrated': "Let me get you connected with someone who can provide the patient support you deserve."
    };

    return messages[scenario.id] || "I'm connecting you with our support team who can provide the personalized help you need.";
  }

  /**
   * Tracks fallback usage for improvement
   */
  trackFallbackUsage(scenario: FallbackScenario, context: any, wasHelpful: boolean): void {
    console.log('Fallback usage tracked:', {
      scenarioId: scenario.id,
      wasHelpful,
      context: {
        page: context.currentPage,
        tutorial: context.currentTutorial
      },
      timestamp: new Date().toISOString()
    });
  }
}