import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Volume2, X, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FlashcardStep } from '../../types/services';
import MarkdownRenderer from './MarkdownRenderer';
import MethodSelector from './MethodSelector';
import EnhancedAvatarCompanion from './EnhancedAvatarCompanion';

interface FlashcardPanelProps {
  steps: FlashcardStep[];
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

export const FlashcardPanel: React.FC<FlashcardPanelProps> = ({
  steps,
  isVisible,
  onClose,
  className = ''
}) => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Group steps by method
  const methodGroups = React.useMemo(() => {
    const groups: { [key: string]: FlashcardStep[] } = {};

    steps.forEach(step => {
      const methodKey = step.methodGroup || 'default';
      if (!groups[methodKey]) {
        groups[methodKey] = [];
      }
      groups[methodKey].push(step);
    });

    return Object.entries(groups).map(([title, steps]) => ({
      title: title === 'default' ? 'Step-by-Step Guide' : title,
      steps,
      difficulty: steps[0]?.methodGroup?.includes('easy') ? 'easy' :
        steps[0]?.methodGroup?.includes('medium') ? 'medium' :
          steps[0]?.methodGroup?.includes('hard') ? 'hard' : undefined
    }));
  }, [steps]);

  const hasMultipleMethods = methodGroups.length > 1;
  const currentSteps = selectedMethod !== null ? methodGroups[selectedMethod]?.steps || [] : steps;

  // Reset when new steps arrive
  useEffect(() => {
    if (steps.length > 0) {
      setActiveStep(0);
      setCompletedSteps(new Set());
      setSelectedMethod(hasMultipleMethods ? null : 0);
      setShowMethodSelector(hasMultipleMethods);
    }
  }, [steps, hasMultipleMethods]);

  if (!isVisible || steps.length === 0) return null;

  // Show method selector if we have multiple methods and none is selected
  if (showMethodSelector && selectedMethod === null) {
    return (
      <div className={`h-full bg-gray-50 flex flex-col ${className}`}>
        {/* Close button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            aria-label={t('common.close', 'Close')}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <MethodSelector
          methods={methodGroups}
          onMethodSelect={(methodIndex) => {
            setSelectedMethod(methodIndex);
            setShowMethodSelector(false);
            setActiveStep(0);
            setCompletedSteps(new Set());
          }}
          className="flex-1 flex flex-col justify-center"
        />
      </div>
    );
  }

  const currentStepData = currentSteps[activeStep];
  const totalSteps = currentSteps.length;
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === totalSteps - 1;

  // Navigation handlers
  const goToNextStep = useCallback(() => {
    if (!isLastStep) {
      const newStep = activeStep + 1;
      setActiveStep(newStep);

      // Mark current step as completed
      setCompletedSteps(prev => new Set([...prev, activeStep]));
    } else {
      // Mark final step as completed
      setCompletedSteps(prev => new Set([...prev, activeStep]));
    }
  }, [activeStep, isLastStep]);

  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      const newStep = activeStep - 1;
      setActiveStep(newStep);
    }
  }, [activeStep, isFirstStep]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setActiveStep(stepIndex);
    }
  }, [totalSteps]);

  // Text-to-speech function with audio sync
  const speakText = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      setIsSpeaking(false);

      // Create new utterance
      const text = currentStepData.content.replace(/<[^>]*>/g, ''); // Remove HTML tags
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8; // Slightly slower for seniors
      utterance.pitch = 1;
      utterance.volume = 1;

      // Audio sync animation
      utterance.onstart = () => {
        setIsSpeaking(true);
        // Simulate audio levels for mouth animation
        const audioInterval = setInterval(() => {
          setAudioLevel(Math.random() * 0.8 + 0.2); // Random audio level between 0.2-1.0
        }, 100);

        utterance.onend = () => {
          setIsSpeaking(false);
          setAudioLevel(0);
          clearInterval(audioInterval);
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          setAudioLevel(0);
          clearInterval(audioInterval);
        };
      };

      // Speak the text
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`h-full bg-gray-50 flex flex-col ${className}`}>
      {/* Close button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
          aria-label={t('common.close', 'Close')}
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 w-full h-full relative">
        {/* Method title and back button */}
        {hasMultipleMethods && selectedMethod !== null && (
          <div className="w-full mb-4">
            <button
              onClick={() => {
                setShowMethodSelector(true);
                setSelectedMethod(null);
              }}
              className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to methods
            </button>
            <h3 className="text-lg font-medium text-gray-900">
              {methodGroups[selectedMethod]?.title}
            </h3>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex space-x-2 mb-6">
          {currentSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => goToStep(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${index === activeStep
                ? 'bg-blue-600 scale-125'
                : completedSteps.has(index)
                  ? 'bg-green-500'
                  : 'bg-gray-300'
                }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Main flashcard - Quizlet style */}
        <div className="relative w-full flex-1 flex flex-col min-h-0">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex-1 flex flex-col justify-center relative overflow-hidden">

            {/* Step Content Container */}
            <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col justify-center items-center">

              {/* Step number badge */}
              <div className="absolute top-6 left-6 px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Step {activeStep + 1} of {totalSteps}
              </div>

              {/* Content */}
              <div className="w-full max-w-3xl mx-auto space-y-8">
                <div className="text-3xl md:text-4xl font-medium leading-tight text-gray-900 text-center">
                  <MarkdownRenderer
                    content={currentStepData.content.replace(/<[^>]*>/g, '')}
                    className="text-center prose prose-lg prose-indigo mx-auto"
                  />
                </div>

                {/* Instructions if any */}
                {currentStepData.instructions && currentStepData.instructions.length > 0 && (
                  <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <ol className="list-decimal list-inside space-y-3 text-gray-700 text-lg">
                      {currentStepData.instructions.map((instruction, index) => (
                        <li key={index}>
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Control */}
            <button
              onClick={speakText}
              className={`absolute top-6 right-6 p-3 rounded-full transition-all duration-200 ${isSpeaking
                ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-400 animate-pulse'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
              {isSpeaking ? <X className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between w-full mt-6 px-4">
          <button
            onClick={goToPreviousStep}
            disabled={isFirstStep}
            className="flex items-center px-6 py-4 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-2xl transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          <div className="flex-1 mx-8">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((activeStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={goToNextStep}
            className="flex items-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-2xl transition-all shadow-md hover:shadow-lg hover:translate-y-[-1px]"
          >
            {isLastStep ? 'Finish' : 'Next'}
            {!isLastStep && <ChevronRight className="w-5 h-5 ml-2" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardPanel;