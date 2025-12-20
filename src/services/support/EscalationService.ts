// Escalation Service for AI to Human Support Transitions
import { SupportService, CreateTicketRequest, SupportTicket, EmergencySupport } from '../../types/services';

export interface EscalationReason {
  type: 'ai_failure' | 'user_request' | 'complex_issue' | 'privacy_concern' | 'emergency';
  description: string;
  conversationId: string;
  failureCount: number;
  userFrustrationLevel: 'low' | 'medium' | 'high' | 'critical';
  context: any;
}

export interface EscalationRule {
  trigger: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  autoEscalate: boolean;
  estimatedWaitTime: number; // minutes
  requiredSkills: string[];
}

export class EscalationService implements SupportService {
  private escalationQueue: Map<string, EscalationReason> = new Map();
  private escalationRules: EscalationRule[] = [
    {
      trigger: 'ai_failure_3_times',
      priority: 'medium',
      autoEscalate: true,
      estimatedWaitTime: 15,
      requiredSkills: ['senior-support', 'technical-assistance']
    },
    {
      trigger: 'privacy_concern',
      priority: 'high',
      autoEscalate: true,
      estimatedWaitTime: 10,
      requiredSkills: ['privacy-specialist', 'senior-support']
    },
    {
      trigger: 'accessibility_issue',
      priority: 'high',
      autoEscalate: true,
      estimatedWaitTime: 12,
      requiredSkills: ['accessibility-specialist', 'senior-support']
    },
    {
      trigger: 'emergency_support',
      priority: 'urgent',
      autoEscalate: true,
      estimatedWaitTime: 2,
      requiredSkills: ['emergency-support', 'senior-specialist']
    },
    {
      trigger: 'user_frustration_high',
      priority: 'high',
      autoEscalate: true,
      estimatedWaitTime: 8,
      requiredSkills: ['senior-support', 'empathy-specialist']
    }
  ];

  async escalateToHuman(conversationId: string, reason: string): Promise<SupportTicket> {
    const escalationReason: EscalationReason = {
      type: this.determineEscalationType(reason),
      description: reason,
      conversationId,
      failureCount: this.getFailureCount(conversationId),
      userFrustrationLevel: this.assessUserFrustration(conversationId),
      context: this.getConversationContext(conversationId)
    };

    // Add to escalation queue
    this.escalationQueue.set(conversationId, escalationReason);

    // Create support ticket
    const ticketRequest: CreateTicketRequest = {
      userId: this.getUserIdFromConversation(conversationId),
      type: this.mapEscalationTypeToTicketType(escalationReason.type),
      priority: this.determinePriority(escalationReason),
      subject: this.generateTicketSubject(escalationReason),
      description: this.generateTicketDescription(escalationReason),
      context: {
        conversationId,
        escalationReason: escalationReason.type,
        failureCount: escalationReason.failureCount,
        aiContext: escalationReason.context
      }
    };

    const ticket = await this.createTicket(ticketRequest);

    // Notify user about escalation
    await this.notifyUserOfEscalation(ticket, escalationReason);

    // Log escalation for monitoring
    this.logEscalation(escalationReason, ticket);

    return ticket;
  }

  async createTicket(request: CreateTicketRequest): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      id: this.generateTicketId(),
      userId: request.userId,
      type: request.type,
      priority: request.priority,
      subject: request.subject,
      description: request.description,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would save to database
    console.log('Support ticket created:', ticket);

    // Auto-assign based on priority and type
    if (request.priority === 'urgent') {
      ticket.assignedTo = await this.findAvailableUrgentSupport();
    }

