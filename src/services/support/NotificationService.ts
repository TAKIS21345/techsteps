// Notification Service for Escalation and Support Communications
import { 
  NotificationService, 
  NotificationRequest, 
  ScheduledNotification, 
  Notification,
  RecurrencePattern 
} from '../../types/services';

export class SupportNotificationService implements NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();

  async sendNotification(notification: NotificationRequest): Promise<void> {
    const notificationId = this.generateNotificationId();
    
    const fullNotification: Notification = {
      id: notificationId,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: false,
      createdAt: new Date()
    };

    this.notifications.set(notificationId, fullNotification);

    // Send based on type
    switch (notification.type) {
      case 'email':
        await this.sendEmailNotification(notification);
        break;
      case 'push':
        await this.sendPushNotification(notification);
        break;
      case 'sms':
        await this.sendSMSNotification(notification);
        break;
      case 'in-app':
        await this.sendInAppNotification(notification);
        break;
    }

    console.log(`Notification sent: ${notification.title} to user ${notification.userId}`);
  }

  async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    const notificationId = this.generateNotificationId();
    this.scheduledNotifications.set(notificationId, notification);

    // In a real implementation, this would use a job scheduler
    setTimeout(async () => {
      await this.sendNotification(notification);
      
      // Handle recurring notifications
      if (notification.recurring) {
        await this.scheduleRecurringNotification(notification);
      }
    }, notification.scheduledFor.getTime() - Date.now());

    return notificationId;
  }

  async cancelNotification(id: string): Promise<void> {
    this.scheduledNotifications.delete(id);
    console.log(`Notification ${id} cancelled`);
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      notification.readAt = new Date();
    }
  }

  /**
   * Sends escalation notification to user
   */
  async notifyEscalation(userId: string, ticketId: string, estimatedWaitTime: number): Promise<void> {
    const notification: NotificationRequest = {
      userId,
      type: 'in-app',
      title: 'Connected to Human Support',
      message: `Great news! I've connected you with our support team. Your ticket number is ${ticketId}. Someone will be with you in approximately ${estimatedWaitTime} minutes. Please stay on this page.`,
      priority: 'high',
      data: {
        ticketId,
        estimatedWaitTime,
        type: 'escalation'
      }
    };

    await this.sendNotification(notification);

    // Also send email confirmation if user prefers
    const emailNotification: NotificationRequest = {
      ...notification,
      type: 'email',
      title: 'Support Request Confirmation',
      message: `Hello! We've received your request for help and created ticket ${ticketId}. Our support team will contact you shortly. If you need immediate assistance, please call 1-800-SENIOR-HELP.`
    };

    await this.sendNotification(emailNotification);
  }

  /**
   * Sends support team notification about new escalation
   */
  async notifySupportTeam(escalation: any): Promise<void> {
    const notification: NotificationRequest = {
      userId: 'support-team',
      type: 'in-app',
      title: 'New Senior User Escalation',
      message: `New escalation from AI assistant. User needs ${escalation.type} support. Frustration level: ${escalation.userFrustrationLevel}. Please respond with patience and empathy.`,
      priority: escalation.userFrustrationLevel === 'critical' ? 'high' : 'normal',
      data: {
        escalationType: escalation.type,
        ticketId: escalation.ticketId,
        conversationId: escalation.conversationId,
        failureCount: escalation.failureCount
      }
    };

    await this.sendNotification(notification);
  }

  /**
   * Sends follow-up notification after support interaction
   */
  async sendFollowUpNotification(userId: string, ticketId: string): Promise<void> {
    // Schedule follow-up for 24 hours later
    const followUpTime = new Date();
    followUpTime.setHours(followUpTime.getHours() + 24);

    const followUp: ScheduledNotification = {
      userId,
      type: 'in-app',
      title: 'How was your support experience?',
      message: 'We hope our support team was able to help you yesterday. Would you mind sharing how your experience was? Your feedback helps us improve.',
      priority: 'low',
      scheduledFor: followUpTime,
      data: {
        ticketId,
        type: 'feedback_request'
      }
    };

    await this.scheduleNotification(followUp);
  }

  /**
   * Sends calming notification for overwhelmed users
   */
  async sendCalmingNotification(userId: string): Promise<void> {
    const notification: NotificationRequest = {
      userId,
      type: 'in-app',
      title: 'Take a Deep Breath',
      message: 'Technology can be overwhelming sometimes, and that\'s completely normal. You\'re doing great by asking for help. Take a moment to breathe, and remember that our support team is here to help you succeed.',
      priority: 'normal',
      data: {
        type: 'calming',
        resources: [
          { title: 'Breathing Exercise', url: '/help/breathing' },
          { title: 'Encouragement', url: '/help/encouragement' }
        ]
      }
    };

    await this.sendNotification(notification);
  }

  /**
   * Sends emergency support notification
   */
  async sendEmergencyNotification(userId: string): Promise<void> {
    const notification: NotificationRequest = {
      userId,
      type: 'push',
      title: 'Emergency Support Available',
      message: 'Emergency support is connecting now. Please stay calm. Help is on the way. If this is a medical emergency, please call 911.',
      priority: 'high',
      data: {
        type: 'emergency',
        emergencyPhone: '1-800-SENIOR-HELP',
        medicalEmergency: '911'
      }
    };

    await this.sendNotification(notification);
  }

  private async sendEmailNotification(notification: NotificationRequest): Promise<void> {
    // In a real implementation, this would integrate with an email service
    console.log(`Email sent to user ${notification.userId}: ${notification.title}`);
  }

  private async sendPushNotification(notification: NotificationRequest): Promise<void> {
    // In a real implementation, this would use push notification service
    console.log(`Push notification sent to user ${notification.userId}: ${notification.title}`);
  }

  private async sendSMSNotification(notification: NotificationRequest): Promise<void> {
    // In a real implementation, this would use SMS service
    console.log(`SMS sent to user ${notification.userId}: ${notification.message}`);
  }

  private async sendInAppNotification(notification: NotificationRequest): Promise<void> {
    // In a real implementation, this would update the UI
    console.log(`In-app notification for user ${notification.userId}: ${notification.title}`);
  }

  private async scheduleRecurringNotification(notification: ScheduledNotification): Promise<void> {
    if (!notification.recurring) return;

    const nextDate = this.calculateNextRecurrence(notification.scheduledFor, notification.recurring);
    
    if (nextDate && (!notification.recurring.endDate || nextDate <= notification.recurring.endDate)) {
      const nextNotification: ScheduledNotification = {
        ...notification,
        scheduledFor: nextDate
      };
      
      await this.scheduleNotification(nextNotification);
    }
  }

  private calculateNextRecurrence(lastDate: Date, pattern: RecurrencePattern): Date | null {
    const nextDate = new Date(lastDate);

    switch (pattern.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + pattern.interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (pattern.interval * 7));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        break;
      default:
        return null;
    }

    return nextDate;
  }

  private generateNotificationId(): string {
    return 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
}