// pure utility

export interface Command {
    action: 'navigate' | 'help' | 'unknown';
    target?: string;
    response?: string;
}

export const parseCommand = (input: string): Command | null => {
    const lowerInput = input.toLowerCase().trim();

    // Navigation commands
    if (lowerInput.includes('go to') || lowerInput.includes('open') || lowerInput.includes('navigate to')) {
        if (lowerInput.includes('settings')) return { action: 'navigate', target: '/settings' };
        if (lowerInput.includes('profile')) return { action: 'navigate', target: '/profile' };
        if (lowerInput.includes('home') || lowerInput.includes('dashboard')) return { action: 'navigate', target: '/' };
        if (lowerInput.includes('learning') || lowerInput.includes('lessons')) return { action: 'navigate', target: '/learning-center' };
    }

    // Help/System commands
    if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
        return {
            action: 'help',
            response: "I can help you navigate the app, answer tech questions, or guide you through tasks. Try saying 'Go to settings' or 'How do I send an email?'"
        };
    }

    return null;
};
