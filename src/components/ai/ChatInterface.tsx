import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, MessageSquare, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MarkdownRenderer from './MarkdownRenderer';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  isListening?: boolean;
  currentTranscript?: string;
  className?: string;
  autoTTSEnabled?: boolean;
  onSpeakMessage?: (message: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  isListening = false,
  currentTranscript = '',
  className = '',
  autoTTSEnabled = true,
  onSpeakMessage
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Handle transcript input
  useEffect(() => {
    if (currentTranscript && isListening) {
      setInputValue(currentTranscript);
    }
  }, [currentTranscript, isListening]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;

    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm animate-fade-in-up">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20 transform -rotate-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
                {t('chat.welcome.title', 'How can I help you today?')}
              </h3>
              <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">
                {t('chat.welcome.subtitle', 'Click the avatar to speak or type your question below')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-[2rem] px-8 py-5 text-lg leading-relaxed relative group shadow-sm transition-transform duration-300 hover:scale-[1.01]
                    ${message.sender === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-br-sm ml-12 shadow-indigo-500/20'
                      : 'bg-white/90 backdrop-blur-sm text-gray-800 rounded-bl-sm mr-12 border border-white/60 shadow-gray-200/50'
                    }
                  `}
                >
                  <MarkdownRenderer content={message.content} />

                  {/* Speaker button for AI messages when auto TTS is disabled */}
                  {message.sender === 'ai' && !autoTTSEnabled && onSpeakMessage && (
                    <button
                      onClick={() => onSpeakMessage(message.content)}
                      className="absolute -right-14 top-1/2 -translate-y-1/2 p-3 bg-white/80 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-white transition-all duration-300 shadow-sm border border-white/50"
                      aria-label="Read message aloud"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  )}

                  <div className={`
                    text-xs mt-2 opacity-60 font-medium
                    ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}
                  `}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Listening indicator */}
            {isListening && (
              <div className="flex justify-end animate-fade-in">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[2rem] rounded-br-none px-6 py-4 ml-12 shadow-lg shadow-emerald-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDuration: '1s' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDuration: '1s', animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDuration: '1s', animationDelay: '0.4s' }} />
                    </div>
                    <span className="font-medium">Listening...</span>
                  </div>
                  {currentTranscript && (
                    <div className="mt-2 text-sm text-emerald-100 border-t border-emerald-400/30 pt-2 italic">
                      "{currentTranscript}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white rounded-[2rem] rounded-bl-none px-6 py-4 mr-12 border border-white/60 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <span className="text-gray-500 font-medium">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-transparent">
        <div className="max-w-4xl mx-auto backdrop-blur-2xl bg-white/80 rounded-full px-2 py-2 shadow-2xl shadow-indigo-100/60 border border-white/80 relative transition-shadow duration-300 hover:shadow-indigo-200/60">
          <div className="relative flex items-center">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chat.input.placeholder', 'Ask anything here...')}
                className="
                  w-full px-8 py-4 pr-16 text-lg bg-transparent border-none
                  resize-none min-h-[64px] max-h-40
                  focus:outline-none focus:ring-0
                  disabled:opacity-50 disabled:cursor-not-allowed
                  placeholder-gray-400 text-gray-800 font-medium
                  items-center flex
                "
                disabled={isLoading || isListening}
                rows={1}
                style={{ paddingTop: '1.25rem' }}
              />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading || isListening}
                className={`
                  absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center
                  transition-all duration-300 transform
                  ${inputValue.trim() && !isLoading && !isListening
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 hover:rotate-12 active:scale-95'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }
                `}
              >
                <ArrowUp className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-3 text-center">
          <span className={`
            inline-flex items-center space-x-2 text-xs font-medium px-3 py-1 rounded-full
            ${isListening
              ? 'bg-emerald-100 text-emerald-700 animate-pulse'
              : 'bg-white/40 text-gray-500'
            }
          `}>
            {isListening ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t('chat.input.listening', 'Listening... Click avatar again to stop')}</span>
              </>
            ) : (
              <span>{t('chat.input.helper', 'Press Enter to send • Click avatar to speak')}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;