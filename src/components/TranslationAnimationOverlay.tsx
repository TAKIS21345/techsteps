import React, { useState, useEffect } from 'react';

interface TranslationAnimationOverlayProps {
  isActive: boolean;
  onAnimationComplete?: () => void; // Optional callback when animation finishes
}

const TranslationAnimationOverlay: React.FC<TranslationAnimationOverlayProps> = ({ isActive, onAnimationComplete }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'expanding' | 'covering' | 'fading'>('idle');

  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
      setAnimationPhase('expanding');
      // Duration of expansion + cover (e.g., 500ms expand, 200ms cover)
      const coverTimer = setTimeout(() => {
        setAnimationPhase('covering');
        if (onAnimationComplete) {
          // This callback can be used by parent to sync with i18next languageChanged event
          // For now, we'll assume the parent handles hiding the overlay via isActive prop
        }
      }, 700); // Total time for expand and cover before potential fade
      return () => clearTimeout(coverTimer);
    } else if (shouldRender && animationPhase !== 'fading') {
      // If isActive becomes false AND we are not already fading, start fade out
      setAnimationPhase('fading');
      const fadeTimer = setTimeout(() => {
        setAnimationPhase('idle');
        setShouldRender(false);
      }, 300); // Fade out duration
      return () => clearTimeout(fadeTimer);
    }
  }, [isActive, shouldRender, animationPhase, onAnimationComplete]);


  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[200] transition-opacity duration-300 ease-in-out
        ${animationPhase === 'fading' ? 'opacity-0' : 'opacity-100'}`}
    >
      <div
        className={`absolute top-0 left-0 h-0 w-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500
          rounded-br-full  // Makes it expand from top-left corner more diagonally
          shadow-[0_0_30px_15px_rgba(59,130,246,0.3)] // Blueish glow
          transition-all ease-in-out
          ${
            animationPhase === 'expanding'
              ? 'duration-[700ms] w-[150vw] h-[150vh]' // Expand beyond viewport to ensure full diagonal coverage
              : animationPhase === 'covering'
              ? 'duration-0 w-[150vw] h-[150vh] opacity-70' // Hold coverage with some opacity
              : animationPhase === 'fading'
              ? 'duration-[300ms] w-[150vw] h-[150vh] opacity-0' // Start fade out (handled by parent div opacity)
              : 'w-0 h-0 opacity-0' // Initial state
          }`}
      />
      {/* Optional: Add a subtle overlay for the "cover" phase if needed */}
      {animationPhase === 'covering' && (
        <div className="absolute inset-0 bg-black opacity-10"></div>
      )}
    </div>
  );
};

export default TranslationAnimationOverlay;
