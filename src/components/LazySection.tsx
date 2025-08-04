import React, { ReactNode } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
  animationClass?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazySection: React.FC<LazySectionProps> = ({
  children,
  className = '',
  fallback = null,
  animationClass = 'animate-fade-in-up',
  threshold = 0.1,
  rootMargin = '100px'
}) => {
  const { targetRef, shouldRender, shouldAnimate } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  return (
    <div
      ref={targetRef}
      className={`${className} ${shouldAnimate ? animationClass : 'opacity-0 translate-y-8'} transition-all duration-700 ease-out`}
    >
      {shouldRender ? children : fallback}
    </div>
  );
};

export default LazySection;