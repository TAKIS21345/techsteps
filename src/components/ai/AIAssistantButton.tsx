import React, { useState } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { AIAssistant } from './AIAssistant';
import { ConversationContext } from '../../types/services';

interface AIAssistantButtonProps {
  context?: Partial<ConversationContext>;
  className?: string;
}

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({
  context,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={toggleAssistant}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 ${className}`}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {isOpen ? (
          <X className="w-8 h-8" />
        ) : (
          <>
            <MessageCircle className="w-8 h-8" />
            {hasNewMessage && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </>
        )}
      </button>

      {/* Tooltip */}
      {!isOpen && (
        <div className="fixed bottom-6 right-24 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30">
          Need help? Ask me anything!
          <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}

      {/* AI Assistant */}
      <AIAssistant
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        context={context}
      />

      {/* Welcome Pulse Animation */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-blue-600 opacity-30 animate-ping z-30 pointer-events-none"></div>
      )}
    </>
  );
};

export const InlineAIHelper: React.FC<{
  context?: Partial<ConversationContext>;
  placeholder?: string;
  className?: string;
}> = ({
  context,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-blue-900">Need Help?</h3>
            <p className="text-sm text-blue-700">I'm here to answer any questions about this page.</p>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ask AI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">AI Helper</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>
      <div className="h-96">
        <AIAssistant
          isOpen={true}
          onClose={() => setIsExpanded(false)}
          context={context}
          className="relative w-full h-full shadow-none border-none"
        />
      </div>
    </div>
  );
};