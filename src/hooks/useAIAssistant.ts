import { useState, useCallback, useRef, useEffect } from 'react';
import { getAIService } from '../services/ai';
import { AIMessage, ConversationContext, AIResponse } from '../types/services';

interface UseAIAssistantOptions {
  context?: Partial<ConversationContext>;
  autoWelcome?: boolean;
  maxMessages?: number;
}

interface UseAIAssistantReturn {
  messages: AIMessage[];
  isLoading: boolean;
  isEscalated: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  recordSatisfaction: (interactionId: string, rating: number) => Promise<void>;
  getQualityReport: () => any;
}

export const useAIAssistant = (options: UseAIAssistantOptions = {}): UseAIAssistantReturn => {
  const {
    context = {},
    autoWelcome = true,
    maxMessages = 50
  } = options;

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const aiService = useRef(getAIService());
  const conversationId = useRef(`conversation-${Date.now()}`);

  // Add welcome message on initialization
  useEffect(() => {
    if (autoWelcome && messages.length === 0) {
      const welcomeMessage: AIMessage = {
        id: 'welcome-' + Date.now(),
        content: getWelcomeMessage(context),
        sender: 'ai',
        timestamp: new Date(),
        confidence: 1.0
      };
      setMessages([welcomeMessage]);
    }
  }, [autoWelcome, messages.length, context]);

  const getWelcomeMessage = (ctx: Partial<ConversationContext>): string => {
    if (ctx.currentTutorial) {
      return `Hello! I see you're working on "${ctx.currentTutorial}". I'm here to help you with any questions about this tutorial or anything else on the platform. What would you like to know?`;
    }
    
    if (ctx.currentPage === '/') {
      return "Welcome! I'm here to help you get started with this learning platform. I can answer questions about creating an account, finding tutorials, or anything else you'd like to know. What can I help you with?";
    }

    return "Hello! I'm your AI assistant, here to help you with any questions about using this platform. I'll explain things clearly and patiently. What would you like to know?";
  };

  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isLoading || isEscalated) return;

    const userMessage: AIMessage = {
      id: 'user-' + Date.now(),
      content: messageContent.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const conversationContext: ConversationContext = {
        currentPage: context.currentPage || window.location.pathname,
        currentTutorial: context.currentTutorial,
        userSkillLevel: context.userSkillLevel || 'beginner',
        previousQuestions: messages.filter(m => m.sender === 'user').map(m => m.content),
        failureCount: 0,
        ...context
      };

      const response: AIResponse = await aiService.current.sendMessage(
        messageContent,
        conversationContext
      );

      const aiMessage: AIMessage = {
        id: 'ai-' + Date.now(),
        content: response.content,
        sender: 'ai',
        timestamp: new Date(),
        confidence: response.confidence
      };

      setMessages(prev => {
        const newMessages = [...prev, aiMessage];
        // Keep only the most recent messages to prevent memory issues
        return newMessages.slice(-maxMessages);
      });

      // Check if escalation is needed
      if (response.requiresHumanEscalation) {
        setIsEscalated(true);
        await aiService.current.escalateToHuman(
          conversationId.current,
          'User needs human assistance'
        );
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: AIMessage = {
        id: 'error-' + Date.now(),
        content: "I'm sorry, I'm having trouble right now. Let me connect you with our support team who can help you immediately.",
        sender: 'ai',
        timestamp: new Date(),
        confidence: 0.1
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsEscalated(true);
    } finally {
      setIsLoading(false);
    }
  }, [context, isLoading, isEscalated, messages, maxMessages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setIsEscalated(false);
    conversationId.current = `conversation-${Date.now()}`;
    
    // Clear conversation history in the service
    aiService.current.clearConversationHistory(conversationId.current);
  }, []);

  const recordSatisfaction = useCallback(async (interactionId: string, rating: number) => {
    try {
      await aiService.current.recordSatisfaction(interactionId, rating);
    } catch (error) {
      console.error('Error recording satisfaction:', error);
    }
  }, []);

  const getQualityReport = useCallback(() => {
    return aiService.current.getQualityReport();
  }, []);

  return {
    messages,
    isLoading,
    isEscalated,
    sendMessage,
    clearMessages,
    recordSatisfaction,
    getQualityReport
  };
};

// Hook for contextual help
export const useContextualHelp = (pageContext: {
  url?: string;
  title?: string;
  section?: string;
  userSkillLevel?: string;
  currentTutorial?: string;
}) => {
  const [helpContent, setHelpContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const aiService = useRef(getAIService());

  const getHelp = useCallback(async () => {
    setIsLoading(true);
    try {
      const context = {
        url: pageContext.url || window.location.pathname,
        title: pageContext.title || document.title,
        section: pageContext.section || 'general',
        userSkillLevel: pageContext.userSkillLevel,
        currentTutorial: pageContext.currentTutorial
      };

      const help = await aiService.current.getContextualHelp(context);
      setHelpContent(help);
    } catch (error) {
      console.error('Error getting contextual help:', error);
      setHelpContent({
        title: 'Help Available',
        content: 'Our support team is available to help you with any questions.',
        actions: [
          { label: 'Contact Support', type: 'contact', target: 'support' }
        ],
        relatedTopics: ['Getting Started', 'Common Questions']
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageContext]);

  return {
    helpContent,
    isLoading,
    getHelp
  };
};