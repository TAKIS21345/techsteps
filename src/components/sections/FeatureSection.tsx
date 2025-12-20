import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Headphones, Camera, Users, Shield, Zap, LucideIcon } from 'lucide-react';
import { motion, useMotionValue, animate, MotionValue } from 'framer-motion';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useTranslation, useRTLStyles } from '../../hooks/useTranslation';

// Simple mobile feature card component
interface MobileFeatureCardProps {
  feature: { title: string };
  icon: LucideIcon;
  color: string;
  index: number;
}

const MobileFeatureCard: React.FC<MobileFeatureCardProps> = ({
  feature,
  icon: Icon,
  color,
  index
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300">
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-${color}-100`}
      >
        <Icon className={`w-8 h-8 text-${color}-600`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 leading-tight">{feature.title}</h3>
    </div>
  );
};

// Desktop animated feature card component
interface FeatureCardProps {
  feature: { title: string };
  icon: LucideIcon;
  color: string;
  offset: number;
  pathRef: React.RefObject<SVGPathElement>;
  progress: MotionValue<number>;
  containerSize: { width: number; height: number };
  isReducedMotion: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  feature,
  icon: Icon,
  color,
  offset,
  pathRef,
  progress,
  containerSize,
  isReducedMotion
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const pathX = useMotionValue(0);
  const pathY = useMotionValue(0);

  useEffect(() => {
    if (!pathRef.current) return;

    const path = pathRef.current;
    const len = path.getTotalLength();

    const updatePosition = (p: number) => {
      // Keep same path for all languages - no RTL path changes
      const pct = (p + offset) % 1;
      const pt = path.getPointAtLength(pct * len);

      // Light clamping to prevent extreme overflow while keeping cards visible
      const cardWidth = 200;
      const buffer = 50;
      const minX = buffer;
      const maxX = containerSize.width - buffer;

      // Only clamp if really necessary (cards going way off screen)
      const clampedX = pt.x < -cardWidth / 2 ? minX :
        pt.x > containerSize.width + cardWidth / 2 ? maxX : pt.x;

      pathX.set(pt.x);
      pathY.set(pt.y);
      x.set(clampedX);
      y.set(pt.y + 40); // Offset for rope length
    };

    if (isReducedMotion) {
      // Static positioning for reduced motion
      updatePosition(0);
      return;
    }

    const unsubscribe = progress.on('change', updatePosition);
    return unsubscribe;
  }, [offset, progress, x, y, pathX, pathY, isReducedMotion, containerSize.width, pathRef]);

  return (
    <React.Fragment>
      {/* Individual rope string connecting to main path */}
      <motion.div
        style={{
          position: 'absolute',
          left: pathX,
          top: pathY,
          zIndex: 15
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            width: '2px',
            height: '40px',
            backgroundColor: '#9ca3af',
            transformOrigin: 'top center',
            left: '-1px',
            top: '0px'
          }}
          animate={isReducedMotion ? {} : {
            rotate: [0, 2, -2, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatType: 'mirror'
          }}
        />
      </motion.div>

      {/* Card */}
      <motion.div
        style={{
          position: 'absolute',
          x,
          y,
          width: 160,
          height: 160,
          translateX: '-50%',
          translateY: '-50%',
          zIndex: 20
        }}
      >
        {/* Swinging animation only if motion is enabled */}
        <motion.div
          animate={isReducedMotion ? {} : {
            y: [0, -6, 0],
            rotate: [0, 1, -1, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatType: 'mirror'
          }}
        >
          <div
            className="backdrop-blur-md border shadow-xl rounded-2xl text-center hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              width: '160px',
              height: '160px',
              padding: '16px',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto"
              style={{
                background: `rgba(${getColorRGB(color)}, 0.15)`,
                backdropFilter: 'blur(10px)',
                border: `2px solid rgba(${getColorRGB(color)}, 0.4)`,
                boxShadow: `0 4px 12px rgba(${getColorRGB(color)}, 0.2)`,
              }}
            >
              <Icon
                className="w-6 h-6 transition-colors duration-300"
                style={{
                  color: `rgb(${getColorRGB(color)})`,
                }}
              />
            </div>
            <h3 className="text-xs font-semibold text-gray-900 leading-tight text-center px-1 flex-1 flex items-center justify-center">{feature.title}</h3>
          </div>
        </motion.div>
      </motion.div>
    </React.Fragment>
  );
};

// Helper function to get RGB values for colors
const getColorRGB = (color: string): string => {
  const colorMap: Record<string, string> = {
    blue: '37, 99, 235',      // Darker blue for better contrast
    green: '22, 163, 74',     // Darker green
    purple: '126, 34, 206',   // Darker purple  
    orange: '234, 88, 12',    // Darker orange
    red: '220, 38, 38',       // Darker red
    yellow: '202, 138, 4',    // Darker yellow
  };
  return colorMap[color] || '37, 99, 235';
};

// Simple background for mobile
const SimpleBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
      <div className="absolute top-20 -right-20 w-96 h-96 bg-gradient-to-br from-pink-400/15 to-orange-500/15 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-gradient-to-br from-green-400/15 to-teal-500/15 rounded-full blur-3xl"></div>
    </div>
  );
};

// Abstract background component for desktop
const AbstractBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated gradient blobs */}
      <motion.div
        className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-20 -right-20 w-96 h-96 bg-gradient-to-br from-pink-400/25 to-orange-500/25 rounded-full blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1.2, 1, 1.2],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-20 left-1/3 w-72 h-72 bg-gradient-to-br from-green-400/20 to-teal-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, -60, 0],
          y: [0, -40, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-40 -right-32 w-64 h-64 bg-gradient-to-br from-yellow-400/25 to-red-500/25 rounded-full blur-3xl"
        animate={{
          x: [0, 40, 0],
          y: [0, -80, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Additional smaller floating elements */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-32 h-32 rounded-full blur-2xl opacity-20`}
          style={{
            background: `linear-gradient(45deg, 
              hsl(${i * 45}, 70%, 60%), 
              hsl(${(i * 45 + 60) % 360}, 70%, 70%))`,
            left: `${10 + (i * 12)}%`,
            top: `${15 + (i * 8)}%`,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 15, 0],
            scale: [1, 1.1, 0.9, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
};

const FeatureSection: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, direction } = useRTLStyles();
  const { isReducedMotion } = useAccessibility();
  const [containerSize, setContainerSize] = useState({ width: 900, height: 600 });
  const [isMobile, setIsMobile] = useState(false);

  // Get features data - handle both array and object formats
  const featuresData = t('landing.featuresSection.items', { returnObjects: true });
  let features: { title: string }[] = [];

  if (Array.isArray(featuresData)) {
    features = featuresData;
  } else if (typeof featuresData === 'object' && featuresData !== null) {
    // If it's an object, convert to array
    features = Object.values(featuresData as Record<string, { title: string }>);
  } else {
    // Fallback to default features if translation fails
    features = [
      { title: 'Step-by-Step Guidance' },
      { title: 'Voice Support' },
      { title: 'Photo Explainer' },
      { title: 'Senior-Friendly Design' },
      { title: 'Safe & Secure' },
      { title: 'Instant Answers' }
    ];
  }

  const icons = [MessageSquare, Headphones, Camera, Users, Shield, Zap];
  const colors = ["blue", "green", "purple", "orange", "red", "yellow"];

  // SVG path ref for the rope
  const pathRef = useRef<SVGPathElement>(null);
  // Shared progress MotionValue (0→1)
  const progress = useMotionValue(0);

  // Update container size and mobile state on resize
  useEffect(() => {
    const updateSize = () => {
      const width = Math.min(window.innerWidth * 0.85, 900);
      const height = Math.min(window.innerHeight * 0.7, 600);
      const mobile = window.innerWidth < 768; // md breakpoint
      setContainerSize({ width, height });
      setIsMobile(mobile);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (isReducedMotion || isMobile) return;

    // Animate progress 0→1 continuously around the rope
    const controls = animate(progress, 1, {
      duration: 25,
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'loop'
    });
    return () => controls.stop();
  }, [progress, isReducedMotion, isMobile]);

  // Calculate responsive dimensions for desktop
  const centerX = containerSize.width / 2;
  const centerY = containerSize.height / 2;
  const headerWidth = Math.min(450, containerSize.width * 0.6);
  const headerHeight = 180;
  const margin = Math.min(140, containerSize.width * 0.15);

  const pathLeft = centerX - (headerWidth / 2 + margin);
  const pathTop = centerY - (headerHeight / 2 + margin);
  const pathWidth = headerWidth + margin * 2;
  const pathHeight = headerHeight + margin * 2;
  const corner = 30;

  // Mobile layout
  if (isMobile) {
    return (
      <section
        id="features"
        className="py-16 sm:py-20 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        {/* Simple background for mobile */}
        <SimpleBackground />

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/10" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t('landing.featuresSection.title')}
            </h2>
            <p className="text-lg text-white/90 leading-relaxed max-w-2xl mx-auto">
              {t('landing.featuresSection.subtitle')}
            </p>
          </div>

          {/* Mobile grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {features.map((feature, idx) => (
              <MobileFeatureCard
                key={idx}
                feature={feature}
                icon={icons[idx]}
                color={colors[idx]}
                index={idx}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Desktop layout with animations
  return (
    <section
      id="features"
      className="py-16 sm:py-20 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Abstract animated background */}
      <AbstractBackground />

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/10" />

      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-center">
          <div
            className={`relative ${isRTL ? 'rtl' : 'ltr'}`}
            style={{
              width: containerSize.width,
              height: containerSize.height,
              minHeight: '600px',
              direction: isRTL ? 'rtl' : 'ltr'
            }}
          >
            {/* Center Feature Box */}
            <div
              className="absolute bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 flex flex-col items-center justify-center z-30"
              style={{
                left: centerX - headerWidth / 2,
                top: centerY - headerHeight / 2,
                width: headerWidth,
                height: headerHeight,
                padding: '32px',
                direction: isRTL ? 'rtl' : 'ltr'
              }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 text-center">
                {t('landing.featuresSection.title')}
              </h2>
              <p className="text-base sm:text-lg text-white/90 text-center leading-relaxed">
                {t('landing.featuresSection.subtitle')}
              </p>
            </div>

            {/* Rope path */}
            <svg
              className="absolute inset-0 z-10 pointer-events-none"
              width={containerSize.width}
              height={containerSize.height}
            >
              <path
                ref={pathRef}
                d={`
                  M${pathLeft + corner},${pathTop}
                  h${pathWidth - corner * 2}
                  a${corner},${corner} 0 0 1 ${corner},${corner}
                  v${pathHeight - corner * 2}
                  a${corner},${corner} 0 0 1 -${corner},${corner}
                  h-${pathWidth - corner * 2}
                  a${corner},${corner} 0 0 1 -${corner},-${corner}
                  v-${pathHeight - corner * 2}
                  a${corner},${corner} 0 0 1 ${corner},-${corner}
                  z
                `}
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="3"
                opacity="0.7"
              />
            </svg>

            {/* Orbiting cards */}
            {features.map((feature, idx) => (
              <FeatureCard
                key={idx}
                feature={feature}
                icon={icons[idx]}
                color={colors[idx]}
                offset={idx / features.length}
                pathRef={pathRef}
                progress={progress}
                containerSize={containerSize}
                isReducedMotion={isReducedMotion}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;