import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TranslationAnimationContextType {
  isTranslating: boolean;
  setIsTranslating: (isTranslating: boolean) => void;
  triggerTranslationAnimation: (languageChangeFn: () => Promise<any>) => Promise<void>;
}

const TranslationAnimationContext = createContext<TranslationAnimationContextType | undefined>(undefined);

export const useTranslationAnimation = () => {
  const context = useContext(TranslationAnimationContext);
  if (!context) {
    throw new Error('useTranslationAnimation must be used within a TranslationAnimationProvider');
  }
  return context;
};

interface TranslationAnimationProviderProps {
  children: ReactNode;
}

export const TranslationAnimationProvider: React.FC<TranslationAnimationProviderProps> = ({ children }) => {
  const [isTranslating, setIsTranslatingState] = useState(false);

  // This function will wrap the actual language change logic
  const triggerTranslationAnimation = useCallback(async (languageChangeFn: () => Promise<any>) => {
    setIsTranslatingState(true);
    // A short delay to allow the animation to start covering the screen before content re-renders
    // Adjust this delay based on the animation's "cover" phase start time
    await new Promise(resolve => setTimeout(resolve, 100)); // e.g., 100ms before content changes

    try {
      await languageChangeFn(); // Execute the actual i18n.changeLanguage()
    } finally {
      // The actual hiding of the animation will be triggered by i18next's 'languageChanged' event
      // or a timeout in the overlay itself after it has finished its course.
      // For now, setIsTranslatingState(false) will be handled by an event listener elsewhere.
      // If not using event listener, could do:
      // setTimeout(() => setIsTranslatingState(false), 1000); // Duration of animation + buffer
    }
  }, []);

  const setIsTranslating = useCallback((translating: boolean) => {
    setIsTranslatingState(translating);
  }, []);

  return (
    <TranslationAnimationContext.Provider value={{ isTranslating, setIsTranslating, triggerTranslationAnimation }}>
      {children}
    </TranslationAnimationContext.Provider>
  );
};
