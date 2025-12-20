// Support Services exports
export { EscalationService } from './EscalationService';
export { FallbackSystem } from './FallbackSystem';
export { SupportNotificationService } from './NotificationService';

// Create singleton instances
let escalationServiceInstance: EscalationService | null = null;
let fallbackSystemInstance: FallbackSystem | null = null;
let notificationServiceInstance: SupportNotificationService | null = null;

export function getEscalationService(): EscalationService {
  if (!escalationServiceInstance) {
    escalationServiceInstance = new EscalationService();
  }
  return escalationServiceInstance;
}

export function getFallbackSystem(): FallbackSystem {
  if (!fallbackSystemInstance) {
    fallbackSystemInstance = new FallbackSystem();
  }
  return fallbackSystemInstance;
}

export function getNotificationService(): SupportNotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new SupportNotificationService();
  }
  return notificationServiceInstance;
}

export function resetSupportServices(): void {
  escalationServiceInstance = null;
  fallbackSystemInstance = null;
  notificationServiceInstance = null;
}