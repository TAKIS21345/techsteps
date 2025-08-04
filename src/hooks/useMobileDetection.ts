import { useState, useEffect } from 'react';

interface MobileDetectionState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation: 'portrait' | 'landscape';
}

export function useMobileDetection(): MobileDetectionState {
  const [state, setState] = useState<MobileDetectionState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        screenSize: 'lg',
        orientation: 'landscape',
      };
    }

    return getDeviceInfo();
  });

  useEffect(() => {
    const handleResize = () => {
      setState(getDeviceInfo());
    };

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(() => {
        setState(getDeviceInfo());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return state;
}

function getDeviceInfo(): MobileDetectionState {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Determine screen size based on Tailwind breakpoints
  let screenSize: MobileDetectionState['screenSize'];
  if (width < 640) screenSize = 'sm';
  else if (width < 768) screenSize = 'md';
  else if (width < 1024) screenSize = 'lg';
  else if (width < 1280) screenSize = 'xl';
  else screenSize = '2xl';

  // Detect device type
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Detect touch capability
  const isTouchDevice = 'ontouchstart' in window || 
                       navigator.maxTouchPoints > 0 ||
                       (navigator as any).msMaxTouchPoints > 0;

  // Determine orientation
  const orientation: MobileDetectionState['orientation'] = height > width ? 'portrait' : 'landscape';

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    screenSize,
    orientation,
  };
}