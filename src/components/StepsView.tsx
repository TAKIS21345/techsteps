import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Volume2, Home, MessageCircle } from 'lucide-react';
import ResourceRecommendations from './ResourceRecommendations';
import { crispService } from '../utils/crispService';
import { chatMemoryService } from '../utils/chatMemoryService';
import { ttsService } from '../utils/ttsService';

interface StepsViewProps {
  steps: string[];
  resources?: any[];
  onBack: () => void;
  onResourceClick?: (resource: any) => void;
  userName?: string;
  userProfile?: any;
  originalQuestion?: string;
  updateUserData?: (data: any) => Promise<void>;
}

const StepsView: React.FC<StepsViewProps> = ({ 
  steps, 
  resources = [], 
  onBack, 
  onResourceClick,
  userName,
  userProfile,
  originalQuestion = '',
  updateUserData
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingStep, setPlayingStep] = useState<number | null>(null);
  const [hasCompletedSteps, setHasCompletedSteps] = useState(false);

  useEffect(() => {
    // Auto-advance to main view after completing all steps
    if (currentStep === steps.length - 1 && steps.length > 0) {
      setHasCompletedSteps(true);
      
      // Save successful completion to memory
      if (updateUserData && userProfile) {
        chatMemoryService.analyzeAndSaveMemory(
          userProfile.uid || 'anonymous',
          {
            question: originalQuestion,
            response: steps,
            userProfile,
            successful: true
          },
          updateUserData
        );
      }
      
      const timer = setTimeout(() => {
        onBack();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, steps.length, onBack]);

  useEffect(() => {
    // Cleanup TTS on unmount
    return () => {
      ttsService.stop();
    };
  }, []);

  const speakText = (text: string, stepIndex: number) => {
    // If already playing this step, stop it
    if (isPlaying && playingStep === stepIndex) {
      ttsService.stop();
      setIsPlaying(false);
      setPlayingStep(null);
      return;
    }

    // Stop any currently playing audio
    ttsService.stop();
    
    // Extract clean text from HTML
    const cleanText = extractTextFromHTML(text);
    
    setPlayingStep(stepIndex);
    
    ttsService.speak(
      cleanText,
      { speed: 0.85 }, // Slightly slower for seniors
      () => setIsPlaying(true), // onStart
      () => { // onEnd
        setIsPlaying(false);
        setPlayingStep(null);
      },
      (error) => { // onError
        console.error('TTS Error:', error);
        setIsPlaying(false);
        setPlayingStep(null);
        alert('Sorry, text-to-speech is not available right now.');
      }
    );
  };

  const extractTextFromHTML = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      ttsService.stop();
      setIsPlaying(false);
      setPlayingStep(null);
    }
  };

  const goToNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      ttsService.stop();
      setIsPlaying(false);
      setPlayingStep(null);
    }
  };

  const handleNeedHelp = () => {
    // Save that user needed help at this step
    if (updateUserData && userProfile) {
      chatMemoryService.analyzeAndSaveMemory(
        userProfile.uid || 'anonymous',
        {
          question: `${originalQuestion} - Needed help at step ${currentStep + 1}`,
          response: steps.slice(0, currentStep + 1),
          userProfile,
          successful: false
        },
        updateUserData
      );
    }
    
    // Open Crisp chat with context
    crispService.openChat({
      question: originalQuestion,
      steps: steps,
      userProfile: userProfile
    });
  };

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <div className="text-lg font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </div>
            <button
              onClick={handleNeedHelp}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Need Help?
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto w-full">
          <div className="relative">
            {/* Step Card */}
            <div className="card p-12 text-center min-h-[400px] flex flex-col justify-center items-center relative">
              <div 
                className="text-xl md:text-2xl leading-relaxed text-gray-800 mb-8"
                dangerouslySetInnerHTML={{ __html: steps[currentStep] }}
              />

              {/* Text-to-Speech Button */}
              <button
                onClick={() => speakText(steps[currentStep], currentStep)}
                className={`absolute bottom-6 right-6 p-3 rounded-full transition-colors group ${
                  isPlaying && playingStep === currentStep
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title="Read this step aloud"
              >
                <Volume2 className={`w-6 h-6 transition-colors ${
                  isPlaying && playingStep === currentStep
                    ? 'text-blue-600 animate-pulse'
                    : 'group-hover:text-blue-600'
                }`} />
              </button>
              
              {/* Need Help Button */}
              <button
                onClick={handleNeedHelp}
                className="absolute bottom-6 left-6 p-3 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 transition-colors group"
                title="Get help from a human"
              >
                <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Navigation Arrows */}
            {currentStep > 0 && (
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="w-6 h-6 text-blue-600" />
              </button>
            )}

            {currentStep < steps.length - 1 && (
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="w-6 h-6 text-blue-600" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-center mb-4">
              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'bg-blue-600 scale-125'
                        : index < currentStep
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Completion Message */}
          {currentStep === steps.length - 1 && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center px-6 py-3 bg-green-100 border border-green-200 rounded-xl">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-green-800 font-medium">
                  {userName ? `Great job, ${userName}!` : 'Well done!'} Returning to dashboard...
                </span>
              </div>
              
              {/* Still need help option */}
              <div className="mt-4">
                <button
                  onClick={handleNeedHelp}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Still need help? Connect with a real person →
                </button>
              </div>
              
              {/* Show resources after completion */}
              {resources.length > 0 && onResourceClick && (
                <ResourceRecommendations
                  resources={resources}
                  onResourceClick={onResourceClick}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepsView;