import React, { useState, useRef, useEffect } from 'react';
import { Bot, Phone, X, Minimize2, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAIService } from '../../services/ai';
import { AIMessage, ConversationContext } from '../../types/services';
import { MessageBubble } from './MessageBubble';
import { SuggestedActions } from './SuggestedActions';
import { EscalationNotice } from './EscalationNotice';
import { MultiModalInput } from './MultiModalInput';
import { LoadingSpinner } from './LoadingSpinner';

interface EnhancedAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: Partial<ConversationContext>;
  className?: string;
  initialMode?: 'compact' | 'expanded';
}

export const EnhancedAIAssistant: React.FC<EnhancedAIAssistantProps> = ({
  isOpen,
  onClose,
  context = {},
  className = '',
  initialMode = 'expanded'
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [isMinimized, setIsMinimized] = useState(initialMode === 'compact');
  const [currentInteractionId, setCurrentInteractionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiService = getAIService();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: AIMessage = {
        id: 'welcome-' + Date.now(),
        content: getWelcomeMessage(),
        sender: 'ai',
        timestamp: new Date(),
        confidence: 1.0
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const getWelcomeMessage = (): string => {
    if (context.currentTutorial) {
      return t('ai.welcome.tutorial', {
        tutorial: context.currentTutorial,
        defaultValue: `Hello! I see you're working on "{{tutorial}}". I'm here to help you with any questions. You can type, speak, or show me images - whatever feels most comfortable for you!`
      });
    }
    
    return t('ai.welcome.general', 
      "Hello! I'm your AI assistant, here to help you learn technology step by step. You can ask me questions by typing, speaking, or showing me images. What would you like to know?"
    );
  };

  const buildConversationContext = (): ConversationContext => ({
    currentPage: context.currentPage || window.location.pathname,
    currentTutorial: context.currentTutorial,
    userSkillLevel: context.userSkillLevel || 'beginner',
    previousQuestions: messages.filter(m => m.sender === 'user').map(m => m.content),
    failureCount: 0,
    ...context
  });

  const handleTextMessage = async (message: string) => {
    await processMessage(message, 'text');
  };

  const handleVoiceMessage = async (audioBlob: Blob) => {
    await processMessage('[Voice message]', 'voice', audioBlob);
  };

  const handleImageMessage = async (imageFile: File, imageContext?: string) => {
    const displayText = imageContext 
      ? `[Image shared] ${imageContext}`
      : '[Image shared]';
    await processMessage(displayText, 'image', imageFile);
  };

  const processMessage = async (
    displayContent: string, 
    type: 'text' | 'voice' | 'image',
    attachment?: Blob | File
  ) => {
    if (isLoading || isEscalated) return;

    const userMessage: AIMessage = {
      id: 'user-' + Date.now(),
      content: displayContent,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const conversationContext = buildConversationContext();
      let response;

      switch (type) {
        case 'voice':
          if (aiService.sendVoiceMessage && attachment instanceof Blob) {
            response = await aiService.sendVoiceMessage(attachment, conversationContext);
          } else {
            throw new Error('Voice message not supported by current AI service');
          }
          break;
        
        case 'image':
          if (aiService.sendImageMessage && attachment instanceof File) {
            response = await aiService.sendImageMessage(attachment, conversationContext);
          } else {
            throw new Error('Image message not supported by current AI service');
          }
          break;
        
        default:
          response = await aiService.sendMessage(displayContent, conversationContext);
      }

      const aiMessage: AIMessage = {
        id: 'ai-' + Date.now(),
        content: response.content,
        sender: 'ai',
        timestamp: new Date(),
        confidence: response.confidence
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentInteractionId(aiMessage.id);

      // Check if escalation is needed
      if (response.requiresHumanEscalation) {
        setIsEscalated(true);
        await aiService.escalateToHuman(
          conversationContext.currentPage || 'general',
          `User needs human assistance (${type} input)`
        );
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: AIMessage = {
        id: 'error-' + Date.now(),
        content: t('ai.error.general', 
          "I'm sorry, I'm having trouble right now. Let me connect you with our support team who can help you immediately."
        ),
        sender: 'ai',
        timestamp: new Date(),
        confidence: 0.1
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsEscalated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSatisfactionRating = async (rating: number) => {
    if (currentInteractionId) {
      await aiService.trackInteractionQuality(currentInteractionId, rating);
    }
  };

  const handleEmergencySupport = () => {
    setIsEscalated(true);
    console.log('Emergency support requested');
  };

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) return null;

  const containerClasses = isMinimized 
    ? 'w-80 h-16' 
    : 'w-96 h-[700px] sm:h-[600px]';

  return (
    <div className={`
      fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 
      flex flex-col z-50 transition-all duration-300 ease-in-out
      ${containerClasses} ${className}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          {!isMinimized && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('ai.title', 'AI Helper')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('ai.subtitle', 'Here to help you learn')}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {!isMinimized && (
            <button
              onClick={handleEmergencySupport}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors touch-target"
              title={t('ai.emergency', 'Emergency Support')}
              aria-label={t('ai.emergencyAria', 'Get emergency support')}
            >
              <Phone className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={toggleMinimized}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors touch-target"
            aria-label={isMinimized ? t('ai.expand', 'Expand') : t('ai.minimize', 'Minimize')}
          >
            {isMinimized ? (
              <Maximize2 className="w-5 h-5" />
            ) : (
              <Minimize2 className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors touch-target"
            aria-label={t('ai.close', 'Close AI Assistant')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content - only show when not minimized */}
      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onSatisfactionRating={message.sender === 'ai' ? handleSatisfactionRating : undefined}
              />
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4 max-w-xs">
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm text-gray-600">
                      {t('ai.thinking', 'AI is thinking...')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isEscalated && <EscalationNotice />}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Actions */}
          {!isEscalated && <SuggestedActions context={context} />}

          {/* Multimodal Input */}
          <div className="border-t border-gray-200">
            {!isEscalated ? (
              <MultiModalInput
                onTextSubmit={handleTextMessage}
                onVoiceSubmit={handleVoiceMessage}
                onImageSubmit={handleImageMessage}
                isLoading={isLoading}
                disabled={isEscalated}
                className="border-0 shadow-none rounded-none rounded-b-xl"
              />
            ) : (
              <div className="p-4 text-center">
                <p className="text-gray-600 mb-3">
                  {t('ai.escalated', "You're now connected with our support team")}
                </p>
                <button
                  onClick={() => window.open('tel:1-800-SENIOR-HELP', '_self')}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 button-target"
                >
                  <Phone className="w-5 h-5" />
                  <span>{t('ai.callSupport', 'Call Support: 1-800-SENIOR-HELP')}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Minimized State Indicator */}
      {isMinimized && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-gray-600">
            <Bot className="w-5 h-5" />
            <span className="text-sm font-medium">
              {t('ai.minimized', 'AI Helper')}
            </span>
            {isLoading && <LoadingSpinner size="sm" />}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAIAssistant;