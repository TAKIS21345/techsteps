import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Volume2 } from 'lucide-react';
import { FlashcardStep } from '../../types/services';
import AudioPlaybackControls from './AudioPlaybackControls';
import GLBAvatar from './avatar/GLBAvatar';
import { useFlashcardAvatar } from '../../hooks/useFlashcardAvatar';

interface FlashcardDisplayProps {
  steps: FlashcardStep[];
  currentStep?: number;
  onStepChange?: (step: number) => void;
  className?: string;
  autoPlayAudio?: boolean;
  showAudioControls?: boolean;
  onComplete?: () => void;
}

export const FlashcardDisplay: React.FC<FlashcardDisplayProps> = ({
  steps,
  currentStep = 0,
  onStepChange,
  className = '',
  autoPlayAudio = false,
  showAudioControls = true,
  onComplete
}) => {
  const [activeStep, setActiveStep] = useState(currentStep);
  const [showAudio, setShowAudio] = useState(showAudioControls);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  // Avatar integration
  const { state: avatarState, actions: avatarActions } = useFlashcardAvatar(true);

  // Update active step when prop changes
  useEffect(() => {
    setActiveStep(currentStep);
  }, [currentStep]);

  // Show avatar when flashcards are displayed
  useEffect(() => {
    if (steps.length > 0) {
      avatarActions.showAvatar();
    }
    
    return () => {
      avatarActions.hideAvatar();
    };
  }, [steps.length, avatarActions]);

  // Auto-play audio when step changes (if enabled)
  useEffect(() => {
    if (autoPlayAudio && steps[activeStep]) {
      // Small delay to allow component to render
      setTimeout(() => {
        const audioControls = document.querySelector('.audio-playback-controls button[aria-label*="Play"]') as HTMLButtonElement;
        if (audioControls && !audioControls.disabled) {
          audioControls.click();
        }
      }, 500);
    }
  }, [activeStep, autoPlayAudio, steps]);

  const currentStepData = steps[activeStep];
  const totalSteps = steps.length;
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === totalSteps - 1;

  // Navigation handlers
  const goToNextStep = useCallback(() => {
    if (!isLastStep) {
      const newStep = activeStep + 1;
      setActiveStep(newStep);
      onStepChange?.(newStep);
      
      // Mark current step as completed
      setCompletedSteps(prev => new Set([...prev, activeStep]));
      
      // Avatar reaction for completing a step
      avatarActions.onUserInteraction();
    } else if (onComplete) {
      // Mark final step as completed
      setCompletedSteps(prev => new Set([...prev, activeStep]));
      
      // Avatar reaction for completing all steps
      avatarActions.onUserInteraction();
      onComplete();
    }
  }, [activeStep, isLastStep, onStepChange, onComplete, avatarActions]);

  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      const newStep = activeStep - 1;
      setActiveStep(newStep);
      onStepChange?.(newStep);
    }
  }, [activeStep, isFirstStep, onStepChange]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setActiveStep(stepIndex);
      onStepChange?.(stepIndex);
    }
  }, [totalSteps, onStepChange]);

  const restartFromBeginning = useCallback(() => {
    setActiveStep(0);
    setCompletedSteps(new Set());
    onStepChange?.(0);
  }, [onStepChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousStep();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextStep();
          break;
        case 'Home':
          event.preventDefault();
          goToStep(0);
          break;
        case 'End':
          event.preventDefault();
          goToStep(totalSteps - 1);
          break;
        case 'r':
        case 'R':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            restartFromBeginning();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextStep, goToPreviousStep, goToStep, totalSteps, restartFromBeginning]);

  // Swipe gesture support for mobile
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const diffX = startX - endX;
      const diffY = startY - endY;

      // Only trigger if horizontal swipe is more significant than vertical
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          // Swipe left - next step
          goToNextStep();
        } else {
          // Swipe right - previous step
          goToPreviousStep();
        }
      }

      startX = 0;
      startY = 0;
    };

    const flashcardElement = document.querySelector('.flashcard-container');
    if (flashcardElement) {
      flashcardElement.addEventListener('touchstart', handleTouchStart);
      flashcardElement.addEventListener('touchend', handleTouchEnd);

      return () => {
        flashcardElement.removeEventListener('touchstart', handleTouchStart);
        flashcardElement.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [goToNextStep, goToPreviousStep]);

  if (!steps || steps.length === 0) {
    return (
      <div className={`flashcard-display ${className}`}>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No steps available to display.
          </p>
        </div>
      </div>
    );
  }

  if (!currentStepData) {
    return (
      <div className={`flashcard-display ${className}`}>
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">
            Step {activeStep + 1} not found.
          </p>
        </div>
      </div>
    );
  }

  // Prepare text for audio (combine title, content, and instructions)
  const audioText = [
    `Step ${currentStepData.stepNumber}: ${currentStepData.title}`,
    currentStepData.content,
    ...currentStepData.instructions.map((instruction, index) => 
      `Instruction ${index + 1}: ${instruction}`
    )
  ].join('. ');

  // Function to make avatar speak the current step
  const speakCurrentStep = useCallback(() => {
    avatarActions.speakText(audioText);
  }, [audioText, avatarActions]);

  return (
    <div className={`flashcard-display ${className}`}>
      {/* Progress indicators */}
      <div className="flex justify-center mb-6">
        <div className="flex space-x-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => goToStep(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                index === activeStep
                  ? 'bg-blue-600 scale-125'
                  : completedSteps.has(index)
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Main flashcard container */}
      <div className="flashcard-container bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Card header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Step {currentStepData.stepNumber}
              </h2>
              <h3 className="text-xl font-semibold opacity-90">
                {currentStepData.title}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-75">
                {activeStep + 1} of {totalSteps}
              </div>
              {currentStepData.estimatedDuration && (
                <div className="text-sm opacity-75">
                  ~{Math.ceil(currentStepData.estimatedDuration / 60)} min
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card content */}
        <div className="p-6">
          {/* Main content */}
          <div className="mb-6">
            <div className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 mb-4">
              {currentStepData.content}
            </div>

            {/* Instructions list */}
            {currentStepData.instructions && currentStepData.instructions.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                  Instructions:
                </h4>
                <ol className="list-decimal list-inside space-y-2">
                  {currentStepData.instructions.map((instruction, index) => (
                    <li key={index} className="text-blue-700 dark:text-blue-300">
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Audio controls */}
          {showAudio && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <Volume2 size={20} className="mr-2" />
                  Read Aloud
                </h4>
                <button
                  onClick={() => setShowAudio(!showAudio)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {showAudio ? 'Hide' : 'Show'} Audio Controls
                </button>
              </div>
              
              <div className="space-y-3">
                <AudioPlaybackControls
                  text={audioText}
                  autoHighlight={false}
                  onError={(error) => console.error('Audio playback error:', error)}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                />
                
                {/* Avatar Speech Button */}
                <button
                  onClick={speakCurrentStep}
                  className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300"
                >
                  <Volume2 size={16} className="mr-2" />
                  Have Avatar Read This Step
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation controls */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Previous button */}
            <button
              onClick={goToPreviousStep}
              disabled={isFirstStep}
              className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-300"
              aria-label="Go to previous step"
            >
              <ChevronLeft size={20} className="mr-2" />
              Previous
            </button>

            {/* Restart button */}
            <button
              onClick={restartFromBeginning}
              className="flex items-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-green-300"
              aria-label="Restart from beginning"
            >
              <RotateCcw size={20} />
            </button>

            {/* Next/Complete button */}
            <button
              onClick={goToNextStep}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
              aria-label={isLastStep ? 'Complete steps' : 'Go to next step'}
            >
              {isLastStep ? 'Complete' : 'Next'}
              {!isLastStep && <ChevronRight size={20} className="ml-2" />}
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(((activeStep + 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((activeStep + 1) / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="mt-4 text-center">
        <details className="text-sm text-gray-500 dark:text-gray-400">
          <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            Keyboard Shortcuts
          </summary>
          <div className="mt-2 space-y-1">
            <p>← → Arrow keys: Navigate between steps</p>
            <p>Home/End: Go to first/last step</p>
            <p>Ctrl+R: Restart from beginning</p>
            <p>Swipe left/right on mobile to navigate</p>
          </div>
        </details>
      </div>

      {/* GLB Avatar - Appears in bottom-right corner */}
      <GLBAvatar
        isVisible={avatarState.isVisible}
        textToSpeak={avatarState.textToSpeak}
        onSpeechComplete={() => {
          console.log('Avatar finished speaking');
        }}
      />
    </div>
  );
};

export default FlashcardDisplay;