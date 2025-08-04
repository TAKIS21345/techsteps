import { useState, useCallback, useRef } from 'react';

export interface FlashcardAvatarState {
  isVisible: boolean;
  textToSpeak: string | null;
  isEnabled: boolean;
}

export interface FlashcardAvatarActions {
  showAvatar: () => void;
  hideAvatar: () => void;
  speakText: (text: string) => void;
  onUserInteraction: () => void;
  enableAvatar: () => void;
  disableAvatar: () => void;
}

export const useFlashcardAvatar = (initialEnabled: boolean = true) => {
  const [state, setState] = useState<FlashcardAvatarState>({
    isVisible: false,
    textToSpeak: null,
    isEnabled: initialEnabled
  });

  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showAvatar = useCallback(() => {
    if (state.isEnabled) {
      setState(prev => ({ ...prev, isVisible: true }));
    }
  }, [state.isEnabled]);

  const hideAvatar = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false, textToSpeak: null }));
    
    // Clear any pending speech
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (!state.isEnabled || !state.isVisible) return;

    setState(prev => ({ ...prev, textToSpeak: text }));
    
    // Clear text after a delay to allow for re-speaking the same text
    speechTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, textToSpeak: null }));
    }, 100);
  }, [state.isEnabled, state.isVisible]);

  const onUserInteraction = useCallback(() => {
    // This can be called when user completes a flashcard
    // The avatar component will handle the reaction animation
  }, []);

  const enableAvatar = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: true }));
  }, []);

  const disableAvatar = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: false, isVisible: false, textToSpeak: null }));
    
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
  }, []);

  const actions: FlashcardAvatarActions = {
    showAvatar,
    hideAvatar,
    speakText,
    onUserInteraction,
    enableAvatar,
    disableAvatar
  };

  return {
    state,
    actions
  };
};