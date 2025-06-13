import { CometChat } from '@cometchat/chat-sdk-javascript';

export interface ChatMemory {
  id: string;
  userId: string;
  timestamp: Date;
  type: 'question' | 'clarification' | 'completion' | 'context';
  content: string;
  metadata?: {
    deviceType?: string;
    techLevel?: string;
    stepCount?: number;
    successful?: boolean;
    tags?: string[];
  };
}

export class CometChatService {
  private static instance: CometChatService;
  private isInitialized = false;
  private currentUser: any = null;

  // CometChat configuration
  private readonly APP_ID = '276772c8f67f3524c';
  private readonly REGION = 'us';
  private readonly AUTH_KEY = '82d33ec15f92e4d2db7c85216a5e9413a0f7f271';
  private readonly SUPPORT_UID = 'support-agent'; // UID for support agents

  private constructor() {}

  static getInstance(): CometChatService {
    if (!CometChatService.instance) {
      CometChatService.instance = new CometChatService();
    }
    return CometChatService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const appSetting = new CometChat.AppSettingsBuilder()
        .subscribePresenceForAllUsers()
        .setRegion(this.REGION)
        .autoEstablishSocketConnection(true)
        .build();

      await CometChat.init(this.APP_ID, appSetting);
      this.isInitialized = true;
      console.log('CometChat initialized successfully');
    } catch (error) {
      console.error('CometChat initialization failed:', error);
      // Don't throw error, just log it so app continues to work
      console.warn('CometChat will not be available for this session');
    }
  }

  async loginUser(userId: string, userName: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // If initialization failed, skip CometChat functionality
      if (!this.isInitialized) {
        console.warn('CometChat not initialized, skipping login');
        return;
      }

      // Check if user exists, if not create them
      let user;
      try {
        user = await CometChat.getUser(userId);
      } catch (error) {
        // User doesn't exist, create them
        const newUser = new CometChat.User(userId);
        newUser.setName(userName);
        try {
          user = await CometChat.createUser(newUser, this.AUTH_KEY);
        } catch (createError) {
          console.error('Failed to create CometChat user:', createError);
          return;
        }
      }

      // Login the user
      try {
        const loggedInUser = await CometChat.login(userId, this.AUTH_KEY);
        this.currentUser = loggedInUser;
        console.log('User logged in successfully:', loggedInUser);
      } catch (loginError) {
        console.error('Failed to login to CometChat:', loginError);
      }
    } catch (error) {
      console.error('CometChat login failed:', error);
      // Don't throw error, just log it
      console.warn('CometChat login failed, chat functionality will be limited');
    }
  }

  async startSupportChat(context: {
    question: string;
    steps: string[];
    userProfile: any;
    chatMemory: ChatMemory[];
  }): Promise<string> {
    try {
      if (!this.isInitialized || !this.currentUser) {
        throw new Error('CometChat not available - please try again later');
      }

      // Create a support conversation with context
      const contextMessage = this.formatContextForSupport(context);
      
      // Send initial context message to support
      const textMessage = new CometChat.TextMessage(
        this.SUPPORT_UID,
        contextMessage,
        CometChat.RECEIVER_TYPE.USER
      );

      await CometChat.sendMessage(textMessage);

      // Return the conversation ID for the UI
      return `support-${this.currentUser.uid}-${Date.now()}`;
    } catch (error) {
      console.error('Failed to start support chat:', error);
      throw error;
    }
  }

  private formatContextForSupport(context: {
    question: string;
    steps: string[];
    userProfile: any;
    chatMemory: ChatMemory[];
  }): string {
    const { question, steps, userProfile, chatMemory } = context;
    
    let contextMessage = `🆘 SUPPORT REQUEST\n\n`;
    contextMessage += `👤 User: ${userProfile?.firstName || 'Unknown'}\n`;
    contextMessage += `📱 Device: ${userProfile?.os || 'Unknown'}\n`;
    contextMessage += `🎯 Tech Level: ${userProfile?.techExperience || 'Unknown'}\n\n`;
    
    contextMessage += `❓ ORIGINAL QUESTION:\n${question}\n\n`;
    
    contextMessage += `📋 STEPS PROVIDED:\n`;
    steps.forEach((step, index) => {
      const cleanStep = step.replace(/<[^>]*>/g, ''); // Remove HTML tags
      contextMessage += `${index + 1}. ${cleanStep}\n`;
    });
    
    if (chatMemory.length > 0) {
      contextMessage += `\n📚 RECENT CONTEXT:\n`;
      const recentMemory = chatMemory.slice(-3); // Last 3 interactions
      recentMemory.forEach(memory => {
        contextMessage += `• ${memory.content.substring(0, 100)}...\n`;
      });
    }
    
    contextMessage += `\n💬 User needs additional help with the above steps.`;
    
    return contextMessage;
  }

  async sendMessage(message: string): Promise<void> {
    try {
      if (!this.isInitialized || !this.currentUser) {
        throw new Error('CometChat not available');
      }

      const textMessage = new CometChat.TextMessage(
        this.SUPPORT_UID,
        message,
        CometChat.RECEIVER_TYPE.USER
      );

      await CometChat.sendMessage(textMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  onMessageReceived(callback: (message: any) => void): void {
    if (!this.isInitialized) {
      console.warn('CometChat not initialized, cannot listen for messages');
      return;
    }

    CometChat.addMessageListener(
      'support-listener',
      new CometChat.MessageListener({
        onTextMessageReceived: (message: any) => {
          callback(message);
        }
      })
    );
  }

  removeMessageListener(): void {
    if (!this.isInitialized) return;
    
    CometChat.removeMessageListener('support-listener');
  }

  async logout(): Promise<void> {
    try {
      if (!this.isInitialized) return;
      
      await CometChat.logout();
      this.currentUser = null;
    } catch (error) {
      console.error('CometChat logout failed:', error);
    }
  }
}

export class ChatMemoryService {
  private static instance: ChatMemoryService;
  private readonly GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  private constructor() {}

  static getInstance(): ChatMemoryService {
    if (!ChatMemoryService.instance) {
      ChatMemoryService.instance = new ChatMemoryService();
    }
    return ChatMemoryService.instance;
  }

  async analyzeAndSaveMemory(
    userId: string,
    interaction: {
      question: string;
      response: string[];
      userProfile: any;
      successful?: boolean;
    },
    updateUserData: (data: any) => Promise<void>
  ): Promise<void> {
    try {
      if (!this.GEMINI_API_KEY) {
        console.warn('Gemini API key not available for memory analysis');
        return;
      }

      // Analyze the interaction to extract key information
      const analysisPrompt = `
Analyze this tech support interaction and extract key information that should be remembered for future conversations.

User Profile:
- Name: ${interaction.userProfile?.firstName || 'Unknown'}
- Device: ${interaction.userProfile?.os || 'Unknown'}
- Tech Level: ${interaction.userProfile?.techExperience || 'Unknown'}

Question: "${interaction.question}"

Steps Provided: ${interaction.response.join(' ')}

Success: ${interaction.successful ? 'Yes' : 'Unknown'}

Extract and return JSON with:
{
  "shouldSave": boolean,
  "memoryType": "question" | "context" | "preference" | "skill",
  "keyInsights": string[],
  "tags": string[],
  "importance": 1-5,
  "summary": "brief summary for future reference"
}

Save if:
- User learned something new
- Revealed preferences or patterns
- Showed specific challenges
- Completed complex task
- Asked follow-up questions

Don't save routine/simple interactions.
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: analysisPrompt }]
          }],
          generationConfig: {
            response_mime_type: "application/json"
          }
        })
      });

      const data = await response.json();
      const analysis = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{"shouldSave": false}');

      if (analysis.shouldSave) {
        const memory: ChatMemory = {
          id: `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          timestamp: new Date(),
          type: analysis.memoryType || 'question',
          content: analysis.summary || interaction.question,
          metadata: {
            deviceType: interaction.userProfile?.os,
            techLevel: interaction.userProfile?.techExperience,
            stepCount: interaction.response.length,
            successful: interaction.successful,
            tags: analysis.tags || []
          }
        };

        // Save to user's chat memory
        await this.saveMemoryToDatabase(userId, memory, updateUserData);
      }
    } catch (error) {
      console.error('Error analyzing chat memory:', error);
    }
  }

  private async saveMemoryToDatabase(
    userId: string,
    memory: ChatMemory,
    updateUserData: (data: any) => Promise<void>
  ): Promise<void> {
    try {
      // Get existing memories and add new one
      const existingMemories = await this.getChatMemories(userId);
      const updatedMemories = [...existingMemories, memory];

      // Keep only last 50 memories to prevent bloat
      const trimmedMemories = updatedMemories.slice(-50);

      // Update user data with new memories
      await updateUserData({
        chatMemory: trimmedMemories
      });

      console.log('Chat memory saved:', memory.content);
    } catch (error) {
      console.error('Error saving chat memory:', error);
    }
  }

  async getChatMemories(userId: string): Promise<ChatMemory[]> {
    // This would typically fetch from the database
    // For now, return empty array as placeholder
    return [];
  }

  async getRelevantMemories(
    userId: string,
    currentQuestion: string,
    userProfile: any
  ): Promise<ChatMemory[]> {
    try {
      if (!this.GEMINI_API_KEY) {
        return [];
      }

      const memories = await this.getChatMemories(userId);
      if (memories.length === 0) return [];

      // Use AI to find relevant memories
      const relevancePrompt = `
Current question: "${currentQuestion}"
User device: ${userProfile?.os || 'Unknown'}

Previous memories:
${memories.map((m, i) => `${i + 1}. ${m.content} (${m.type}, ${m.metadata?.tags?.join(', ') || 'no tags'})`).join('\n')}

Return JSON array of memory indices (1-based) that are relevant to the current question:
{
  "relevantMemories": [1, 3, 5]
}

Consider:
- Similar topics/devices
- Related technical concepts
- User's past challenges
- Learned preferences
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: relevancePrompt }]
          }],
          generationConfig: {
            response_mime_type: "application/json"
          }
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{"relevantMemories": []}');

      // Return relevant memories
      return result.relevantMemories
        .map((index: number) => memories[index - 1])
        .filter(Boolean)
        .slice(0, 5); // Limit to 5 most relevant

    } catch (error) {
      console.error('Error getting relevant memories:', error);
      return [];
    }
  }

  formatMemoriesForContext(memories: ChatMemory[]): string {
    if (memories.length === 0) return '';

    let context = '\nRELEVANT PAST INTERACTIONS:\n';
    memories.forEach((memory, index) => {
      context += `${index + 1}. ${memory.content}`;
      if (memory.metadata?.tags?.length) {
        context += ` (${memory.metadata.tags.join(', ')})`;
      }
      context += '\n';
    });
    context += '\nUse this context to provide more personalized help.\n';

    return context;
  }
}

// Global service instances
export const cometChatService = CometChatService.getInstance();
export const chatMemoryService = ChatMemoryService.getInstance();