import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface AnimationDemoProps {
  type: 'power-button' | 'mouse-click' | 'typing' | 'swipe' | 'tap' | 'wifi-connect' | 'app-download';
  title: string;
  description: string;
  steps?: string[];
}

const AnimationDemo: React.FC<AnimationDemoProps> = ({ type, title, description, steps = [] }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setAnimationPhase(prev => {
          if (prev >= 3) {
            setCurrentStep(prevStep => {
              if (prevStep >= steps.length - 1) {
                setIsPlaying(false);
                return 0;
              }
              return prevStep + 1;
            });
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  const resetAnimation = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setAnimationPhase(0);
  };

  const renderAnimation = () => {
    switch (type) {
      case 'power-button':
        return (
          <div className="relative w-48 h-32 bg-gray-800 rounded-lg mx-auto flex items-center justify-center">
            {/* Computer/Device Body */}
            <div className="w-40 h-24 bg-gray-700 rounded border-2 border-gray-600 relative">
              {/* Power Button */}
              <div className={`absolute -top-2 right-4 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center transition-all duration-500 ${
                isPlaying && animationPhase >= 1 ? 'bg-green-400 border-green-300 scale-110' : 'bg-gray-600'
              }`}>
                <div className="w-2 h-3 bg-white rounded-sm"></div>
              </div>
              
              {/* Screen */}
              <div className={`w-32 h-16 bg-black rounded mx-auto mt-2 transition-all duration-1000 ${
                isPlaying && animationPhase >= 2 ? 'bg-blue-400' : ''
              }`}>
                {isPlaying && animationPhase >= 3 && (
                  <div className="text-white text-xs p-2 animate-fade-in">
                    Welcome!
                  </div>
                )}
              </div>
            </div>
            
            {/* Click Indicator */}
            {isPlaying && animationPhase === 1 && (
              <div className="absolute top-2 right-8 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
            )}
          </div>
        );

      case 'mouse-click':
        return (
          <div className="relative w-48 h-32 mx-auto flex items-center justify-center">
            {/* Mouse */}
            <div className="relative">
              <div className="w-16 h-24 bg-gray-300 rounded-t-full rounded-b-lg border-2 border-gray-400 shadow-lg">
                {/* Left Click Button */}
                <div className={`w-6 h-10 bg-gray-400 rounded-t-full ml-1 mt-1 transition-all duration-300 ${
                  isPlaying && animationPhase >= 1 ? 'bg-blue-400 scale-95' : ''
                }`}></div>
                {/* Right Click Button */}
                <div className="w-6 h-10 bg-gray-400 rounded-t-full ml-8 -mt-10"></div>
                {/* Scroll Wheel */}
                <div className="w-2 h-4 bg-gray-500 rounded mx-auto mt-2"></div>
              </div>
              
              {/* Click Effect */}
              {isPlaying && animationPhase >= 1 && (
                <div className="absolute top-2 left-2 w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              )}
            </div>
            
            {/* Cursor on Screen */}
            <div className="ml-8">
              <div className="w-24 h-16 bg-white border-2 border-gray-300 rounded relative overflow-hidden">
                <div className={`absolute transition-all duration-1000 ${
                  isPlaying && animationPhase >= 2 ? 'top-2 left-2' : 'top-8 left-12'
                }`}>
                  <div className="w-0 h-0 border-l-4 border-l-black border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                </div>
                
                {/* Click Target */}
                <div className={`absolute top-2 left-2 w-4 h-4 border-2 border-dashed border-gray-400 rounded transition-all duration-500 ${
                  isPlaying && animationPhase >= 3 ? 'bg-blue-200 border-blue-400' : ''
                }`}></div>
              </div>
            </div>
          </div>
        );

      case 'typing':
        return (
          <div className="w-48 h-32 mx-auto flex items-center justify-center">
            <div className="relative">
              {/* Keyboard */}
              <div className="w-40 h-16 bg-gray-200 rounded border border-gray-300 p-2">
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 bg-white border border-gray-300 rounded text-xs transition-all duration-200 ${
                        isPlaying && animationPhase >= 1 && i === currentStep ? 'bg-blue-400 scale-110' : ''
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
              
              {/* Text Display */}
              <div className="mt-4 h-8 bg-white border border-gray-300 rounded p-2 text-xs">
                {isPlaying && (
                  <span className="animate-pulse">
                    {'Hello World'.substring(0, animationPhase)}
                    <span className="animate-blink">|</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case 'wifi-connect':
        return (
          <div className="w-48 h-32 mx-auto flex items-center justify-center">
            <div className="relative">
              {/* Router */}
              <div className="w-16 h-12 bg-gray-700 rounded relative">
                <div className="w-2 h-6 bg-gray-600 rounded-t mx-auto -mt-2"></div>
                <div className="w-1 h-4 bg-gray-500 rounded mx-auto mt-1"></div>
                
                {/* WiFi Signals */}
                {isPlaying && (
                  <>
                    <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 border-2 border-green-400 rounded-full transition-all duration-1000 ${
                      animationPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    }`}></div>
                    <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 border-2 border-green-400 rounded-full transition-all duration-1000 delay-300 ${
                      animationPhase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    }`}></div>
                    <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 border-2 border-green-400 rounded-full transition-all duration-1000 delay-600 ${
                      animationPhase >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    }`}></div>
                  </>
                )}
              </div>
              
              {/* Device */}
              <div className="mt-8 w-12 h-8 bg-gray-600 rounded mx-auto relative">
                {isPlaying && animationPhase >= 3 && (
                  <div className="absolute -top-1 right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-48 h-32 mx-auto flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-gray-500">Animation Preview</div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      
      {/* Animation Area */}
      <div className="bg-gray-50 rounded-lg p-6 mb-4 min-h-[150px] flex items-center justify-center">
        {renderAnimation()}
      </div>
      
      {/* Steps */}
      {steps.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Steps:</h4>
          <ol className="text-sm text-gray-600 space-y-1">
            {steps.map((step, index) => (
              <li 
                key={index} 
                className={`flex items-start space-x-2 ${
                  isPlaying && index === currentStep ? 'text-blue-600 font-medium' : ''
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                  isPlaying && index === currentStep 
                    ? 'bg-blue-600 text-white' 
                    : index < currentStep && isPlaying
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      
      {/* Controls */}
      <div className="flex justify-center space-x-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
            isPlaying 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Play Demo
            </>
          )}
        </button>
        
        <button
          onClick={resetAnimation}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </button>
      </div>
    </div>
  );
};

export default AnimationDemo;