    return ticket;
  }

  async getTicket(id: string): Promise<SupportTicket> {
    // In a real implementation, this would fetch from database
    throw new Error('Ticket not found');
  }

  async updateTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    // In a real implementation, this would update in database
    const ticket = await this.getTicket(id);
    return { ...ticket, ...updates, updatedAt: new Date() };
  }

  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    // In a real implementation, this would fetch from database
    return [];
  }

  async getEmergencySupport(): Promise<EmergencySupport> {
    return {
      available: true,
      contactMethods: [
        {
          type: 'phone',
          value: '1-800-SENIOR-HELP',
          available: true,
          hours: '24/7'
        },
        {
          type: 'chat',
          value: 'emergency-chat',
          available: true,
          hours: '24/7'
        }
      ],
      estimatedWaitTime: 2, // minutes
      resources: [
        {
          title: 'Emergency Help Guide',
          description: 'Quick steps for common urgent issues',
          url: '/help/emergency',
          type: 'guide'
        },
        {
          title: 'Calm Down Techniques',
          description: 'Breathing exercises and calming resources',
          url: '/help/calm-down',
          type: 'guide'
        }
      ]
    };
  }

  /**
   * Gets pre-written fallback responses for common scenarios
   */
  getFallbackResponse(scenario: string, context: any): string {
    const fallbackResponses: Record<string, string> = {
      'technical_difficulty': "I understand you're having technical difficulties. This can be frustrating, but don't worry - our support team specializes in helping with exactly these kinds of issues. Let me connect you with someone who can walk you through this step by step.",

      'password_help': "For security reasons, I can't help directly with password issues, but our support team has secure ways to help you reset your password safely. They'll verify your identity and guide you through the process.",

      'account_access': "Account access issues require special attention to keep your information secure. Our support team has the tools and training to help you regain access safely. Let me connect you with them right away.",

      'confusion_about_steps': "I can see this might be confusing. Sometimes it helps to have someone walk through the steps with you personally. Our support team is excellent at breaking things down into simple, clear steps.",

      'repeated_questions': "I notice you've asked about this a few times. Sometimes it's easier to have a conversation with a real person who can adapt their explanation to exactly what you need. Let me get you connected with our support team.",

      'accessibility_needs': "Everyone learns differently, and our support team is specially trained to help with accessibility needs. They can adjust their approach to work best for you and ensure you have the support you need.",

      'feeling_overwhelmed': "I can sense this might feel overwhelming right now. That's completely normal when learning new technology. Our support team understands this and will take their time to help you feel comfortable and confident.",

      'general_frustration': "I understand this is frustrating. Technology can be challenging, and it's okay to feel this way. Our human support team is here specifically to help when things get difficult. They're patient, understanding, and will work at your pace."
    };

    return fallbackResponses[scenario] || fallbackResponses['general_frustration'];
  }

  /**
   * Provides contextual help suggestions when AI cannot answer
   */
  getContextualHelpSuggestions(context: any): string[] {
    const suggestions: string[] = [];

    if (context.currentPage) {
      suggestions.push(`Try the help section for ${context.currentPage}`);
    }

    if (context.currentTutorial) {
      suggestions.push(`Review the tutorial introduction for ${context.currentTutorial}`);
    }

    suggestions.push('Contact our support team for personalized help');
    suggestions.push('Check our frequently asked questions');
    suggestions.push('Watch our getting started video');

    return suggestions;
  }

  /**
   * Tracks escalation metrics for monitoring
   */
  getEscalationMetrics(timeframe: { start: Date; end: Date }) {
    // In a real implementation, this would query the database
    return {
      totalEscalations: 0,
      escalationsByReason: {},
      averageResolutionTime: 0,
      userSatisfactionAfterEscalation: 0,
      escalationRate: 0
    };
  }

  private determineEscalationType(reason: string): EscalationReason['type'] {
    if (reason.includes('emergency') || reason.includes('urgent')) return 'emergency';
    if (reason.includes('privacy') || reason.includes('security')) return 'privacy_concern';
    if (reason.includes('ai_failure') || reason.includes('failed')) return 'ai_failure';
    if (reason.includes('complex') || reason.includes('technical')) return 'complex_issue';
    return 'user_request';
  }

  private getFailureCount(conversationId: string): number {
    // In a real implementation, this would track actual failures
    return 3; // Placeholder
  }

  private assessUserFrustration(conversationId: string): 'low' | 'medium' | 'high' | 'critical' {
    // In a real implementation, this would analyze conversation patterns
    return 'medium'; // Placeholder
  }

  private getConversationContext(conversationId: string): any {
    // In a real implementation, this would fetch conversation history
    return { conversationId }; // Placeholder
  }

  private getUserIdFromConversation(conversationId: string): string {
    // In a real implementation, this would extract user ID from conversation
    return 'user-' + conversationId.split('-')[0]; // Placeholder
  }

  private mapEscalationTypeToTicketType(escalationType: EscalationReason['type']): 'technical' | 'content' | 'accessibility' | 'general' {
    const mapping = {
      'ai_failure': 'technical' as const,
      'user_request': 'general' as const,
      'complex_issue': 'technical' as const,
      'privacy_concern': 'general' as const,
      'emergency': 'general' as const
    };
    return mapping[escalationType];
  }

  private determinePriority(escalation: EscalationReason): 'low' | 'medium' | 'high' | 'urgent' {
    if (escalation.type === 'emergency') return 'urgent';
    if (escalation.userFrustrationLevel === 'critical') return 'urgent';
    if (escalation.userFrustrationLevel === 'high') return 'high';
    if (escalation.failureCount >= 3) return 'high';
    if (escalation.type === 'privacy_concern') return 'high';
    return 'medium';
  }

  private generateTicketSubject(escalation: EscalationReason): string {
    const subjects = {
      'ai_failure': 'AI Assistant Unable to Help - Human Support Needed',
      'user_request': 'User Requested Human Support',
      'complex_issue': 'Complex Technical Issue Requiring Human Support',
      'privacy_concern': 'Privacy/Security Question - Urgent',
      'emergency': 'URGENT: Emergency Support Request'
    };
    return subjects[escalation.type];
  }

  private generateTicketDescription(escalation: EscalationReason): string {
    return `User escalated from AI assistant after ${escalation.failureCount} failed attempts.
    
Escalation Reason: ${escalation.description}
User Frustration Level: ${escalation.userFrustrationLevel}
Conversation ID: ${escalation.conversationId}

The user needs patient, senior-friendly support to resolve their issue. Please approach with empathy and take time to explain each step clearly.`;
  }

  private async notifyUserOfEscalation(ticket: SupportTicket, escalation: EscalationReason): Promise<void> {
    // In a real implementation, this would send notifications
    console.log(`User notified of escalation. Ticket: ${ticket.id}`);
  }

  private logEscalation(escalation: EscalationReason, ticket: SupportTicket): void {
    console.log('Escalation logged:', {
      ticketId: ticket.id,
      escalationType: escalation.type,
      failureCount: escalation.failureCount,
      frustrationLevel: escalation.userFrustrationLevel,
      timestamp: new Date().toISOString()
    });
  }

  private generateTicketId(): string {
    return 'TICKET-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  private async findAvailableUrgentSupport(): string {
    // In a real implementation, this would find available urgent support staff
    return 'urgent-support-agent-1';
  }
}