import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    return (
        <Loader2
            className={`animate-spin ${sizeClasses[size]} ${className}`}
            aria-hidden="true"
        />
    );
};

interface TypingIndicatorProps {
    className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
    className = ''
}) => {
    return (
        <div className={`flex items-center space-x-1 ${className}`}>
            <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
        </div>
    );
};

export default LoadingSpinner;