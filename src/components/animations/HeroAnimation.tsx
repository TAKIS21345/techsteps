import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

// Lazy load the Lottie component
const DotLottieReact = lazy(() =>
  import('@lottiefiles/dotlottie-react').then(module => ({
    default: module.DotLottieReact
  }))
);

interface HeroAnimationProps {
  className?: string;
}

const HeroAnimation: React.FC<HeroAnimationProps> = ({ className = '' }) => {
  const { isReducedMotion } = useAccessibility();
  const [animationError, setAnimationError] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  // Detect low-end devices based on hardware concurrency and memory
  useEffect(() => {
    const checkDeviceCapabilities = () => {
      const hardwareConcurrency = navigator.hardwareConcurrency || 1;
      const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 2; // Default to 2GB if not available

      // Consider device low-end if it has <= 2 cores or <= 2GB RAM
      const isLowEnd = hardwareConcurrency <= 2 || deviceMemory <= 2;
      setIsLowEndDevice(isLowEnd);
    };

    checkDeviceCapabilities();
  }, []);

  // Fallback static image component
  const FallbackImage = () => (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-full max-w-md mx-auto">
        <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Learning Made Simple
          </h3>
          <p className="text-gray-600">
            Your friendly guide to technology
          </p>
        </div>
      </div>
    </div>
  );

  // Show fallback if reduced motion is enabled, device is low-end, or animation failed
  if (isReducedMotion || isLowEndDevice || animationError) {
    return <FallbackImage />;
  }

  return (
    <div className={`flex items-center justify-center ${className} relative`}>
      <div className="w-full max-w-md mx-auto">
        <Suspense fallback={<FallbackImage />}>
          <DotLottieReact
            src="https://lottie.host/6ec10db7-40f0-4aa1-897f-be793dd1d9bc/g3MaA0uyD6.lottie"
            loop
            autoplay
            className="w-full h-auto max-h-96"
            style={{ maxWidth: '400px' }}
            onError={() => {
              console.warn('Lottie animation failed to load, falling back to static image');
              setAnimationError(true);
            }}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default HeroAnimation;