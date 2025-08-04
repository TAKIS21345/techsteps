import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Phone } from 'lucide-react';
import { getAIService } from '../../services/ai';
import { AIMessage, ConversationContext } from '../../types/services';
import { LoadingSpinner } from './LoadingSpinner';
import { MessageBubble } from './MessageBubble';
import { SuggestedActions } from './SuggestedActions';
import { EscalationNotice } from './EscalationNotice';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: Partial<ConversationContext>;
  className?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  context = {},
  className = ''
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [currentInteractionId, setCurrentInteractionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiService = getAIService();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: AIMessage = {
        id: 'welcome-' + Date.now(),
        content: "Hello! I'm here to help you with any questions about using this platform. I'll do my best to explain things clearly and patiently. What would you like to know?",
        sender: 'ai',
        timestamp: new Date(),
        confidence: 1.0
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isEscalated) return;

    const userMessage: AIMessage = {
      id: 'user-' + Date.now(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const conversationContext: ConversationContext = {
        currentPage: context.currentPage || window.location.pathname,
        currentTutorial: context.currentTutorial,
        userSkillLevel: context.userSkillLevel,
        previousQuestions: messages.filter(m => m.sender === 'user').map(m => m.content),
        failureCount: 0,
        ...context
      };

      const response = await aiService.sendMessage(userMessage.content, conversationContext);
      
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSatisfactionRating = async (rating: number) => {
    if (currentInteractionId) {
      await aiService.recordSatisfaction(currentInteractionId, rating);
    }
  };

  const handleEmergencySupport = () => {
    setIsEscalated(true);
    // In a real implementation, this would trigger emergency support
    console.log('Emergency support requested');
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Helper</h3>
            <p className="text-sm text-gray-600">Here to help you learn</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEmergencySupport}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Emergency Support"
            aria-label="Get emergency support"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close AI Assistant"
          >
            ×
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSatisfactionRating={message.sender === 'ai' ? handleSatisfactionRating : undefined}
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
              <LoadingSpinner />
              <span className="text-sm text-gray-600 ml-2">Thinking...</span>
            </div>
          </div>
        )}

        {isEscalated && (
          <EscalationNotice />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Actions */}
      <SuggestedActions context={context} />

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        {!isEscalated ? (
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question here..."
              className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              aria-label="Type your question"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-3">You're now connected with our support team</p>
            <button
              onClick={() => window.open('tel:1-800-SENIOR-HELP', '_self')}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Phone className="w-5 h-5" />
              <span>Call Support: 1-800-SENIOR-HELP</span>
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="px-4 pb-2">
        <p className="text-xs text-gray-500 text-center">
          Press Enter to send • Ask me anything about using this platform
        </p>
      </div>
    </div>
  );
};