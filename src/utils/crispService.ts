export class CrispService {
  private static instance: CrispService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): CrispService {
    if (!CrispService.instance) {
      CrispService.instance = new CrispService();
    }
    return CrispService.instance;
  }

  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Wait for Crisp to be available
    const checkCrisp = () => {
      if (window.$crisp) {
        this.isInitialized = true;
        console.log('Crisp chat initialized successfully');
      } else {
        setTimeout(checkCrisp, 100);
      }
    };
    
    checkCrisp();
  }

  setUserInfo(userInfo: {
    email?: string;
    nickname?: string;
    phone?: string;
    userId?: string;
  }): void {
    if (!this.isInitialized || !window.$crisp) {
      console.warn('Crisp not initialized');
      return;
    }

    // Validate userInfo fields before setting
    if (userInfo.email && typeof userInfo.email !== 'string') {
      console.error('Invalid email for Crisp user info');
      return;
    }
    if (userInfo.nickname && typeof userInfo.nickname !== 'string') {
      console.error('Invalid nickname for Crisp user info');
      return;
    }
    if (userInfo.phone && typeof userInfo.phone !== 'string') {
      console.error('Invalid phone for Crisp user info');
      return;
    }
    if (userInfo.userId && typeof userInfo.userId !== 'string') {
      console.error('Invalid userId for Crisp user info');
      return;
    }

    try {
      if (userInfo.email) {
        window.$crisp.push(["set", "user:email", userInfo.email]);
      }
      
      if (userInfo.nickname) {
        window.$crisp.push(["set", "user:nickname", userInfo.nickname]);
      }
      
      if (userInfo.phone) {
        window.$crisp.push(["set", "user:phone", userInfo.phone]);
      }

      if (userInfo.userId) {
        window.$crisp.push(["set", "session:data", [["user_id", userInfo.userId]]]);
      }
    } catch (error) {
      console.error('Error setting Crisp user info:', error);
    }
  }

  openChat(context?: {
    question?: string;
    steps?: string[];
    userProfile?: any;
  }): void {
    if (!this.isInitialized || !window.$crisp) {
      console.warn('Crisp not initialized, cannot open chat');
      return;
    }

    try {
      // Send context message if provided
      if (context?.question) {
        let contextMessage = `🆘 SUPPORT REQUEST\n\n`;
        contextMessage += `❓ QUESTION: ${context.question}\n\n`;
        
        if (context.userProfile) {
          contextMessage += `👤 USER INFO:\n`;
          contextMessage += `• Name: ${context.userProfile.firstName || 'Unknown'}\n`;
          contextMessage += `• Device: ${context.userProfile.os || 'Unknown'}\n`;
          contextMessage += `• Tech Level: ${context.userProfile.techExperience || 'Unknown'}\n\n`;
        }
        
        if (context.steps && context.steps.length > 0) {
          contextMessage += `📋 STEPS PROVIDED:\n`;
          context.steps.forEach((step, index) => {
            const cleanStep = step.replace(/<[^>]*>/g, ''); // Remove HTML tags
            contextMessage += `${index + 1}. ${cleanStep}\n`;
          });
          contextMessage += `\n💬 User needs additional help with the above steps.`;
        }

        // Send the context message
        window.$crisp.push(["do", "message:send", ["text", contextMessage]]);
      }

      // Open the chat
      window.$crisp.push(["do", "chat:open"]);
    } catch (error) {
      console.error('Error opening Crisp chat:', error);
    }
  }

  resetSession(): void {
    if (!this.isInitialized || !window.$crisp) {
      console.warn('Crisp not initialized');
      return;
    }

    try {
      window.$crisp.push(["do", "session:reset"]);
    } catch (error) {
      console.error('Error resetting Crisp session:', error);
    }
  }

  hideChat(): void {
    if (!this.isInitialized || !window.$crisp) {
      return;
    }

    try {
      window.$crisp.push(["do", "chat:hide"]);
    } catch (error) {
      console.error('Error hiding Crisp chat:', error);
    }
  }

  showChat(): void {
    if (!this.isInitialized || !window.$crisp) {
      return;
    }

    try {
      window.$crisp.push(["do", "chat:show"]);
    } catch (error) {
      console.error('Error showing Crisp chat:', error);
    }
  }
}

// Global service instance
export const crispService = CrispService.getInstance();

// Extend Window interface for TypeScript
declare global {
  interface Window {
    $crisp: any;
    CRISP_WEBSITE_ID: string;
  }
}