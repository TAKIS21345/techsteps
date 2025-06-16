import React from 'react';

interface TawkToSupportProps {
  context?: {
    question: string;
    steps: string[];
    userProfile: any;
    chatMemory: any[];
  };
}

export const TawkToSupport: React.FC<TawkToSupportProps> = ({ context }) => {
  const openTawkToChat = () => {
    // Check if Tawk.to is loaded
    if (typeof window !== 'undefined' && window.Tawk_API) {
      // Set user attributes for better support context
      if (context?.userProfile) {
        window.Tawk_API.setAttributes({
          'name': `${context.userProfile.firstName} ${context.userProfile.lastName || ''}`,
          'email': context.userProfile.email || '',
          'device': context.userProfile.os || 'Unknown',
          'tech_level': context.userProfile.techExperience || 'Unknown',
          'current_question': context.question || 'General support',
          'steps_provided': context.steps?.length || 0
        }, function(error: any) {
          if (error) {
            console.error('Error setting Tawk.to attributes:', error);
          }
        });
      }

      // Add a visitor message with context if available
      if (context?.question) {
        const contextMessage = `User needs help with: "${context.question}"${
          context.steps?.length ? ` (${context.steps.length} steps were provided)` : ''
        }`;
        
        window.Tawk_API.addEvent('Support Request', {
          'question': context.question,
          'steps_count': context.steps?.length || 0,
          'user_device': context.userProfile?.os || 'Unknown',
          'tech_level': context.userProfile?.techExperience || 'Unknown'
        });
      }

      // Show and maximize the chat widget
      window.Tawk_API.showWidget();
      window.Tawk_API.maximize();
    } else {
      // Fallback if Tawk.to is not loaded
      alert('Live chat is temporarily unavailable. Please try again in a moment or contact us at support@techstep.com');
    }
  };

  return { openTawkToChat };
};

// Hook for easy use in components
export const useTawkToSupport = () => {
  const openTawkToChat = (context?: {
    question: string;
    steps: string[];
    userProfile: any;
    chatMemory: any[];
  }) => {
    if (typeof window !== 'undefined' && window.Tawk_API) {
      // Set user attributes for better support context
      if (context?.userProfile) {
        window.Tawk_API.setAttributes({
          'name': `${context.userProfile.firstName} ${context.userProfile.lastName || ''}`,
          'email': context.userProfile.email || '',
          'device': context.userProfile.os || 'Unknown',
          'tech_level': context.userProfile.techExperience || 'Unknown',
          'current_question': context.question || 'General support',
          'steps_provided': context.steps?.length || 0
        }, function(error: any) {
          if (error) {
            console.error('Error setting Tawk.to attributes:', error);
          }
        });
      }

      // Add context as an event
      if (context?.question) {
        window.Tawk_API.addEvent('Support Request', {
          'question': context.question,
          'steps_count': context.steps?.length || 0,
          'user_device': context.userProfile?.os || 'Unknown',
          'tech_level': context.userProfile?.techExperience || 'Unknown'
        });
      }

      // Show and maximize the chat widget
      window.Tawk_API.showWidget();
      window.Tawk_API.maximize();
    } else {
      alert('Live chat is temporarily unavailable. Please try again in a moment or contact us at support@techstep.com');
    }
  };

  return { openTawkToChat };
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Tawk_API: any;
  }
}