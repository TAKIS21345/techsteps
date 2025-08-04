import React from 'react';
import { BookOpen, HelpCircle, Phone, Settings, User } from 'lucide-react';
import { ConversationContext } from '../../types/services';

interface SuggestedActionsProps {
  context?: Partial<ConversationContext>;
  onActionClick?: (action: string, data: Record<string, unknown>) => void;
}

export const SuggestedActions: React.FC<SuggestedActionsProps> = ({
  context = {},
  onActionClick
}) => {
  const handleActionClick = (action: string, data: Record<string, unknown>) => {
    if (onActionClick) {
      onActionClick(action, data);
    } else {
      // Default action handling
      switch (action) {
        case 'navigate':
          window.location.href = data.target;
          break;
        case 'tutorial':
          window.location.href = `/tutorials/${data.target}`;
          break;
        case 'help':
          window.location.href = `/help/${data.target}`;
          break;
        case 'contact':
          window.location.href = '/support';
          break;
        default:
          console.log('Action clicked:', action, data);
      }
    }
  };

  const getContextualActions = () => {
    const actions = [];

    // Always available actions
    actions.push({
      icon: HelpCircle,
      label: 'Common Questions',
      action: 'help',
      data: { target: 'faq' },
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    });

    actions.push({
      icon: Phone,
      label: 'Contact Support',
      action: 'contact',
      data: { target: 'support' },
      color: 'bg-green-100 text-green-700 hover:bg-green-200'
    });

    // Context-specific actions
    if (context.currentPage === '/') {
      actions.unshift({
        icon: BookOpen,
        label: 'Getting Started',
        action: 'tutorial',
        data: { target: 'getting-started' },
        color: 'bg-purple-100 text-purple-700 hover:bg-purple-200'
      });
    }

    if (context.currentTutorial) {
      actions.unshift({
        icon: BookOpen,
        label: 'Continue Tutorial',
        action: 'tutorial',
        data: { target: context.currentTutorial },
        color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
      });
    }

    // Add settings action if user seems to need accessibility help
    if (context.currentPage?.includes('accessibility') || context.userSkillLevel === 'beginner') {
      actions.push({
        icon: Settings,
        label: 'Accessibility Settings',
        action: 'navigate',
        data: { target: '/settings/accessibility' },
        color: 'bg-orange-100 text-orange-700 hover:bg-orange-200'
      });
    }

    return actions.slice(0, 4); // Limit to 4 actions to avoid clutter
  };

  const actions = getContextualActions();

  if (actions.length === 0) return null;

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
      <p className="text-sm text-gray-600 mb-3 font-medium">Quick Actions:</p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleActionClick(action.action, action.data)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${action.color}`}
              aria-label={action.label}
            >
              <IconComponent className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const QuickStartActions: React.FC = () => {
  const quickActions = [
    {
      icon: BookOpen,
      label: 'How do I get started?',
      message: 'How do I get started with this platform?'
    },
    {
      icon: User,
      label: 'Create an account',
      message: 'How do I create an account?'
    },
    {
      icon: Settings,
      label: 'Adjust text size',
      message: 'How can I make the text larger and easier to read?'
    },
    {
      icon: HelpCircle,
      label: 'Navigation help',
      message: 'I\'m having trouble finding things on this website. Can you help me navigate?'
    }
  ];

  const handleQuickAction = (message: string) => {
    // This would trigger sending the message to the AI
    console.log('Quick action message:', message);
    // In a real implementation, this would call a parent function to send the message
  };

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-blue-50">
      <p className="text-sm text-blue-800 mb-3 font-medium">Try asking me:</p>
      <div className="space-y-2">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleQuickAction(action.message)}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left bg-white rounded-lg hover:bg-blue-100 transition-colors text-sm"
              aria-label={`Ask: ${action.label}`}
            >
              <IconComponent className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-gray-700">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};