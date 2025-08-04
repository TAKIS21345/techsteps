import React, { useEffect, useRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  index: number;
  side: 'left' | 'right';
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon: IconComponent,
  color,
  index,
  side
}) => {
  const { isReducedMotion } = useAccessibility();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  useEffect(() => {
    // Check device capabilities
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 2;
    const isLowEnd = hardwareConcurrency <= 2 || deviceMemory <= 2;
    setIsLowEndDevice(isLowEnd);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      {
        threshold: isLowEnd ? 0.1 : 0.2, // Lower threshold for low-end devices
        rootMargin: isLowEnd ? '100px' : '50px' // Larger margin for earlier loading
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [hasAnimated]);

  // Calculate animation delay for staggered effect - reduce delay on low-end devices
  const animationDelay = isReducedMotion || isLowEndDevice ? 0 : index * 150;

  // Animation classes based on side and reduced motion preference
  const getAnimationClasses = () => {
    if (isReducedMotion || isLowEndDevice) {
      return 'opacity-100 transform translate-x-0 translate-y-0 rotate-0';
    }

    const baseClasses = 'transition-all duration-700 ease-out';

    if (!isVisible) {
      // Initial state - cards start from different positions to create swirl effect
      const initialTransform = side === 'left'
        ? 'translate-x-[-100px] translate-y-[50px] rotate-[-15deg]'
        : 'translate-x-[100px] translate-y-[50px] rotate-[15deg]';

      return `${baseClasses} opacity-0 transform ${initialTransform} scale-90`;
    }

    // Final state - cards settle into position
    return `${baseClasses} opacity-100 transform translate-x-0 translate-y-0 rotate-0 scale-100`;
  };

  return (
    <div
      ref={cardRef}
      className={`card p-6 md:p-8 text-center hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2 ${getAnimationClasses()}`}
      style={{
        animationDelay: `${animationDelay}ms`,
        transitionDelay: (isReducedMotion || isLowEndDevice) ? '0ms' : `${animationDelay}ms`
      }}
    >
      <div className={`w-16 h-16 md:w-20 md:h-20 bg-${color}-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
        <IconComponent className={`w-8 h-8 md:w-10 md:h-10 text-${color}-600`} />
      </div>
      <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-6">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-base sm:text-lg md:text-xl">{description}</p>
    </div>
  );
};

export default FeatureCard;