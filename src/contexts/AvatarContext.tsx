import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type AvatarEmotion = 'happy' | 'thinking' | 'excited' | 'concerned' | 'neutral' | 'listening' | 'speaking';

interface AvatarState {
    emotion: AvatarEmotion;
    isListening: boolean;
    isSpeaking: boolean;
    isThinking: boolean;
    message: string | null; // For displaying bubbles/toasts
}

interface AvatarContextType {
    state: AvatarState;
    setEmotion: (emotion: AvatarEmotion) => void;
    setListening: (isListening: boolean) => void;
    setSpeaking: (isSpeaking: boolean) => void;
    setThinking: (isThinking: boolean) => void;
    setMessage: (message: string | null) => void;
    reset: () => void;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export const AvatarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AvatarState>({
        emotion: 'neutral',
        isListening: false,
        isSpeaking: false,
        isThinking: false,
        message: null,
    });

    const setEmotion = useCallback((emotion: AvatarEmotion) => {
        setState((prev) => ({ ...prev, emotion }));
    }, []);

    const setListening = useCallback((isListening: boolean) => {
        setState((prev) => ({
            ...prev,
            isListening,
            emotion: isListening ? 'listening' : (prev.emotion === 'listening' ? 'neutral' : prev.emotion)
        }));
    }, []);

    const setSpeaking = useCallback((isSpeaking: boolean) => {
        setState((prev) => ({
            ...prev,
            isSpeaking,
            emotion: isSpeaking ? 'speaking' : (prev.emotion === 'speaking' ? 'neutral' : prev.emotion)
        }));
    }, []);

    const setThinking = useCallback((isThinking: boolean) => {
        setState((prev) => ({
            ...prev,
            isThinking,
            emotion: isThinking ? 'thinking' : (prev.emotion === 'thinking' ? 'neutral' : prev.emotion)
        }));
    }, []);

    const setMessage = useCallback((message: string | null) => {
        setState((prev) => ({ ...prev, message }));
    }, []);

    const reset = useCallback(() => {
        setState({
            emotion: 'neutral',
            isListening: false,
            isSpeaking: false,
            isThinking: false,
            message: null,
        });
    }, []);

    return (
        <AvatarContext.Provider value={{ state, setEmotion, setListening, setSpeaking, setThinking, setMessage, reset }}>
            {children}
        </AvatarContext.Provider>
    );
};

export const useAvatar = () => {
    const context = useContext(AvatarContext);
    if (context === undefined) {
        throw new Error('useAvatar must be used within an AvatarProvider');
    }
    return context;
};
