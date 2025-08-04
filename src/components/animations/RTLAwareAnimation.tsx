import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useRTLStyles } from '../../hooks/useTranslation';

interface RTLAwareAnimationProps {
  children: React.ReactNode;
  animationType?: 'swirl' | 'slide' | 'fade' | 'scale';
  delay?: number;
  duration?: number;
  className?: string;
  reducedMotion?: boolean;
}

export const RTLAwareAnimation: React.FC<RTLAwareAnimationProps> = ({
  children,
  animationType = 'swirl',
  delay = 0,
  duration = 0.6,
  className = '',
  reducedMotion = false
}) => {
  const { isRTL } = useRTLStyles();
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  // Define animation variants based on type and RTL
  const getAnimationVariants = () => {
    if (reducedMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
      };
    }

    switch (animationType) {
      case 'swirl':
        return {
          hidden: {
            opacity: 0,
            scale: 0.8,
            rotate: isRTL ? 15 : -15,
            x: isRTL ? 50 : -50,
            y: 20
          },
          visible: {
            opacity: 1,
            scale: 1,
            rotate: 0,
            x: 0,
            y: 0,
            transition: {
              type: 'spring',
              stiffness: 100,
              damping: 15,
              duration,
              delay
            }
          }
        };

      case 'slide':
        return {
          hidden: {
            opacity: 0,
            x: isRTL ? 100 : -100
          },
          visible: {
            opacity: 1,
            x: 0,
            transition: {
              type: 'spring',
              stiffness: 100,
              damping: 20,
              duration,
              delay
            }
          }
        };

      case 'fade':
        return {
          hidden: {
            opacity: 0,
            y: 20
          },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration,
              delay,
              ease: 'easeOut'
            }
          }
        };

      case 'scale':
        return {
          hidden: {
            opacity: 0,
            scale: 0.9
          },
          visible: {
            opacity: 1,
            scale: 1,
            transition: {
              duration,
              delay,
              ease: 'easeOut'
            }
          }
        };

      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
    }
  };

  const variants = getAnimationVariants();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface RTLAwareStaggeredAnimationProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  animationType?: 'swirl' | 'slide' | 'fade' | 'scale';
  className?: string;
  reducedMotion?: boolean;
}

export const RTLAwareStaggeredAnimation: React.FC<RTLAwareStaggeredAnimationProps> = ({
  children,
  staggerDelay = 0.1,
  animationType = 'swirl',
  className = '',
  reducedMotion = false
}) => {
  const { isRTL } = useRTLStyles();

  // For RTL, we might want to reverse the stagger order
  const orderedChildren = isRTL ? [...children].reverse() : children;

  return (
    <div className={className}>
      {orderedChildren.map((child, index) => (
        <RTLAwareAnimation
          key={index}
          animationType={animationType}
          delay={index * staggerDelay}
          reducedMotion={reducedMotion}
        >
          {child}
        </RTLAwareAnimation>
      ))}
    </div>
  );
};

interface RTLAwareHeroAnimationProps {
  children: React.ReactNode;
  className?: string;
  reducedMotion?: boolean;
}

export const RTLAwareHeroAnimation: React.FC<RTLAwareHeroAnimationProps> = ({
  children,
  className = '',
  reducedMotion = false
}) => {
  const { isRTL } = useRTLStyles();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
        staggerChildren: 0.2
      }
    }
  };

  const childVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      x: isRTL ? 20 : -20
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
    >
      <motion.div variants={childVariants}>
        {children}
      </motion.div>
    </motion.div>
  );
};

export default RTLAwareAnimation;