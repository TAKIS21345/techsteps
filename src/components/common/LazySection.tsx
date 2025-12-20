import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  animationClass?: string;
  threshold?: number;
  rootMargin?: string;
  sectionIndex: number;
  canLoad: boolean;
  onLoadComplete: () => void;
}

const LazySection: React.FC<LazySectionProps> = ({
  children,
  className = '',
  fallback = null,
  animationClass = 'animate-fade-in-up',
  threshold = 0.1,
  rootMargin = '100px',
  sectionIndex,
  canLoad,
  onLoadComplete
}) => {
  const { targetRef, shouldRender, shouldAnimate } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  const [hasLoaded, setHasLoaded] = useState(false);
  const loadTriggered = useRef(false);

  useEffect(() => {
    if (canLoad && shouldRender && !loadTriggered.current) {
      loadTriggered.current = true;
      setHasLoaded(true);
      onLoadComplete();
    }
  }, [canLoad, shouldRender, onLoadComplete]);

  if (!canLoad || !shouldRender) {
    return <div ref={targetRef as React.RefObject<HTMLDivElement>} className={className}>{fallback}</div>;
  }

  if (!hasLoaded) {
    return <div ref={targetRef as React.RefObject<HTMLDivElement>} className={className}>{fallback}</div>;
  }

  return (
    <div
      ref={targetRef as React.RefObject<HTMLDivElement>}
      className={`${className} ${shouldAnimate ? animationClass : 'opacity-0 translate-y-8'} transition-all duration-700 ease-out`}
    >
      {children}
    </div>
  );
};

export default LazySection;
