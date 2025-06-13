import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, User, Bot, Phone, Video, Loader2 } from 'lucide-react';
import { cometChatService } from '../utils/cometChatService';

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: {
    question: string;
    steps: string[];
    userProfile: any;
    chatMemory: any[];
  };
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support' | 'system';
  timestamp: Date;
}

const SupportChatModal: React.FC<SupportChatModalProps> = ({
  isOpen,
  onClose,
  context
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [supportAgent, setSupportAgent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    } else {
      cleanup();
    }

    return () => cleanup();
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      setIsConnecting(true);
      
      // Try to initialize CometChat
      try {
        await cometChatService.initialize();
        
        // Login user (using their user ID)
        const userId = `user-${context.userProfile?.firstName || 'guest'}-${Date.now()}`;
        await cometChatService.loginUser(userId, context.userProfile?.firstName || 'Guest User');
      } catch (cometError) {
        console.error('CometChat initialization failed:', cometError);
        // Show fallback message instead of failing completely
        const fallbackMessage: Message = {
          id: 'fallback-1',
          text: 'Live chat is temporarily unavailable. Please try the following alternatives:\n\n• Email us at support@techstep.com\n• Call us at 1-800-TECH-HELP\n• Try asking your question again in the main interface',
          sender: 'system',
          timestamp: new Date()
        };
        setMessages([fallbackMessage]);
        setIsConnecting(false);
        return;
      }

      // Add system message
      const systemMessage: Message = {
        id: 'system-1',
        text: 'Connecting you with a human support agent. Please wait...',
        sender: 'system',
        timestamp: new Date()
      };
      setMessages([systemMessage]);

      try {
        // Start support chat with context
        const conversationId = await cometChatService.startSupportChat(context);
        
        // Set up message listener
        cometChatService.onMessageReceived((message) => {
          const newMsg: Message = {
            id: message.id || `msg-${Date.now()}`,
            text: message.text,
            sender: 'support',
            timestamp: new Date(message.sentAt * 1000)
          };
          setMessages(prev => [...prev, newMsg]);
          
          // Set support agent name if available
          if (message.sender?.name && !supportAgent) {
            setSupportAgent(message.sender.name);
          }
        });
      } catch (chatError) {
        console.error('Failed to start support chat:', chatError);
        const errorMessage: Message = {
          id: 'error-chat',
          text: 'Unable to connect to live support right now. Our team has been notified and will contact you soon. In the meantime, try asking your question in the main interface.',
          sender: 'system',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsConnecting(false);
        return;
      }

      setIsConnected(true);
      
      // Add connected message
      setTimeout(() => {
        const connectedMessage: Message = {
          id: 'system-2',
          text: 'Connected! A support agent will be with you shortly. They have been provided with context about your question.',
          sender: 'system',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, connectedMessage]);
      }, 1000);

    } catch (error) {
      console.error('Failed to initialize chat:', error);
      const errorMessage: Message = {
        id: 'system-error',
        text: 'Sorry, we couldn\'t connect you to support right now. Please try again later or contact us directly at support@techstep.com or 1-800-TECH-HELP.',
        sender: 'system',
        timestamp: new Date()
      };
      setMessages([errorMessage]);
    } finally {
      setIsConnecting(false);
    }
  };

  const cleanup = () => {
    cometChatService.removeMessageListener();
    setMessages([]);
    setIsConnected(false);
    setSupportAgent(null);
    setNewMessage('');
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      await cometChatService.sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        text: 'Failed to send message. Please try again.',
        sender: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Human Support</h2>
              <p className="text-sm text-gray-600">
                {isConnecting ? 'Connecting...' : 
                 isConnected ? (supportAgent ? `Chatting with ${supportAgent}` : 'Connected') : 
                 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected && (
              <>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                  <Video className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === 'user' ? 'bg-blue-600' :
                  message.sender === 'support' ? 'bg-green-600' :
                  'bg-gray-600'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : message.sender === 'support' ? (
                    <MessageCircle className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`rounded-2xl px-4 py-2 ${
                  message.sender === 'user' ? 'bg-blue-600 text-white' :
                  message.sender === 'support' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-50 text-yellow-800 border border-yellow-200'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isConnecting && (
            <div className="flex justify-center">
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Connecting to support...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type your message..." : "Connecting..."}
              disabled={!isConnected}
              className="flex-1 input-field"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="btn-primary px-4 py-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          {!isConnected && (
            <p className="text-xs text-gray-500 mt-2">
              We've shared your question details with our helper so they can assist you better.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportChatModal;