import React, { useState } from 'react';
import { User, Bot, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import { AIMessage } from '../../types/services';

interface MessageBubbleProps {
  message: AIMessage;
  onSatisfactionRating?: (rating: number) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onSatisfactionRating
}) => {
  const [showRating, setShowRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const isUser = message.sender === 'user';
  const isAI = message.sender === 'ai';

  const handleRating = (rating: number) => {
    if (onSatisfactionRating) {
      onSatisfactionRating(rating);
      setHasRated(true);
      setShowRating(false);
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-blue-100 ml-3' : 'bg-gray-100 mr-3'
        }`}>
          {isUser ? (
            <User className="w-6 h-6 text-blue-600" />
          ) : (
            <Bot className="w-6 h-6 text-gray-600" />
          )}
        </div>

        {/* Message Content */}
        <div className={`rounded-lg px-4 py-3 ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          {/* Message Text */}
          <div className="text-lg leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Message Metadata */}
          <div className={`flex items-center justify-between mt-2 text-sm ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span>{formatTime(message.timestamp)}</span>
            
            {/* Confidence Indicator for AI messages */}
            {isAI && message.confidence !== undefined && (
              <span className={`ml-2 ${getConfidenceColor(message.confidence)}`}>
                Confidence: {Math.round(message.confidence * 100)}%
              </span>
            )}
          </div>

          {/* Rating Section for AI messages */}
          {isAI && onSatisfactionRating && !hasRated && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              {!showRating ? (
                <button
                  onClick={() => setShowRating(true)}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Was this helpful?
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">How helpful was this response?</p>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleRating(rating)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        aria-label={`Rate ${rating} out of 5 stars`}
                      >
                        <Star className="w-5 h-5 text-yellow-400 hover:text-yellow-500" />
                      </button>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRating(5)}
                      className="flex items-center space-x-1 px-2 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Helpful</span>
                    </button>
                    <button
                      onClick={() => handleRating(2)}
                      className="flex items-center space-x-1 px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>Not helpful</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thank you message after rating */}
          {hasRated && (
            <div className="mt-2 text-sm text-green-600">
              Thank you for your feedback!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};